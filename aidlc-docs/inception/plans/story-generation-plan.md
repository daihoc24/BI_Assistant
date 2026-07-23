# Kế hoạch tạo User Stories

## Mục tiêu

Chuyển yêu cầu đã duyệt thành persona, epic và user story có tiêu chí nghiệm thu, tập trung vào trải nghiệm demo portfolio.

## Phương án phân rã story

- **Theo hành trình người dùng**: Dễ thể hiện luồng từ xem dashboard đến ra quyết định; là phương án đề xuất.
- **Theo tính năng**: Dễ nhóm theo dashboard, AI assistant và dữ liệu, nhưng ít nhấn mạnh trải nghiệm liền mạch.
- **Theo persona**: Phù hợp khi có nhiều vai trò thực sự khác nhau; phiên bản đầu chỉ có một persona nghiệp vụ chính.
- **Theo domain**: Phù hợp khi nghiệp vụ lớn; phạm vi phiên bản đầu chưa cần thiết.
- **Theo epic**: Có thể kết hợp với hành trình để tạo cấu trúc rõ ràng.

## Các bước thực hiện

- [x] Xác định persona và mục tiêu.
- [x] Phân rã theo hành trình/epic đã được duyệt.
- [x] Viết user stories theo tiêu chí INVEST.
- [x] Viết tiêu chí nghiệm thu có thể kiểm thử cho từng story.
- [x] Liên kết story với requirement và persona.
- [x] Kiểm tra phạm vi bản đầu và tính nhất quán.
- [x] Tạo `personas.md` và `stories.md`.

## Câu hỏi cần xác nhận

## Câu hỏi 1 - Persona nghiệp vụ chính

Ai là nhân vật trung tâm của câu chuyện sản phẩm?

A) Business Manager của doanh nghiệp e-commerce giả lập, cần theo dõi KPI và ra quyết định (khuyến nghị)
B) Data Analyst, cần tự khám phá dữ liệu và chuẩn bị báo cáo
C) Founder/Executive, cần bản tóm tắt chiến lược ngắn gọn
X) Phương án khác (mô tả sau dòng `[Trả lời]:` bên dưới)

[Trả lời]: A

## Câu hỏi 2 - Cách tổ chức story

Nên dùng cách nào để tổ chức user stories?

A) Kết hợp hành trình người dùng và epic: Khám phá dashboard -> Điều tra -> Hỏi AI -> Hành động (khuyến nghị)
B) Nhóm hoàn toàn theo tính năng: Dashboard, dữ liệu, AI assistant, độ tin cậy
C) Nhóm theo persona
X) Phương án khác (mô tả sau dòng `[Trả lời]:` bên dưới)

[Trả lời]: A

## Câu hỏi 3 - Mức chi tiết nghiệm thu

Tiêu chí nghiệm thu nên được viết ở mức nào?

A) Given/When/Then cho các hành vi quan trọng và điều kiện lỗi chính (khuyến nghị)
B) Checklist ngắn theo từng story
C) Mô tả chi tiết mọi trạng thái UI
X) Phương án khác (mô tả sau dòng `[Trả lời]:` bên dưới)

[Trả lời]: A
