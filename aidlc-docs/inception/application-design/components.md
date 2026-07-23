# Thành phần ứng dụng

## 1. Web App Shell và điều hướng

**Mục đích**: Cung cấp khung ứng dụng, tiêu đề, trạng thái toàn cục và bố cục responsive.

**Trách nhiệm**: Render trang dashboard; quản lý trạng thái tải/lỗi mức trang; đảm bảo semantic HTML và khả năng truy cập cơ bản.

## 2. Dashboard Presentation

**Mục đích**: Trình bày KPI, biểu đồ xu hướng, phân rã kinh doanh và bảng nổi bật.

**Trách nhiệm**: Nhận dashboard view model từ API; hiển thị KPI, chart và bảng; không tự tính KPI nghiệp vụ ở client.

## 3. Assistant Conversation UI

**Mục đích**: Cho phép đặt câu hỏi, chọn câu hỏi gợi ý, xem trạng thái xử lý và phản hồi.

**Trách nhiệm**: Giới hạn input tại client để cải thiện UX; hiển thị insight, bằng chứng, khuyến nghị, giới hạn dữ liệu và lỗi an toàn.

## 4. API Controllers

**Mục đích**: Cung cấp HTTP boundary cho dashboard và hội thoại AI.

**Trách nhiệm**: Xác thực schema input; áp dụng rate limiting; lấy correlation ID; chuyển yêu cầu đến service; trả lỗi an toàn.

## 5. Dashboard Service

**Mục đích**: Tạo view model tổng quan cho dashboard.

**Trách nhiệm**: Điều phối Analytics Service và chuyển kết quả thành DTO phục vụ UI.

## 6. Analytics Service

**Mục đích**: Lớp tính toán chỉ đọc, có thể kiểm thử, cho KPI và phân tích theo chiều.

**Trách nhiệm**: Tính metrics, so sánh kỳ, chuỗi thời gian và xếp hạng danh mục/kênh/sản phẩm từ dữ liệu chuẩn hóa.

## 7. Insight Orchestrator

**Mục đích**: Tạo phản hồi hỏi đáp AI có căn cứ.

**Trách nhiệm**: Diễn giải ý định trong giới hạn được hỗ trợ; lấy evidence từ Analytics Service; chọn LLM provider khi được cấu hình hoặc Fallback Insight Engine khi không có; kiểm tra phản hồi trước khi trả về.

## 8. AI Provider Adapter

**Mục đích**: Cô lập giao tiếp với API OpenAI-compatible.

**Trách nhiệm**: Đọc cấu hình phía server; gửi context đã được giới hạn; timeout; chuẩn hóa lỗi; không để API key rời server.

## 9. Fallback Insight Engine

**Mục đích**: Đảm bảo demo hoạt động không cần API key.

**Trách nhiệm**: Xử lý tập câu hỏi/ý định được hỗ trợ; dùng đúng evidence Analytics Service; trả insight và khuyến nghị có cấu trúc, không dùng văn bản cố định thiếu dữ liệu.

## 10. Data Repository và Seed Data

**Mục đích**: Quản lý dữ liệu demo bán lẻ/thương mại điện tử trong SQLite cục bộ.

**Trách nhiệm**: Đọc dữ liệu qua truy vấn tham số hóa; seed dữ liệu; trả domain models đã chuẩn hóa; không cho client truy cập database trực tiếp.

## 11. Cross-cutting: Validation, Configuration, Logging

**Mục đích**: Cung cấp các cơ chế dùng chung an toàn.

**Trách nhiệm**: Schema validation, quản lý biến môi trường, logging có cấu trúc không chứa dữ liệu nhạy cảm, xử lý lỗi global và correlation ID.
