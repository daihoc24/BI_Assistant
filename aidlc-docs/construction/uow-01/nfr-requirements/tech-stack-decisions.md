# Quyết định công nghệ - UOW-01

| Nhu cầu | Quyết định | Lý do |
|---|---|---|
| Web full-stack | Next.js + TypeScript strict | Một codebase cho UI và server API, phù hợp portfolio. |
| UI | React + CSS modules hoặc Tailwind CSS | Tạo dashboard responsive, component hóa. |
| Database local | SQLite + Prisma ORM | Seed/query có cấu trúc, migration rõ, không cần dịch vụ ngoài. |
| Validation | Zod | Schema runtime cho API và biến môi trường. |
| Biểu đồ | Recharts | Đủ cho KPI/trend/breakdown demo. |
| AI | OpenAI-compatible HTTP adapter | Không khóa vào một nhà cung cấp; secret ở server. |
| Fallback | Analytics-driven deterministic engine | Demo hoạt động, insight không tách rời dữ liệu. |
| Testing | Vitest + fast-check + Playwright tùy chọn | Unit/integration, PBT có shrinking/seed, E2E sau. |
| Logging | Pino hoặc structured logger tương đương | Log JSON và redact thông tin nhạy cảm. |
| CI | GitHub Actions | Lint, test, audit, SBOM khi triển khai. |

## Property-Based Testing Framework

Chọn **fast-check** cho TypeScript. Framework có generator domain tùy chỉnh, shrinking, tái lập với seed và tích hợp Vitest. PBT phải chạy trong CI cùng example-based tests.

## Phiên bản dependency

Khi khởi tạo mã nguồn, package manager sẽ tạo lockfile. Dependency runtime và dev dependency phải được pin qua lockfile; không dùng tag `latest` trong Dockerfile/CI production.
