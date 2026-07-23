# Yêu cầu sản phẩm - AI Business Intelligence Assistant

## 1. Tóm tắt phân tích

- **Yêu cầu người dùng**: Tạo AI Business Intelligence Assistant làm sản phẩm portfolio/CV ấn tượng, không nhằm kinh doanh.
- **Loại yêu cầu**: Dự án mới.
- **Phạm vi**: Nhiều thành phần: web UI, dữ liệu phân tích, API/AI và kiểm thử.
- **Độ phức tạp**: Trung bình đến cao.
- **Định vị**: Dashboard BI độc lập cho một doanh nghiệp bán lẻ/thương mại điện tử giả lập.
- **Vai trò mục tiêu**: Kỹ sư Full-stack / AI.

## 2. Mục tiêu và tiêu chí thành công

Tạo bản demo web có thể triển khai, thể hiện năng lực chuyển dữ liệu kinh doanh thành insight có căn cứ thông qua dashboard và hội thoại AI.

- Người xem hiểu được giá trị sản phẩm trong 60 giây: KPI, diễn biến chính và chức năng hỏi đáp AI.
- Mỗi câu trả lời AI có số liệu, biểu đồ hoặc dữ liệu làm căn cứ.
- Dữ liệu mẫu phản ánh đơn hàng, doanh thu, sản phẩm, khách hàng và kênh bán.
- Ứng dụng chạy cục bộ, có tài liệu triển khai demo.
- Người xem không phải cung cấp API key để trải nghiệm demo.

## 3. Người dùng và tình huống sử dụng

Người dùng chính là người quản lý kinh doanh của doanh nghiệp bán lẻ giả lập. Họ cần:

1. Xem doanh thu, đơn hàng, giá trị đơn trung bình, khách hàng và tăng trưởng so với kỳ trước.
2. Hỏi như: "Doanh thu tháng này giảm vì sao?" hoặc "Sản phẩm nào cần ưu tiên?".
3. Nhận insight, số liệu minh chứng, biểu đồ liên quan và hành động đề xuất.
4. Dùng câu hỏi gợi ý để khám phá dữ liệu nhanh.

## 4. Yêu cầu chức năng

### FR-01 - Dashboard điều hành

Hiển thị doanh thu, số đơn hàng, giá trị đơn hàng trung bình, số khách hàng và so sánh với kỳ trước.

### FR-02 - Phân tích trực quan

Có biểu đồ doanh thu theo thời gian, phân rã theo danh mục/kênh bán và bảng sản phẩm hoặc khu vực nổi bật.

### FR-03 - Trợ lý hỏi đáp AI

Người dùng đặt câu hỏi bằng ngôn ngữ tự nhiên về dữ liệu ứng dụng; hệ thống trả lời dựa trên dữ liệu với số liệu và chiều phân tích liên quan.

### FR-04 - Insight có căn cứ

Mỗi phản hồi AI nêu KPI/đo lường, kỳ thời gian và căn cứ dữ liệu phù hợp. Không trình bày kết luận không có dữ liệu hỗ trợ như sự thật.

### FR-05 - Hành động đề xuất

Trợ lý đưa ra hành động kinh doanh ưu tiên, kèm lý do dựa trên insight.

### FR-06 - Câu hỏi gợi ý

Cung cấp câu hỏi mẫu phù hợp với bộ dữ liệu để người xem trải nghiệm ngay.

### FR-07 - Dữ liệu demo

Dùng bộ dữ liệu mẫu bán lẻ/thương mại điện tử được tuyển chọn, lưu cục bộ; tài liệu hóa mô hình dữ liệu, nguồn gốc và giả định.

### FR-08 - Chế độ AI dự phòng

Demo vẫn hoạt động khi không cấu hình API OpenAI-compatible. Khi có cấu hình hợp lệ, backend dùng API mà không để lộ khóa bí mật cho trình duyệt.

### FR-09 - Trạng thái và lỗi

Hiển thị trạng thái xử lý, lỗi an toàn và cách thử lại khi yêu cầu phân tích thất bại.

## 5. Yêu cầu phi chức năng

### NFR-01 - Trải nghiệm portfolio

Giao diện chỉn chu, đáp ứng desktop và mobile, luồng demo rõ ràng, không yêu cầu đăng nhập ở bản đầu.

### NFR-02 - Hiệu năng

Dashboard dữ liệu mẫu tải nhanh cục bộ. Lời gọi AI bên ngoài có thời hạn chờ và cơ chế dự phòng.

### NFR-03 - Bảo mật

Áp dụng đầy đủ Security Baseline: không hard-code/lộ API key; kiểm tra đầu vào API; giới hạn tốc độ; header HTTP an toàn; lỗi fail-safe; log cấu trúc không chứa dữ liệu nhạy cảm; lockfile và quét lỗ hổng dependency.

### NFR-04 - Khả năng kiểm thử

Áp dụng đầy đủ property-based testing cho logic nghiệp vụ/biến đổi dữ liệu phù hợp, bên cạnh kiểm thử theo kịch bản. Framework cần hỗ trợ generator theo domain, shrinking và tái lập bằng seed.

### NFR-05 - Khả năng bảo trì

Tách phần hiển thị, truy vấn/biến đổi dữ liệu, logic insight và tích hợp AI. Có hướng dẫn chạy, kiểm thử và triển khai.

### NFR-06 - Khả năng truy cập

Thành phần tương tác chính hỗ trợ bàn phím, nhãn truy cập phù hợp và độ tương phản dễ đọc.

## 6. Ranh giới phiên bản đầu

### Trong phạm vi

- Sản phẩm web BI mới, độc lập.
- Dữ liệu demo cục bộ.
- Dashboard KPI, biểu đồ, hỏi đáp AI, insight và khuyến nghị.
- API OpenAI-compatible phía server, kèm chế độ demo dự phòng.
- Kiểm thử, tài liệu và cấu hình triển khai demo.

### Ngoài phạm vi

- Website bán hàng hoặc thanh toán cho khách hàng.
- Đăng nhập/đa người dùng và phân quyền nghiệp vụ hoàn chỉnh.
- Đồng bộ dữ liệu thời gian thực từ hệ thống doanh nghiệp.
- Nhập CSV làm nguồn dữ liệu chính.

## 7. Quyết định đã chốt

| Hạng mục | Quyết định |
|---|---|
| Loại sản phẩm | Dashboard BI độc lập cho doanh nghiệp giả lập |
| Năng lực nổi bật | Hỏi đáp ngôn ngữ tự nhiên với insight, biểu đồ và hành động |
| Dữ liệu | Dữ liệu mẫu cục bộ có mô hình được tài liệu hóa |
| AI | API OpenAI-compatible phía server, kèm chế độ demo dự phòng |
| Chất lượng | Demo chỉn chu, có thể triển khai |
| Bảo mật | Bật đầy đủ Security Baseline |
| Kiểm thử | Bật đầy đủ Property-Based Testing |

## 8. Tuân thủ extension ở giai đoạn yêu cầu

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| SECURITY-01 đến SECURITY-15 | Sẽ áp dụng | Các yêu cầu thiết kế/xây dựng sẽ được kiểm chứng ở giai đoạn tiếp theo; không có vi phạm ở tài liệu yêu cầu. |
| PBT-01 đến PBT-10 | Sẽ áp dụng | Tính chất kiểm thử, framework và bài kiểm thử cụ thể sẽ được thiết kế/xây dựng ở giai đoạn tiếp theo. |
