# Yêu cầu phi chức năng - UOW-01

## Hiệu năng và quy mô

- Dashboard với seed data phải trả response thành công trong 1 giây ở môi trường local thông thường.
- Fallback insight phải trả response trong 1 giây; AI provider có timeout hữu hạn và không chặn UI vô hạn.
- Thiết kế hướng đến demo đơn người dùng; không yêu cầu autoscaling hoặc HA ở phiên bản đầu.

## Độ tin cậy

- Mọi external call có timeout, catch lỗi và fallback khi có thể.
- Không có unhandled rejection ở production.
- Error response phải tổng quát, có correlation ID để tra log.

## Bảo mật

- API key chỉ đọc từ server environment, không commit hoặc trả về client.
- Input API được validate kiểu, format, độ dài và kích thước body.
- Route hỏi AI chịu rate limiting; endpoint chỉ cho phép origin triển khai dự kiến.
- Áp dụng CSP, HSTS khi HTTPS deployment, X-Content-Type-Options, X-Frame-Options và Referrer-Policy.
- Truy vấn dữ liệu tham số hóa; database cục bộ không public.
- Structured logging không ghi secret, token hay raw prompt không cần thiết.
- Lockfile, dependency audit, SBOM và dependency versions được kiểm soát trong build/CI.

## Khả năng sử dụng và truy cập

- Responsive trên desktop/mobile.
- Điều hướng bàn phím, focus thấy được, label cho form/chart/table quan trọng và thông báo lỗi có thể đọc bởi screen reader.

## Khả năng bảo trì và kiểm thử

- TypeScript strict; module boundaries rõ ràng.
- Unit, integration và property-based tests trong CI.
- Lệnh chạy/seed/test/lint rõ ràng trong README.

## Áp dụng Security Baseline

| Rule | Trạng thái thiết kế |
|---|---|
| SECURITY-01 | TLS cho traffic triển khai; encryption at rest phụ thuộc provider/host. SQLite local không công khai. |
| SECURITY-02 | N/A ở local; deployment phải bật access logs tại proxy/platform. |
| SECURITY-03 | Bắt buộc structured logging, redact dữ liệu nhạy cảm. |
| SECURITY-04 | Bắt buộc security headers. |
| SECURITY-05 | Bắt buộc schema validation, body limit, truy vấn an toàn. |
| SECURITY-06, 07 | N/A cho single-app demo không có IAM/VPC; deployment không cấp wildcard không cần thiết. |
| SECURITY-08, 12 | N/A cho phiên bản không có tài khoản/route private. |
| SECURITY-09 | Bắt buộc generic errors, runtime hỗ trợ, không default credentials. |
| SECURITY-10 | Bắt buộc lockfile, audit, SBOM/CI. |
| SECURITY-11 | Bắt buộc rate limit và phân tách security module. |
| SECURITY-13 | Bắt buộc safe JSON validation; không tải CDN script không có SRI. |
| SECURITY-14 | Log/alert là yêu cầu deployment; local có structured logs. |
| SECURITY-15 | Bắt buộc global error handling và fail-safe. |
