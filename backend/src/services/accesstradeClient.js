import axios from 'axios';

const DEFAULT_BASE_URL = 'https://api.accesstrade.vn';

/**
 * Tạo tracking link qua ACCESSTRADE cho 1 campaign cụ thể.
 * Mặc định dùng campaign Shopee, có thể override bằng campaignId.
 */
export async function createTrackingLink({ originalUrl, normalizedUrl, subId, campaignId: campaignIdOverride }) {
  const apiToken = process.env.ACCESSTRADE_API_TOKEN?.trim();
  const baseUrl = process.env.ACCESSTRADE_BASE_URL || DEFAULT_BASE_URL;
  const campaignId = campaignIdOverride || process.env.ACCESSTRADE_SHOPEE_CAMPAIGN_ID?.trim();

  if (!apiToken) {
    const err = new Error('ACCESSTRADE_API_TOKEN is not configured on the server');
    err.status = 500;
    throw err;
  }

  if (!campaignId) {
    const err = new Error('ACCESSTRADE campaign_id is not configured on the server');
    err.status = 500;
    throw err;
  }

  const url = `${baseUrl}/v1/product_link/create`;

  const body = {
    campaign_id: campaignId,
    urls: [normalizedUrl || originalUrl]
  };

  // Map subId -> sub1 (can be adjusted later if needed)
  if (subId) {
    body.sub1 = subId;
  }

  // Log request details (without exposing token)
  console.log('[ACCESSTRADE] Request:', {
    url,
    campaignId,
    urlCount: body.urls.length,
    hasSubId: !!subId,
    tokenLength: apiToken?.length || 0
  });

  try {
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiToken}`
      },
      timeout: 10000
    });

    const data = response.data;

    if (!data?.success) {
      const errorMsg = data?.message || 'ACCESSTRADE API returned an unsuccessful response';
      const err = new Error(errorMsg);
      err.status = 502;
      throw err;
    }

    const successLink = data.data?.success_link?.[0];
    if (!successLink?.aff_link) {
      const err = new Error('ACCESSTRADE API did not return an affiliate link');
      err.status = 502;
      throw err;
    }

    return {
      affiliateUrl: successLink.aff_link,
      shortLink: successLink.short_link,
      rawResponse: data
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;

      let message = 'ACCESSTRADE API error';
      if (responseData) {
        if (typeof responseData === 'string') {
          message = responseData;
        } else if (responseData.message) {
          message = responseData.message;
        } else if (responseData.error) {
          message = responseData.error;
        } else if (responseData.data?.error) {
          message = responseData.data.error;
        }
      }

      // Special handling for 403 (Forbidden) - usually means invalid token or no permission
      if (status === 403) {
        const err = new Error(
          `ACCESSTRADE API authentication failed (403). Please check: 1) Token is valid and not expired, 2) Token has permission for this campaign, 3) Campaign ID is correct. Error: ${message}`
        );
        err.status = 403;
        throw err;
      }

      // Special handling for 401 (Unauthorized)
      if (status === 401) {
        const err = new Error(`ACCESSTRADE API unauthorized (401). Please check your API token. Error: ${message}`);
        err.status = 401;
        throw err;
      }

      const err = new Error(`ACCESSTRADE API error (${status}): ${message}`);
      err.status = status >= 500 ? 502 : status;
      throw err;
    }

    if (error.code === 'ECONNABORTED') {
      const err = new Error('ACCESSTRADE API request timed out');
      err.status = 504;
      throw err;
    }

    throw error;
  }
}

/**
 * Tạo link affiliate cho TikTok Shop thông qua API v2.
 * POST /v2/tiktokshop_product_feeds/create_link
 */
export async function createTiktokshopLink(body) {
  const apiToken = process.env.ACCESSTRADE_API_TOKEN?.trim();
  const baseUrl = process.env.ACCESSTRADE_BASE_URL || DEFAULT_BASE_URL;

  if (!apiToken) {
    const err = new Error('ACCESSTRADE_API_TOKEN is not configured on the server');
    err.status = 500;
    throw err;
  }

  if (!body || typeof body.product_url !== 'string' || !body.product_url.trim()) {
    const err = new Error('product_url is required');
    err.status = 400;
    throw err;
  }

  const url = `${baseUrl}/v2/tiktokshop_product_feeds/create_link`;

  // Chuẩn hóa payload: chỉ gửi lên các field được hỗ trợ
  const payload = {
    product_url: body.product_url.trim()
  };

  if (body.product_id) payload.product_id = String(body.product_id).trim();

  // UTM params
  if (body.utm_source) payload.utm_source = String(body.utm_source).trim();
  if (body.utm_medium) payload.utm_medium = String(body.utm_medium).trim();
  if (body.utm_campaign) payload.utm_campaign = String(body.utm_campaign).trim();
  if (body.utm_content) payload.utm_content = String(body.utm_content).trim();

  // Sub params: chấp nhận cả sub1/sub_1...
  const sub1 = body.sub1 || body.sub_1;
  const sub2 = body.sub2 || body.sub_2;
  const sub3 = body.sub3 || body.sub_3;
  const sub4 = body.sub4 || body.sub_4;
  if (sub1) payload.sub1 = String(sub1).trim();
  if (sub2) payload.sub2 = String(sub2).trim();
  if (sub3) payload.sub3 = String(sub3).trim();
  if (sub4) payload.sub4 = String(sub4).trim();

  console.log('[ACCESSTRADE][TikTokShop] Request:', {
    url,
    hasProductId: !!payload.product_id,
    hasUtm: !!(payload.utm_source || payload.utm_medium || payload.utm_campaign || payload.utm_content),
    hasSub: !!(payload.sub1 || payload.sub2 || payload.sub3 || payload.sub4),
    tokenLength: apiToken?.length || 0
  });

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiToken}`
      },
      timeout: 10000
    });

    const data = response.data;

    if (!data || data.status !== true) {
      const message = data?.message || 'ACCESSTRADE TikTokShop API returned an unsuccessful response';
      const err = new Error(message);
      // Nếu API trả về status=false thì xem là lỗi phía client (link không thuộc campaign, v.v.)
      err.status = 400;
      err.code = 'ACCESSTRADE_TIKTOKSHOP_ERROR';
      err.rawResponse = data;
      throw err;
    }

    const affUrl = data.data?.aff_url || '';
    const shortUrl = data.data?.aff_short_url || '';

    if (!affUrl) {
      const err = new Error('ACCESSTRADE TikTokShop API did not return an affiliate URL');
      err.status = 502;
      throw err;
    }

    return {
      affiliateUrl: affUrl,
      shortLink: shortUrl || null,
      productCommission: data.data?.product_commission || null,
      productInfo: {
        id: data.data?.product_id || null,
        name: data.data?.product_name || null,
        image: data.data?.product_image || null,
        price: data.data?.product_price || null
      },
      rawResponse: data
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;

      let message = 'ACCESSTRADE TikTokShop API error';
      if (responseData) {
        if (typeof responseData === 'string') {
          message = responseData;
        } else if (responseData.message) {
          message = responseData.message;
        } else if (responseData.error) {
          message = responseData.error;
        }
      }

      if (status === 403) {
        const err = new Error(
          `ACCESSTRADE TikTokShop API authentication failed (403). Please check your token and permissions. Error: ${message}`
        );
        err.status = 403;
        throw err;
      }

      if (status === 401) {
        const err = new Error(
          `ACCESSTRADE TikTokShop API unauthorized (401). Please check your API token. Error: ${message}`
        );
        err.status = 401;
        throw err;
      }

      const err = new Error(`ACCESSTRADE TikTokShop API error (${status}): ${message}`);
      err.status = status >= 500 ? 502 : status;
      throw err;
    }

    if (error.code === 'ECONNABORTED') {
      const err = new Error('ACCESSTRADE TikTokShop API request timed out');
      err.status = 504;
      throw err;
    }

    throw error;
  }
}

/**
 * Lấy tỷ lệ hoa hồng của campaign (default.sales_ratio %).
 * GET /v1/commission_policies?camp_id=...
 */
export async function getCommissionRatio(campaignId) {
  const apiToken = process.env.ACCESSTRADE_API_TOKEN?.trim();
  const baseUrl = process.env.ACCESSTRADE_BASE_URL || DEFAULT_BASE_URL;
  if (!apiToken || !campaignId) return null;

  const url = `${baseUrl}/v1/commission_policies?camp_id=${encodeURIComponent(campaignId)}`;
  try {
    const response = await axios.get(url, {
      headers: { 'Content-Type': 'application/json', Authorization: `Token ${apiToken}` },
      timeout: 8000
    });
    const data = response.data;
    const defaultRow =
      data?.data?.default?.[0] ||
      data?.default?.[0] ||
      (Array.isArray(data?.default) ? data.default[0] : null);
    if (defaultRow != null) {
      const ratio = defaultRow.sales_ratio;
      if (typeof ratio === 'number' && ratio >= 0) return ratio;
      if (typeof ratio === 'string') return parseFloat(ratio) || null;
    }
    return null;
  } catch (err) {
    console.warn('[ACCESSTRADE] getCommissionRatio failed:', err.message);
    return null;
  }
}

/**
 * Lấy chi tiết sản phẩm (price, discount, name) từ ACCESSTRADE.
 * GET /v1/product_detail?merchant=shopee&product_id=...
 * Thử nhiều format product_id cho Shopee: shopid_itemid, shopid--itemid, shopid-itemid
 */
export async function getProductDetail(merchant, productIdVariants) {
  const apiToken = process.env.ACCESSTRADE_API_TOKEN?.trim();
  const baseUrl = process.env.ACCESSTRADE_BASE_URL || DEFAULT_BASE_URL;
  if (!apiToken || !merchant) return null;
  const ids = Array.isArray(productIdVariants) ? productIdVariants : [productIdVariants];
  if (ids.length === 0 || !ids[0]) return null;

  for (const productId of ids) {
    const url = `${baseUrl}/v1/product_detail?merchant=${encodeURIComponent(merchant)}&product_id=${encodeURIComponent(productId)}`;
    try {
      const response = await axios.get(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${apiToken}` },
        timeout: 8000
      });
      const data = response.data;
      if (data && typeof data === 'object' && (data.price != null || data.discount != null)) {
        return {
          name: data.name,
          price: data.price,
          discount: data.discount,
          image: data.image,
          link: data.link
        };
      }
    } catch (err) {
      continue;
    }
  }
  return null;
}

export async function getTopProducts({ dateFrom, dateTo, merchant } = {}) {
  const apiToken = process.env.ACCESSTRADE_API_TOKEN?.trim();
  const baseUrl = process.env.ACCESSTRADE_BASE_URL || DEFAULT_BASE_URL;

  if (!apiToken) {
    const err = new Error('ACCESSTRADE_API_TOKEN is not configured on the server');
    err.status = 500;
    throw err;
  }

  const params = new URLSearchParams();
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  if (merchant) params.append('merchant', merchant);

  const url = `${baseUrl}/v1/top_products${params.toString() ? `?${params}` : ''}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiToken}`
      },
      timeout: 10000
    });

    const data = response.data;
    return data?.data || [];
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        'ACCESSTRADE API error';
      const err = new Error(`ACCESSTRADE top_products error (${status}): ${message}`);
      err.status = status >= 500 ? 502 : status;
      throw err;
    }
    throw error;
  }
}

