# Kế hoạch tạo đơn vị công việc

## Quyết định phân rã

Sử dụng **một Unit of Work**: ứng dụng web full-stack có thể triển khai độc lập. Các module UI, API, analytics, dữ liệu và AI nằm trong cùng codebase để giảm độ phức tạp vận hành, nhưng tách ranh giới logic để dễ kiểm thử/mở rộng. Quyết định này phù hợp với portfolio demo, nhóm một người và không có yêu cầu scale độc lập.

## Xử lý các yếu tố phân rã

- **Nhóm story**: Gom toàn bộ hành trình dashboard -> điều tra -> AI -> hành động vào một ứng dụng thống nhất.
- **Phụ thuộc**: Module UI gọi API nội bộ; API dùng analytics; analytics dùng repository/SQLite; insight dùng AI adapter hoặc fallback.
- **Nhóm phát triển**: Một người sở hữu toàn bộ unit.
- **Kỹ thuật/triển khai**: Một ứng dụng full-stack TypeScript, một deployment demo.
- **Domain**: Một bounded context là phân tích kinh doanh bán lẻ.
- **Tổ chức code**: Feature/module-first trong cùng repository, phân tách `app`, `components`, `lib/analytics`, `lib/ai`, `lib/data`, `lib/security`, `tests`.

## Các bước thực hiện

- [x] Xác định một unit full-stack và ranh giới module.
- [x] Gán toàn bộ stories cho unit.
- [x] Tạo `unit-of-work.md` với định nghĩa, trách nhiệm và chiến lược tổ chức code.
- [x] Tạo `unit-of-work-dependency.md` với ma trận phụ thuộc.
- [x] Tạo `unit-of-work-story-map.md` ánh xạ stories.
- [x] Xác nhận unit có thể xây dựng, kiểm thử và triển khai độc lập.
