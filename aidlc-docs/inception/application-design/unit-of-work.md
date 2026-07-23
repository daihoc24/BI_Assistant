# Đơn vị công việc

## UOW-01 - AI Business Intelligence Assistant Web App

### Loại

Một ứng dụng web full-stack triển khai độc lập.

### Trách nhiệm

- Hiển thị dashboard KPI và trực quan hóa.
- Cung cấp API dashboard và hỏi đáp AI.
- Lưu/đọc dữ liệu demo từ SQLite cục bộ.
- Tính KPI, evidence và insight fallback.
- Tích hợp OpenAI-compatible API ở server khi có cấu hình.
- Áp dụng validation, error handling, logging, security headers và kiểm thử.

### Ranh giới

- Không có client-side access tới database hay secret.
- Không triển khai website bán hàng, thanh toán, user authentication hoặc đồng bộ dữ liệu thời gian thực.

### Chiến lược tổ chức code

```text
app/                 Route và API boundary
components/          Dashboard và Assistant UI
lib/analytics/       KPI, aggregation, insight evidence
lib/ai/              Orchestrator, provider adapter, fallback
lib/data/            Schema, repository, seed data
lib/security/        Validation, rate limit, headers, logging
tests/               Unit, integration và property-based tests
docs/                Hướng dẫn dữ liệu, chạy và triển khai
```

### Tiêu chí hoàn thành unit

Tất cả user story trong map hoạt động; ứng dụng build/test thành công; demo hoạt động không API key; các guard bảo mật và test bắt buộc được xác minh.
