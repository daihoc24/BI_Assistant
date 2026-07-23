# Kế hoạch thiết kế ứng dụng

## Mục tiêu thiết kế

Xác định các thành phần cấp cao của AI BI Assistant, giao diện giữa chúng và dịch vụ điều phối. Logic tính KPI, prompt, bảo mật chi tiết và hạ tầng sẽ được thiết kế ở các giai đoạn sau.

## Các bước thực hiện

- [x] Xác định thành phần giao diện dashboard và hội thoại AI.
- [x] Xác định thành phần dữ liệu demo và lớp analytics.
- [x] Xác định thành phần API, điều phối insight và tích hợp AI/fallback.
- [x] Xác định service, interface và các phụ thuộc.
- [x] Tạo `components.md`.
- [x] Tạo `component-methods.md`.
- [x] Tạo `services.md`.
- [x] Tạo `component-dependency.md`.
- [x] Tạo `application-design.md` tổng hợp.
- [x] Kiểm tra tính đầy đủ và nhất quán của thiết kế.

## Câu hỏi thiết kế

## Câu hỏi 1 - Kiến trúc sản phẩm

Kiến trúc ứng dụng nên ưu tiên theo hướng nào?

A) Full-stack TypeScript trong một ứng dụng web: UI, API server và logic dữ liệu tách module rõ ràng (khuyến nghị)
B) Frontend SPA và backend API là hai ứng dụng triển khai độc lập
C) Dashboard frontend tối giản, logic AI/dữ liệu chủ yếu chạy ở client
X) Phương án khác (mô tả sau dòng `[Trả lời]:` bên dưới)

[Trả lời]: A

## Câu hỏi 2 - Nguồn dữ liệu demo

Dữ liệu demo nên được truy cập qua lớp nào ở phiên bản đầu?

A) Cơ sở dữ liệu cục bộ nhẹ, có seed dữ liệu để thể hiện luồng truy vấn BI thực tế (khuyến nghị)
B) Tệp JSON/CSV tĩnh được đọc trực tiếp bởi ứng dụng
C) Dịch vụ dữ liệu đám mây bên ngoài
X) Phương án khác (mô tả sau dòng `[Trả lời]:` bên dưới)

[Trả lời]: A

## Câu hỏi 3 - Trải nghiệm AI khi chưa có API key

Chế độ demo dự phòng nên hoạt động như thế nào?

A) Dùng tập câu hỏi được hỗ trợ và insight xác định từ cùng lớp analytics, luôn gắn số liệu/bằng chứng (khuyến nghị)
B) Trả lời bằng văn bản mẫu cố định cho từng câu hỏi
C) Ẩn hoàn toàn trợ lý AI khi không có API key
X) Phương án khác (mô tả sau dòng `[Trả lời]:` bên dưới)

[Trả lời]: A
