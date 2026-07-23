# Thành phần logic NFR

| Thành phần | Trách nhiệm | NFR được hỗ trợ |
|---|---|---|
| Request validation | Parse schema, payload/length bounds | Security, reliability |
| Rate limiter | Giới hạn POST assistant theo client | Security, availability |
| Security header policy | Set CSP, nosniff, frame/referrer policy | Security |
| Server config | Đọc/validate env, giữ secret ở server | Security, maintainability |
| Structured logger | Correlation ID, redaction, error logging | Observability, security |
| Error boundary/handler | Chuẩn hóa lỗi, generic response | Reliability, security |
| AI circuit boundary | Timeout và lựa chọn fallback | Performance, resilience |
| Test generators | Sinh Order/OrderLine/period hợp lệ | PBT, maintainability |
