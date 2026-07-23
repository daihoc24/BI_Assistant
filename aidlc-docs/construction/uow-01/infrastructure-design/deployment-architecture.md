# Kiến trúc triển khai

```mermaid
flowchart LR
  U[Người xem portfolio] -->|HTTPS| P[Platform proxy + access logs]
  P --> A[Node.js / Next.js container]
  A --> D[(SQLite seed data)]
  A -->|HTTPS khi cấu hình| L[OpenAI-compatible API]
  A --> O[Structured logs của platform]
```

CI cài dependency theo lockfile, lint, test, audit và tạo SBOM; sau đó build image Node LTS đã pin version. Platform deploy image cùng secrets, chạy migration/seed an toàn và health check. Seed data có thể tái tạo; AI provider lỗi không làm dashboard unavailable vì fallback.
