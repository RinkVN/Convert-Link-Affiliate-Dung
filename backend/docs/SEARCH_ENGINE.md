# Coupon Search Engine (Meilisearch)

## Cấu hình môi trường

Thêm vào `.env`:

```env
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_API_KEY=          # để trống nếu dùng dev (no key)
```

Khởi động Meilisearch (Docker):

```bash
docker run -d -p 7700:7700 getmeili/meilisearch:latest
```

## Cấu hình index

### Searchable attributes (thứ tự ưu tiên)

1. `name` – Tên coupon
2. `name_normalized` – Tên đã normalize (lowercase, bỏ dấu, bỏ ký tự đặc biệt)
3. `content` – Nội dung mô tả
4. `content_normalized` – Nội dung đã normalize
5. `merchant` – Nhà cung cấp
6. `categories` – Ngành hàng (chuỗi)
7. `categories_normalized` – Ngành hàng đã normalize
8. `coupon_codes` – Mã coupon + mô tả
9. `coupon_codes_normalized` – Mã coupon đã normalize

### Filterable attributes

- `domain`, `isNextDayCoupon`, `merchant`, `is_hot`, `category_names`

### Sortable attributes

- `discount_value`, `discount_percentage`, `end_time`

### Ranking rules

1. `words` – Khớp từ
2. `typo` – Cho phép typo
3. `proximity` – Độ gần giữa các từ
4. `attribute` – Thứ tự trong searchable
5. `sort` – Sắp xếp
6. `exactness` – Khớp chính xác ưu tiên hơn
7. `discount_value:desc`
8. `discount_percentage:desc`

### Typo tolerance

- Bật mặc định
- Từ 4 ký tự: cho phép 1 typo
- Từ 8 ký tự: cho phép 2 typo

### Synonyms

| Query   | Mở rộng  |
|--------|----------|
| japa   | japan    |
| babi   | baby     |
| jp     | japan    |
| nhat_ban | japan  |
| nhat ban | japan  |

## Luồng đồng bộ

1. **Cron 12 tiếng**: Sau khi sync coupon từ ACCESSTRADE vào MongoDB, gọi `syncCouponsToMeilisearch()` để đẩy toàn bộ coupon vào Meilisearch.
2. **Admin thủ công**: `POST /api/admin/sync-meilisearch` (header `x-admin-secret`) để setup index + sync ngay khi cần.

## API Search

### GET /api/search

**Query params:**

| Param | Type | Mô tả |
|-------|------|-------|
| q | string | Từ khóa tìm kiếm |
| page | number | Trang (mặc định 1) |
| limit | number | Số kết quả/trang (mặc định 20, max 50) |
| domain | string | Lọc domain (vd: shopee.vn) |
| is_next_day_coupon | boolean | Lọc coupon sắp tới |
| category | string | Mã ngành hàng (vd: EC-29) |
| merchant | string | Lọc merchant |
| is_hot | string | Lọc mã hot |

**Mẫu request:**

```bash
curl "http://localhost:4000/api/search?q=giảm%2020k&page=1&limit=10&domain=shopee.vn"
```

**Mẫu response:**

```json
{
  "data": [
    {
      "id": "shopee-192996067098624",
      "name": "[SHOPEE]-Đơn hàng đầu tiên",
      "merchant": "shopee",
      "image": "https://...",
      "aff_link": "https://go.isclix.com/...",
      "link": "https://shopee.vn/...",
      "prod_link": "https://go.isclix.com/...",
      "content": "Sử dụng mã miễn phí vận chuyển...",
      "discount_value": 0,
      "discount_percentage": 0,
      "end_date": "Sat, 02 Oct 2021 23:58:00 GMT",
      "coupons": [{"coupon_code": "FSV-192996067098624", "coupon_desc": "Đơn hàng đầu tiên"}],
      "is_hot": "False"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10
  }
}
```

## Normalize

- **Lowercase**: `"Giảm 20K"` → `"giảm 20k"`
- **Bỏ dấu tiếng Việt**: `"giảm"` → `"giam"`
- **Bỏ ký tự đặc biệt**: `"giảm 20k!"` → `"giam 20k"`
