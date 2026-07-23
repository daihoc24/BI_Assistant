# Pattern thiết kế NFR

## Resilience

- **Timeout + fallback**: AI provider có timeout; khi lỗi sẽ chuyển sang fallback nếu intent hỗ trợ.
- **Fail-safe**: Input/response không hợp lệ bị từ chối; không trả chi tiết nội bộ.
- **Retry UI có kiểm soát**: Người dùng chủ động thử lại, không retry vô hạn ở client.

## Performance

- **Read model aggregation**: Dashboard nhận dữ liệu đã aggregate thay vì raw orders.
- **Bounded request**: Giới hạn kích thước body, độ dài câu hỏi và số evidence gửi LLM.
- **Không gọi LLM cho dashboard**: Tránh độ trễ/chi phí không cần thiết.

## Security

- **Defense in depth**: Client UX validation + API Zod validation + repository query an toàn.
- **Server-side secret boundary**: LLM key chỉ trong server config.
- **Security headers middleware**: CSP restrictive, nosniff, frame protection, referrer policy và HSTS tại HTTPS.
- **Abuse protection**: Rate limiter cho API hỏi AI; input allowlist intent/fallback.

## Observability

- Correlation ID gắn với request và error log.
- Log cấu trúc: timestamp, level, message, route, correlation ID; redaction secrets/PII.
- Monitoring deployment: alert lỗi API/AI, rate-limit events và availability (SECURITY-14).

## Testing

- Example tests cho KPI và flow business quan trọng.
- PBT fast-check với domain arbitraries, shrinking mặc định và seed được log khi lỗi.
- Serialization response và pure analytics là ưu tiên PBT.
