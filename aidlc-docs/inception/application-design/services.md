# Dịch vụ và điều phối

## Dashboard Service

Nhận yêu cầu dashboard, xác định kỳ mặc định, gọi Analytics Service và tạo response ổn định cho giao diện. Dịch vụ này không gọi LLM.

## Analytics Service

Là nguồn sự thật cho các phép đo. Tất cả KPI và bằng chứng cho AI được tính tại đây từ Data Repository. Điều này giữ thống nhất giữa dashboard và phản hồi AI.

## Insight Orchestrator

Điều phối luồng hỏi đáp:

1. Nhận input đã được API Controller xác thực.
2. Xác định ý định có được hỗ trợ.
3. Lấy evidence từ Analytics Service.
4. Nếu cấu hình AI hợp lệ, yêu cầu AI Provider Adapter tóm tắt evidence; nếu không, gọi Fallback Insight Engine.
5. Đảm bảo response có evidence, kỳ thời gian và action phù hợp trước khi trả về.

## AI Provider Adapter

Chỉ tồn tại ở server. Adapter nhận prompt/context đã có evidence, quản lý timeout và biến lỗi nhà cung cấp thành lỗi domain an toàn.

## Fallback Insight Engine

Dùng bộ ý định hữu hạn, ví dụ doanh thu biến động, top sản phẩm và hiệu quả kênh. Engine tạo câu trả lời từ kết quả Analytics Service, nên số liệu phản ánh dữ liệu seed thực tế.

## Dịch vụ dùng chung

- **Validation**: Kiểm tra mọi input API về kiểu, độ dài, format và payload.
- **Rate Limiting**: Bảo vệ endpoint hỏi AI trước lạm dụng.
- **Structured Logging**: Log timestamp, request/correlation ID, level, message; cấm log secret hoặc nội dung câu hỏi nguyên văn nếu không cần thiết.
- **Error Handling**: Global error boundary trả lỗi an toàn, fail closed với các lỗi external.
