# Thiết kế hạ tầng - UOW-01

| Môi trường | Compute | Data | Cấu hình |
|---|---|---|---|
| Local | Node.js process | SQLite file + seed | `.env.local` không commit |
| Demo | Một Node.js container | SQLite seed read-only hoặc volume riêng | Secret qua platform environment |

## Mapping

| Thành phần logic | Hạ tầng |
|---|---|
| Next.js UI/API | Một Node.js container sau HTTPS do platform cung cấp |
| SQLite/Prisma | File trong container cho demo dữ liệu đọc; volume khi cần giữ dữ liệu |
| OpenAI adapter | Outbound HTTPS; API key trong platform environment |
| Logging | stdout JSON sang log service của platform |
| Rate limit | Bộ nhớ process cho demo; Redis/KV khi scale nhiều instance |

Không cần queue, cache chuyên dụng, microservice, load balancer hoặc shared infrastructure cho bản đầu. Platform triển khai phải cung cấp TLS 1.2+, access logging và biến môi trường bảo mật. Docker image dùng Node LTS được pin version, không dùng `latest`. Database không public.
