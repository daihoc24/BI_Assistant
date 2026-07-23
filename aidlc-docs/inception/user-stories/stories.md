# User Stories

## Cấu trúc hành trình

1. **Khám phá**: Nhìn nhanh sức khỏe kinh doanh.
2. **Điều tra**: Đi sâu vào xu hướng và các chiều phân tích.
3. **Hỏi AI**: Nhận câu trả lời có căn cứ.
4. **Hành động**: Xem đề xuất ưu tiên và xử lý tình huống lỗi.

Tất cả stories bên dưới áp dụng cho persona **Minh - Business Manager** và được viết theo nguyên tắc INVEST.

## Epic 1 - Khám phá sức khỏe kinh doanh

### US-01 - Xem KPI tổng quan

**Là** Minh, Business Manager, **tôi muốn** xem các KPI chính và biến động so với kỳ trước, **để** nhanh chóng đánh giá sức khỏe kinh doanh.

**Liên kết yêu cầu**: FR-01, NFR-01, NFR-02, NFR-06.

**Tiêu chí nghiệm thu**:

```gherkin
Given tôi mở ứng dụng với dữ liệu demo hợp lệ
When dashboard hoàn tất tải
Then tôi thấy doanh thu, số đơn hàng, giá trị đơn trung bình và số khách hàng
And mỗi KPI hiển thị giá trị và so sánh với kỳ trước

Given dashboard đang tải hoặc không thể tải dữ liệu
When trạng thái thay đổi
Then tôi thấy trạng thái đang tải hoặc thông báo lỗi an toàn cùng lựa chọn thử lại
```

## Epic 2 - Điều tra biến động

### US-02 - Phân tích xu hướng và chiều kinh doanh

**Là** Minh, Business Manager, **tôi muốn** xem xu hướng doanh thu và các phân rã quan trọng, **để** xác định khu vực cần điều tra.

**Liên kết yêu cầu**: FR-02, FR-07, NFR-01, NFR-06.

**Tiêu chí nghiệm thu**:

```gherkin
Given dashboard có dữ liệu demo hợp lệ
When tôi xem phần phân tích
Then tôi thấy biểu đồ doanh thu theo thời gian
And tôi thấy ít nhất một phân rã theo danh mục hoặc kênh bán
And tôi thấy bảng sản phẩm hoặc khu vực nổi bật

Given tôi dùng bàn phím để điều hướng nội dung chính
When tôi di chuyển qua biểu đồ và bảng
Then các phần tử tương tác có nhãn truy cập phù hợp
```

### US-03 - Khởi đầu bằng câu hỏi gợi ý

**Là** Minh, Business Manager, **tôi muốn** chọn câu hỏi gợi ý phù hợp với dữ liệu, **để** khám phá insight mà không cần tự nghĩ cách đặt câu hỏi.

**Liên kết yêu cầu**: FR-06, NFR-01.

**Tiêu chí nghiệm thu**:

```gherkin
Given tôi đang xem khu vực trợ lý AI
When ứng dụng sẵn sàng
Then tôi thấy các câu hỏi gợi ý về KPI, xu hướng hoặc sản phẩm

Given tôi chọn một câu hỏi gợi ý
When câu hỏi được gửi
Then tôi thấy câu hỏi trong hội thoại
And hệ thống bắt đầu xử lý yêu cầu phân tích
```

## Epic 3 - Hỏi AI có căn cứ

### US-04 - Đặt câu hỏi phân tích bằng ngôn ngữ tự nhiên

**Là** Minh, Business Manager, **tôi muốn** hỏi AI về hiệu quả kinh doanh bằng ngôn ngữ tự nhiên, **để** nhận insight mà không cần truy vấn dữ liệu thủ công.

**Liên kết yêu cầu**: FR-03, FR-08, FR-09, NFR-02, NFR-03.

**Tiêu chí nghiệm thu**:

```gherkin
Given tôi nhập một câu hỏi hợp lệ trong giới hạn cho phép
When tôi gửi câu hỏi
Then hệ thống xác thực đầu vào và hiển thị trạng thái đang xử lý
And câu trả lời được trả về từ AI hoặc chế độ demo dự phòng

Given câu hỏi không hợp lệ hoặc dịch vụ AI không khả dụng
When tôi gửi yêu cầu
Then hệ thống không để lộ chi tiết nội bộ hoặc khóa bí mật
And tôi nhận được thông báo an toàn cùng lựa chọn thử lại
```

### US-05 - Kiểm chứng insight AI

**Là** Minh, Business Manager, **tôi muốn** xem số liệu và ngữ cảnh cho phản hồi AI, **để** tin tưởng insight trước khi hành động.

**Liên kết yêu cầu**: FR-03, FR-04, NFR-03.

**Tiêu chí nghiệm thu**:

```gherkin
Given hệ thống trả lời một câu hỏi phân tích
When tôi xem phản hồi
Then tôi thấy insight kèm KPI hoặc số liệu liên quan
And tôi thấy kỳ thời gian hoặc chiều phân tích được sử dụng
And tôi thấy biểu đồ hoặc dữ liệu tóm tắt khi có liên quan

Given dữ liệu không đủ để đưa ra kết luận
When phản hồi được tạo
Then hệ thống nêu rõ giới hạn dữ liệu
And không trình bày kết luận không có căn cứ như sự thật
```

## Epic 4 - Chuyển insight thành hành động

### US-06 - Nhận hành động ưu tiên

**Là** Minh, Business Manager, **tôi muốn** nhận hành động kinh doanh được đề xuất sau insight, **để** biết bước tiếp theo nên làm gì.

**Liên kết yêu cầu**: FR-05, FR-04.

**Tiêu chí nghiệm thu**:

```gherkin
Given một phản hồi AI có insight đủ căn cứ
When tôi xem phần kết luận
Then tôi thấy ít nhất một hành động được đề xuất
And mỗi hành động nêu lý do liên kết với insight hoặc KPI liên quan

Given không đủ dữ liệu để khuyến nghị
When hệ thống hoàn tất phản hồi
Then hệ thống giải thích không thể đề xuất hành động cụ thể
And không tạo khuyến nghị suy đoán
```

## Kiểm tra chất lượng

- **Independent**: Mỗi story có giá trị riêng và có thể phát triển/kiểm thử độc lập.
- **Negotiable**: Chi tiết trình bày và implementation chưa bị khóa ở cấp story.
- **Valuable**: Mỗi story hỗ trợ một bước ra quyết định của persona.
- **Estimable/Small**: Stories được chia theo năng lực có ranh giới rõ.
- **Testable**: Tất cả có Given/When/Then và điều kiện lỗi quan trọng.
