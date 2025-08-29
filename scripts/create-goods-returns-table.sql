-- Tạo bảng goods_returns để lưu thông tin hoàn trả
CREATE TABLE IF NOT EXISTS goods_returns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  return_code VARCHAR(50) NOT NULL UNIQUE,
  goods_receipt_id INT NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  branch VARCHAR(255) NOT NULL,
  staff VARCHAR(255) NOT NULL,
  return_reason TEXT,
  total_quantity INT NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  refund_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goods_return_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  return_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES goods_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
