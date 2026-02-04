## Shopee Affiliate Converter (ACCESSTRADE)

Web app MVP chuyển đổi link Shopee thành link affiliate sử dụng ACCESSTRADE API (create tracking link).

### Cấu trúc thư mục

- **backend**: Node.js + Express + MongoDB (Mongoose), ACCESSTRADE client, rate limiting.
- **frontend**: React + Vite + TypeScript, UI form + lịch sử.

---

### 1. Backend

#### 1.1. Cài đặt & chạy

```bash
cd backend
npm install

# Tạo file .env từ mẫu
cp .env.example .env
# Mở .env và chỉnh:
# - MONGODB_URI
# - CLIENT_ORIGIN (thường là http://localhost:5173)
# - ACCESSTRADE_API_TOKEN
# - ACCESSTRADE_SHOPEE_CAMPAIGN_ID

# Chạy server dev
npm run dev
# hoặc chạy production mode
npm start
```

Server mặc định chạy ở `http://localhost:4000`.

#### 1.2. API chính

- **POST** `/api/convert`

  - **Body JSON**:
    - `originalUrl` (string, bắt buộc): link Shopee gốc (`shopee.vn`, `vn.shp.ee`, `s.shopee.vn`).
    - `subId` (string, tùy chọn): sẽ map sang `sub1` trong ACCESSTRADE API.
  - **Response 200**:
    ```json
    {
      "id": "664f9f5f2c4b1a3f8f9d1234",
      "affiliateUrl": "https://tracking.accesstrade.vn/..."
    }
    ```
  - **Response lỗi (ví dụ)**:
    ```json
    {
      "error": "URL must be a valid Shopee link (shopee.vn, vn.shp.ee, s.shopee.vn)"
    }
    ```

- **GET** `/api/convert/recent?limit=10`
  - Lấy danh sách tối đa 10 link convert gần nhất.
  - **Response 200**:
    ```json
    {
      "data": [
        {
          "id": "664f9f5f2c4b1a3f8f9d1234",
          "originalUrl": "https://shopee.vn/...",
          "affiliateUrl": "https://tracking.accesstrade.vn/...",
          "subId": "tiktok-ads-01",
          "createdAt": "2026-02-02T01:23:45.678Z"
        }
      ]
    }
    ```

#### 1.3. Rate limiting

- Endpoint `/api/convert` được limit **30 requests / phút / IP**.
- Khi vượt quá:
  ```json
  {
    "error": "Too many requests. Please try again later."
  }
  ```

#### 1.4. Ví dụ test bằng curl

```bash
curl -X POST http://localhost:4000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://shopee.vn/m/ma-giam-gia",
    "subId": "tiktok-ads-01"
  }'
```

Ví dụ gọi danh sách gần nhất:

```bash
curl "http://localhost:4000/api/convert/recent?limit=10"
```

---

### 2. Frontend

#### 2.1. Cài đặt & chạy

```bash
cd frontend
npm install
npm run dev
```

Vite sẽ chạy ở `http://localhost:5173` và proxy `/api` sang backend `http://localhost:4000`.

#### 2.2. Chức năng chính

- **Form convert**:
  - Input `originalUrl` (bắt buộc).
  - Input `subId` (tùy chọn) – được lưu vào `localStorage` để tự điền cho lần sau.
  - Nút **Convert** gọi `POST /api/convert`.
- **Kết quả**:
  - Hiển thị `affiliateUrl` nhận từ backend.
  - Nút **Copy** dùng `navigator.clipboard.writeText`.
- **Lịch sử**:
  - Load từ:
    - Backend: `GET /api/convert/recent?limit=10`.
    - `localStorage` (backup).
  - Hiển thị tối đa 10 item gần nhất: originalUrl, affiliateUrl, subId, thời gian.

---

### 3. Ghi chú kỹ thuật

- **ACCESSTRADE API**:
  - Endpoint tạo link: `https://api.accesstrade.vn/v1/product_link/create` (theo docs: `tao-tracking-link.md` trên `developers.accesstrade.vn`).
  - Header:
    - `Content-Type: application/json`
    - `Authorization: Token {your_token}` (chú ý: chữ "Token" viết hoa chữ T và có dấu cách sau "Token")
  - Body tối thiểu:
    ```json
    {
      "campaign_id": "ACCESSTRADE_SHOPEE_CAMPAIGN_ID",
      "urls": ["https://shopee.vn/..."],
      "sub1": "optional_subId"
    }
    ```
- **Không hard-code credentials**:
  - Tất cả token, campaign id đọc từ `.env` trong backend.
- **MongoDB collection `links`**:
  - Trường: `originalUrl`, `normalizedUrl`, `affiliateUrl`, `subId`, `ip`, `userAgent`, `createdAt`.
