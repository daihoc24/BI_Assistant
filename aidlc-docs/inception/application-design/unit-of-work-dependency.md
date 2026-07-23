# Phụ thuộc đơn vị công việc

## Ma trận

| Unit | Phụ thuộc nội bộ | Phụ thuộc ngoài | Kiểu phụ thuộc |
|---|---|---|---|
| UOW-01 | UI, API, Analytics, Data, AI, Security modules | SQLite runtime; OpenAI-compatible API tùy chọn | Cùng codebase; HTTPS/TLS với API ngoài |

## Thứ tự xây dựng logic

1. Data schema/seed và analytics.
2. API/dashboard service và fallback insight.
3. UI dashboard/assistant.
4. AI provider adapter, security cross-cutting và test.

Không có phụ thuộc giữa nhiều service hoặc package triển khai.
