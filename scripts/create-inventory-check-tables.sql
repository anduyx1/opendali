-- Tạo bảng inventory_check_sessions để lưu thông tin phiếu kiểm hàng
CREATE TABLE IF NOT EXISTS `inventory_check_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_code` varchar(50) NOT NULL UNIQUE,
  `branch_name` varchar(255) DEFAULT NULL,
  `staff_name` varchar(255) DEFAULT NULL,
  `status` enum('draft','in_progress','completed','balanced') NOT NULL DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `balanced_at` datetime DEFAULT NULL,
  `balanced_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_session_code` (`session_code`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Tạo bảng inventory_check_items để lưu chi tiết từng sản phẩm trong phiếu kiểm
CREATE TABLE IF NOT EXISTS `inventory_check_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `system_quantity` int(11) NOT NULL DEFAULT 0,
  `actual_quantity` int(11) DEFAULT NULL,
  `difference` int(11) DEFAULT 0,
  `reason` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('pending','matched','discrepancy') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_status` (`status`),
  FOREIGN KEY (`session_id`) REFERENCES `inventory_check_sessions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
