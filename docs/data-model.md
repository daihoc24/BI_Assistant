# Dữ liệu demo

`lib/data/seed.ts` chứa dữ liệu bán lẻ demo có chủ đích: đơn hoàn tất, một đơn hủy, bốn sản phẩm và ba kênh bán. `lib/data/repository.ts` tạo SQLite local và seed dữ liệu ở lần chạy đầu. Dữ liệu được thiết kế để thể hiện doanh thu theo tháng, discount, sản phẩm dẫn đầu và hiệu quả kênh.

Quy tắc tính doanh thu: `quantity × unitPrice × (1 - discount)`. Chỉ đơn `completed` được tính vào KPI/insight. Bản portfolio dùng seed data bất biến để demo tái lập, được lưu trong SQLite; bước mở rộng tiếp theo là thay SQLite bằng PostgreSQL managed mà không đổi interface analytics.
