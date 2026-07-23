# Mô hình logic nghiệp vụ

## Luồng dashboard

1. Xác định kỳ dữ liệu mặc định.
2. Đọc order hoàn tất và line liên quan trong kỳ.
3. Tính KPI, so sánh kỳ trước, trend và breakdown.
4. Trả dashboard view model chỉ gồm dữ liệu đã tổng hợp.

## Luồng hỏi đáp

1. Validate câu hỏi.
2. Phân loại ý định trong tập hỗ trợ.
3. Lấy evidence từ Analytics Service với cùng quy tắc KPI của dashboard.
4. Nếu AI provider sẵn sàng, gửi context evidence giới hạn để tạo bản tóm tắt; nếu không, chạy fallback.
5. Kiểm tra response: evidence, period và action phải nhất quán.
6. Trả response cho UI hoặc lỗi an toàn.

## Testable Properties (PBT-01)

| Thành phần | Loại tính chất | Mệnh đề cần kiểm thử |
|---|---|---|
| Tính doanh thu | Invariant | Doanh thu >= 0 với mọi order line hợp lệ; thêm line hợp lệ không làm doanh thu giảm |
| Breakdown | Invariant | Tổng revenue các nhóm bằng tổng revenue cùng kỳ (trong sai số làm tròn) |
| AOV | Invariant | Khi có n đơn: `aov * n = revenue`; không có đơn thì aov = 0 |
| Chuẩn hóa câu hỏi | Idempotence | normalize(normalize(q)) = normalize(q) |
| DTO response | Round-trip | serialize/deserialize response hợp lệ bảo toàn cấu trúc |
| Fallback | Oracle | Response fallback chỉ chứa metric/period có trong evidence đầu vào |
| Repository/analytics | Oracle | Kết quả aggregate được so sánh với phép tính tham chiếu trên danh sách order line nhỏ sinh ngẫu nhiên |

## Kịch bản biên

- Kỳ không có đơn.
- Kỳ trước bằng 0.
- Một sản phẩm, một kênh, một order.
- Discount 0 và discount gần 1.
- Câu hỏi rỗng, quá dài, hoặc ý định không hỗ trợ.
