# InsightPilot - AI Business Intelligence Assistant

Portfolio demo cho một Business Manager của doanh nghiệp e-commerce giả lập. Ứng dụng có dashboard KPI, breakdown theo kênh/sản phẩm và AI assistant fallback dựa trên cùng lớp analytics. Dữ liệu seed được khởi tạo một lần vào SQLite cục bộ (`data/insightpilot.db`, không commit).

## Chạy local

```bash
npm.cmd install
npm.cmd run dev
```

Mở `http://localhost:3000`. Không cần API key để trải nghiệm bản demo.

Sau khi build production, chạy `npm.cmd start` để khởi động standalone server. Health check triển khai: `GET /api/health` trả `200` khi ứng dụng và SQLite seed data sẵn sàng.

### Bật AI provider thật (tùy chọn)

Copy `.env.example` thành `.env.local` rồi điền API key nếu muốn bật provider thật. Không commit `.env.local`.

```env
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4.1-mini
# OPENAI_BASE_URL=https://api.openai.com/v1
```

API key chỉ được dùng bởi route phía server. Nếu provider timeout/lỗi, assistant tự chuyển về fallback có evidence.

## Kiểm thử

```bash
npm.cmd run test
npm.cmd run build
```

## Quy định trước khi push

Xem chi tiết tại [`docs/repository-policy.md`](docs/repository-policy.md).

Tóm tắt nhanh:

- Push source code, tests, docs, cấu hình build/lint/test và Dockerfile.
- Không push `.env.local`, API key, `data/insightpilot.db`, `.next/`, `node_modules/`, cache hoặc log local.

## Bảo mật

- API input được validate bằng Zod và endpoint assistant có rate limit in-memory.
- CSP, frame protection, content-type và referrer headers được cấu hình.
- Không có secret/client API key trong source; khi tích hợp provider, dùng server environment.

## Hạn chế bản đầu

Dữ liệu demo là seed data bất biến được lưu SQLite cục bộ. Database này phù hợp cho demo một instance; khi triển khai nhiều instance, thay bằng PostgreSQL managed qua cùng repository interface.
