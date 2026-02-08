import { MeiliSearch } from 'meilisearch';
import { Coupon } from '../models/Coupon.js';
import { normalizeText } from '../utils/vietnameseNormalize.js';

const INDEX_NAME = 'coupons';

function getClient() {
  const host = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
  const key = process.env.MEILISEARCH_API_KEY || '';
  return new MeiliSearch({ host, apiKey: key });
}

/**
 * Chuyển doc Coupon sang document Meilisearch
 */
function toSearchDoc(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  const name = obj.name || '';
  const content = obj.content || '';
  const categoriesArr = Array.isArray(obj.categories)
    ? obj.categories
    : [];
  const categories = categoriesArr.map((c) => c.category_name_show || c.category_name || '').filter(Boolean).join(' ');
  const category_names = categoriesArr.map((c) => c.category_name || c.category_name_show).filter(Boolean);
  const coupons = Array.isArray(obj.coupons)
    ? obj.coupons.map((c) => [c.coupon_code, c.coupon_desc].filter(Boolean).join(' ')).join(' ')
    : '';

  return {
    id: obj.accesstradeId || obj._id?.toString(),
    name,
    name_normalized: normalizeText(name),
    content,
    content_normalized: normalizeText(content),
    merchant: obj.merchant || '',
    categories,
    categories_normalized: normalizeText(categories),
    category_names,
    domain: obj.domain || 'shopee.vn',
    start_time: obj.start_date || '',
    end_time: obj.end_date || '',
    link: obj.prod_link || obj.link || '',
    coupon_codes: coupons,
    coupon_codes_normalized: normalizeText(coupons),
    isNextDayCoupon: !!obj.isNextDayCoupon,
    is_hot: obj.is_hot || '',
    discount_value: obj.discount_value ?? 0,
    discount_percentage: obj.discount_percentage ?? 0
  };
}

/**
 * Khởi tạo index: tạo nếu chưa có, cấu hình searchable/ranking/typo/synonyms
 */
export async function setupIndex() {
  const client = getClient();

  const indexes = await client.getIndexes();
  const exists = indexes.results?.some((i) => i.uid === INDEX_NAME);
  if (!exists) {
    await client.createIndex(INDEX_NAME, { primaryKey: 'id' });
  }

  const index = client.index(INDEX_NAME);
  await index.updateSettings({
    searchableAttributes: [
      'name',
      'name_normalized',
      'content',
      'content_normalized',
      'merchant',
      'categories',
      'categories_normalized',
      'coupon_codes',
      'coupon_codes_normalized'
    ],
    sortableAttributes: ['discount_value', 'discount_percentage', 'end_time'],
    filterableAttributes: ['domain', 'isNextDayCoupon', 'merchant', 'is_hot', 'category_names'],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
      'discount_value:desc',
      'discount_percentage:desc'
    ],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
      disableOnWords: [],
      disableOnAttributes: []
    },
    synonyms: {
      japa: ['japan'],
      babi: ['baby'],
      jp: ['japan'],
      nhat_ban: ['japan'],
      'nhat ban': ['japan']
    }
  });

  return index;
}

/**
 * Đồng bộ toàn bộ coupons từ DB sang Meilisearch
 */
export async function syncCouponsToMeilisearch() {
  const index = await setupIndex();

  const docs = await Coupon.find({}).lean();
  const documents = docs.map((d) => toSearchDoc(d));

  if (documents.length === 0) {
    // console.log('[MEILISEARCH] No coupons to sync');
    return { index: 0, total: 0 };
  }

  const task = await index.updateDocuments(documents);
  // console.log('[MEILISEARCH] Sync task:', task.taskUid);

  return { index: documents.length, total: documents.length };
}

/**
 * Tìm kiếm: gọi Meilisearch, lấy IDs đã sort, fetch chi tiết từ DB
 */
export async function searchCoupons({ q, page = 1, limit = 20, filters = {} } = {}) {
  const index = await setupIndex();

  const offset = (page - 1) * limit;

  const filterParts = [];
  if (filters.domain) filterParts.push(`domain = "${String(filters.domain).replace(/"/g, '\\"')}"`);
  if (filters.isNextDayCoupon !== undefined) {
    filterParts.push(`isNextDayCoupon = ${filters.isNextDayCoupon}`);
  }
  if (filters.merchant) filterParts.push(`merchant = "${String(filters.merchant).replace(/"/g, '\\"')}"`);

  const searchParams = {
    offset,
    limit,
    attributesToRetrieve: ['id']
  };
  if (filterParts.length > 0) {
    searchParams.filter = filterParts.join(' AND ');
  }

  const results = await index.search(q || '', searchParams);

  const ids = (results.hits || []).map((h) => h.id);
  const totalHits = results.estimatedTotalHits ?? results.totalHits ?? 0;

  if (ids.length === 0) {
    return { data: [], total: totalHits, page, limit };
  }

  const coupons = await Coupon.find({
    accesstradeId: { $in: ids }
  }).lean();

  const idToCoupon = Object.fromEntries(coupons.map((c) => [c.accesstradeId, c]));

  const ordered = ids.map((id) => idToCoupon[id]).filter(Boolean);

  return {
    data: ordered,
    total: totalHits,
    page,
    limit
  };
}
