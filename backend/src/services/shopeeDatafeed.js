import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Map key = "shopId_itemId" -> { name, price, discount, image } */
let productIndex = null;
/** Map key = "itemId" (sku) -> { name, price, discount, image } — fallback khi không có shopId_itemId */
let productByItemId = null;
let loadPromise = null;

/**
 * Trích shopId và itemId từ URL Shopee trong CSV (shopee.vn/product/shopId/itemId).
 */
function parseShopeeProductUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const match = url.match(/shopee\.vn\/product\/(\d+)\/(\d+)/);
    return match ? { shopId: match[1], itemId: match[2] } : null;
  } catch {
    return null;
  }
}

/**
 * Load CSV datafeed vào memory (index theo shopId_itemId).
 * Gọi 1 lần khi start; có thể gọi lại để reload.
 * @param {string} [csvPath] - Đường dẫn file CSV (mặc định: src/shopee.vn.csv)
 */
export function loadShopeeDatafeed(csvPath) {
  if (loadPromise) return loadPromise;
  const resolvedPath =
    csvPath ||
    process.env.SHOPEE_DATAFEED_CSV_PATH ||
    path.join(__dirname, '..', 'shopee.vn.csv');

  loadPromise = (async () => {
    try {
      const content = fs.readFileSync(resolvedPath, { encoding: 'utf-8' });
      const rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        quote: '"',
        relax_quotes: true
      });
      const index = new Map();
      const byItemId = new Map();
      for (const row of rows) {
        const parsed = parseShopeeProductUrl(row.url);
        const sku = (row.sku && String(row.sku).trim()) || (parsed ? parsed.itemId : null);
        const price = parseInt(row.price, 10);
        const discount = parseInt(row.discount, 10);
        const info = {
          name: row.name || '',
          price: Number.isFinite(price) ? price : null,
          discount: Number.isFinite(discount) ? discount : null,
          image: row.image || null
        };
        if (parsed) {
          const key = `${parsed.shopId}_${parsed.itemId}`;
          if (!index.has(key)) index.set(key, info);
        }
        if (sku && !byItemId.has(sku)) byItemId.set(sku, info);
      }
      productIndex = index;
      productByItemId = byItemId;
      console.log(`[ShopeeDatafeed] Loaded ${productIndex.size} products (by key), ${productByItemId.size} by sku from ${resolvedPath}`);
      return productIndex.size;
    } catch (err) {
      console.warn('[ShopeeDatafeed] Load failed:', err.message);
      productIndex = new Map();
      return 0;
    }
  })();
  return loadPromise;
}

/**
 * Lấy thông tin sản phẩm từ datafeed CSV (đã load).
 * Thử shopId_itemId trước, không có thì tra theo itemId (sku).
 * @param {string} shopId
 * @param {string} itemId
 * @returns {{ name: string, price: number|null, discount: number|null, image: string|null }|null}
 */
export function getProductFromDatafeed(shopId, itemId) {
  if (productIndex) {
    const key = `${shopId}_${itemId}`;
    const byKey = productIndex.get(key);
    if (byKey) return byKey;
  }
  if (productByItemId && itemId) return productByItemId.get(itemId) ?? null;
  return null;
}

/**
 * Kiểm tra datafeed đã load chưa.
 */
export function isDatafeedLoaded() {
  return productIndex !== null && productIndex.size > 0;
}
