-- Thêm cột receipt_item_id vào bảng goods_return_items để liên kết với goods_receipt_items
ALTER TABLE goods_return_items 
ADD COLUMN receipt_item_id INT,
ADD FOREIGN KEY (receipt_item_id) REFERENCES goods_receipt_items(id) ON DELETE CASCADE;

-- Tạo index để tối ưu hóa JOIN query
CREATE INDEX idx_goods_return_items_receipt_item_id ON goods_return_items(receipt_item_id);
