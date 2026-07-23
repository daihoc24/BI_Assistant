# Quy tắc nghiệp vụ và validation

## Quy tắc KPI

1. Chỉ order `completed` được tính vào KPI và evidence.
2. Một order line có quantity dương và discount trong [0, 1].
3. Doanh thu không được âm; line có giá 0 hợp lệ.
4. AOV bằng 0 khi số đơn bằng 0, không trả về NaN hoặc Infinity.
5. Tỷ lệ biến động kỳ trước không xác định khi giá trị kỳ trước là 0; UI hiển thị trạng thái phù hợp thay vì chia cho 0.
6. Tổng của breakdown theo danh mục/kênh bằng tổng doanh thu của cùng bộ lọc/kỳ, với sai số làm tròn tiền tệ cho phép.

## Quy tắc hỏi đáp và insight

1. Câu hỏi có độ dài giới hạn và phải là chuỗi văn bản hợp lệ sau khi trim.
2. Chỉ xử lý các ý định được hỗ trợ: tổng quan KPI, biến động doanh thu, top sản phẩm/danh mục, hiệu quả kênh.
3. Mọi kết luận phải có evidence tạo bởi Analytics Service, gồm metric và kỳ thời gian.
4. Khi dữ liệu không đủ hoặc ý định không được hỗ trợ, phản hồi nêu rõ giới hạn; không suy đoán.
5. Fallback chỉ tạo insight từ evidence thực tế, không dùng kết luận hard-code độc lập với dữ liệu.
6. Khuyến nghị phải liên kết với ít nhất một evidence trong response.

## Quy tắc lỗi

- Input không hợp lệ trả lỗi an toàn, không chuyển vào analytics/AI provider.
- Lỗi provider, database hoặc timeout được log có correlation ID nhưng response không chứa stack trace/secret.
- Khi provider AI lỗi, fallback được thử nếu ý định hỗ trợ; nếu fallback không thể xử lý thì trả lỗi có thể thử lại.
