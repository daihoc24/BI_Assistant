# Kết quả xác minh

## Thành công

- `npm.cmd run test`: 5/5 tests pass, bao gồm example tests và property-based tests.
- `npm.cmd run build`: build production Next.js thành công.
- Kiểm tra runtime `GET /api/dashboard`: trả về 4 KPI.
- Kiểm tra runtime `POST /api/assistant/ask`: trả response fallback có 1 evidence.
- SQLite local được seed tự động; repository test xác nhận đơn hủy không được đưa vào doanh thu.
- Smoke test runtime: dashboard 200, input rỗng 400, câu hỏi hợp lệ 200.
- Rate-limit runtime: 12 request hợp lệ được chấp nhận và request thứ 13 nhận 429.
- AI adapter test xác nhận request OpenAI-compatible nhận prompt có evidence/actions và lỗi provider được ném để route dùng fallback.
- Validation test xác nhận input HTML-like bị chặn trước khi xử lý assistant.

## Lỗi đã phát hiện và sửa

- Sau khi bật `output: "standalone"` cho Next.js, script `npm start` dùng `next start` khiến server dừng ngay. Đã đổi script sang `node .next/standalone/server.js`.
- ESLint 9 thiếu `eslint.config.*`, khiến lệnh lint không chạy. Đã thêm cấu hình flat config cho Next.js.

## Ghi chú kỹ thuật

Repository SQLite hiện dùng `node:sqlite` của Node 24, có cảnh báo experimental từ Node runtime. Điều này chấp nhận được cho local portfolio demo; production nên dùng driver/database đã ổn định (PostgreSQL managed hoặc driver SQLite ổn định) trước khi public.

## Security finding còn mở

`npm audit --omit=dev` vẫn báo 3 cảnh báo production trong dependency lồng của Next.js (`next` -> `postcss`/`sharp`), dù app dùng Next.js 16.2.11 và npm không có bản fix tự động tương thích. Đây là finding SECURITY-10 cần theo dõi trước khi public production. Bản demo cục bộ không nên được xem là production-ready cho đến khi upstream phát hành dependency đã vá hoặc stack được thay thế.

Docker CLI không có trong môi trường hiện tại nên chưa thể build/verify image Docker ở đây.
