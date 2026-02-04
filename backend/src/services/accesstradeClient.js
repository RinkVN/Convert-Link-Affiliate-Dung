import axios from 'axios';

const DEFAULT_BASE_URL = 'https://api.accesstrade.vn';

export async function createTrackingLink({ originalUrl, normalizedUrl, subId }) {
  const apiToken = process.env.ACCESSTRADE_API_TOKEN?.trim();
  const baseUrl = process.env.ACCESSTRADE_BASE_URL || DEFAULT_BASE_URL;
  const campaignId = process.env.ACCESSTRADE_SHOPEE_CAMPAIGN_ID?.trim();

  if (!apiToken) {
    const err = new Error('ACCESSTRADE_API_TOKEN is not configured on the server');
    err.status = 500;
    throw err;
  }

  if (!campaignId) {
    const err = new Error('ACCESSTRADE_SHOPEE_CAMPAIGN_ID is not configured on the server');
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

