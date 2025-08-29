-- Thêm cột supplier_id và cập nhật dữ liệu để sử dụng foreign key thay vì text
-- Thêm cột supplier_id vào bảng goods_receipts
ALTER TABLE goods_receipts 
ADD COLUMN supplier_id INT NULL,
ADD INDEX idx_supplier_id (supplier_id);

-- Cập nhật supplier_id dựa trên tên nhà cung cấp hiện có
UPDATE goods_receipts gr
JOIN suppliers s ON gr.supplier = s.name
SET gr.supplier_id = s.id;

-- Tạo nhà cung cấp mặc định cho những đơn không có nhà cung cấp
INSERT IGNORE INTO suppliers (name, phone, address, created_at, updated_at)
VALUES ('Nhà cung cấp mặc định', NULL, NULL, NOW(), NOW());

-- Cập nhật supplier_id cho những đơn chưa có
UPDATE goods_receipts 
SET supplier_id = (SELECT id FROM suppliers WHERE name = 'Nhà cung cấp mặc định' LIMIT 1)
WHERE supplier_id IS NULL;
