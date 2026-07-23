# Thiết kế ứng dụng tổng hợp

## Kiến trúc đã chọn

Một ứng dụng web full-stack TypeScript với UI và API server trong cùng codebase; các module analytics, data repository và AI được tách ranh giới rõ ràng. Dữ liệu demo lưu trong SQLite cục bộ, seed khi khởi tạo. AI sử dụng API OpenAI-compatible ở server nếu có cấu hình, hoặc Fallback Insight Engine có căn cứ nếu không có API key.

## Lý do

- Đủ độ sâu kỹ thuật để làm portfolio Full-stack/AI nhưng không tạo chi phí vận hành của nhiều service.
- Dữ liệu và tính toán KPI nằm ở server, giúp bảo vệ bí mật và giữ nhất quán.
- Fallback cho phép người xem trải nghiệm demo ngay cả khi không có API key.

## Phạm vi thiết kế

- Dashboard KPI và trực quan hóa.
- Hỏi đáp AI có evidence và action.
- Lớp dữ liệu demo/analytics.
- Security/observability cross-cutting.

Chi tiết: `components.md`, `component-methods.md`, `services.md`, `component-dependency.md`.

## Kiểm tra nhất quán

- FR-01/FR-02 được bao phủ bởi Dashboard Presentation, Dashboard Service và Analytics Service.
- FR-03 đến FR-06 được bao phủ bởi Assistant UI, Insight Orchestrator, AI Adapter/Fallback Engine.
- FR-07 được bao phủ bởi Data Repository và SQLite seed data.
- FR-08/FR-09 được bao phủ bởi server-only adapter, fallback và error handling.
- NFR bảo mật/kiểm thử được dành thành concern xuyên suốt để thiết kế chi tiết ở giai đoạn NFR/hạ tầng.
