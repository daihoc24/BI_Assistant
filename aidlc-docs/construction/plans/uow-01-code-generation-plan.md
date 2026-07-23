# Kế hoạch sinh mã nguồn - UOW-01

## Context

- **Stories**: US-01 đến US-06.
- **Entities**: Product, Customer, Order, OrderLine và các DTO analytics/insight.
- **Boundary**: Một web application full-stack; không phụ thuộc unit/service khác.

## Các bước thực hiện

- [x] Bước 1: Khởi tạo cấu trúc Next.js/TypeScript và cấu hình dependency/lockfile.
- [x] Bước 2: Tạo seed data và analytics core (repository SQLite được để làm bước mở rộng có interface tương thích).
- [x] Bước 3: Tạo fallback insight và API routes (OpenAI provider adapter là bước mở rộng).
- [x] Bước 4: Tạo dashboard và assistant UI có `data-testid` ổn định.
- [x] Bước 5: Tạo security headers, validation, rate limit, logging và error response.
- [x] Bước 6: Tạo example tests và property-based tests fast-check.
- [x] Bước 7: Tạo README, Docker/CI và tài liệu dữ liệu.
- [x] Bước 8: Chạy test và build; test 5/5 pass, build production pass.
