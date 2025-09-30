-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 31, 2025 at 06:17 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `v15`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `customer_type` enum('new','regular','vip') DEFAULT 'new',
  `total_spent` decimal(18,2) DEFAULT 0.00,
  `total_orders` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_settings`
--

CREATE TABLE `invoice_settings` (
  `id` int(11) NOT NULL,
  `business_name` varchar(255) NOT NULL DEFAULT 'Cửa hàng của bạn',
  `business_address` varchar(255) NOT NULL DEFAULT 'Địa chỉ cửa hàng của bạn',
  `business_phone` varchar(50) NOT NULL DEFAULT '0123456789',
  `business_tax_id` varchar(50) NOT NULL DEFAULT '0123456789',
  `show_customer_info` tinyint(1) NOT NULL DEFAULT 1,
  `show_tax` tinyint(1) NOT NULL DEFAULT 1,
  `show_discount` tinyint(1) NOT NULL DEFAULT 1,
  `show_notes` tinyint(1) NOT NULL DEFAULT 1,
  `header_font_size` varchar(50) NOT NULL DEFAULT 'text-2xl',
  `text_color` varchar(50) NOT NULL DEFAULT 'text-gray-800',
  `logo_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoice_settings`
--

INSERT INTO `invoice_settings` (`id`, `business_name`, `business_address`, `business_phone`, `business_tax_id`, `show_customer_info`, `show_tax`, `show_discount`, `show_notes`, `header_font_size`, `text_color`, `logo_url`, `created_at`, `updated_at`) VALUES
(1, 'Cửa hàng của bạn', 'Địa chỉ cửa hàng của bạn', '0123456789', '0123456789', 1, 1, 1, 1, 'text-2xl', 'text-gray-800', NULL, '2025-07-30 15:21:26', '2025-07-30 15:21:26');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `order_number` varchar(255) NOT NULL,
  `subtotal` decimal(18,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(50) NOT NULL,
  `payment_status` varchar(50) NOT NULL DEFAULT 'completed',
  `order_status` varchar(50) NOT NULL DEFAULT 'completed',
  `refund_amount` decimal(18,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_price` decimal(18,2) NOT NULL DEFAULT 0.00,
  `cost_price` decimal(18,2) DEFAULT 0.00,
  `returned_quantity` int(11) DEFAULT 0,
  `returned_at` datetime DEFAULT NULL,
  `return_reason` varchar(255) DEFAULT NULL,
  `is_service` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pos_app_settings`
--

CREATE TABLE `pos_app_settings` (
  `id` varchar(255) NOT NULL,
  `tax_rate` decimal(5,4) NOT NULL DEFAULT 0.1000,
  `shop_name` varchar(255) NOT NULL DEFAULT 'Cửa hàng của bạn',
  `shop_address` text NOT NULL DEFAULT 'Địa chỉ cửa hàng của bạn',
  `shop_phone` varchar(50) DEFAULT '0123456789',
  `default_receipt_template_id` varchar(255) DEFAULT NULL,
  `default_pre_receipt_template_id` varchar(255) DEFAULT NULL,
  `last_order_sequence` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pos_app_settings`
--

INSERT INTO `pos_app_settings` (`id`, `tax_rate`, `shop_name`, `shop_address`, `shop_phone`, `default_receipt_template_id`, `default_pre_receipt_template_id`, `last_order_sequence`, `created_at`, `updated_at`) VALUES
('pos_settings', 0.1000, 'Cửa hàng của bạn', 'Địa chỉ cửa hàng của bạn', '0123456789', NULL, NULL, 0, '2025-07-30 08:21:26', '2025-07-30 08:21:26');

-- --------------------------------------------------------

--
-- Table structure for table `pos_sessions`
--

CREATE TABLE `pos_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_name` varchar(255) NOT NULL,
  `cart_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cart_items`)),
  `customer_id` int(11) DEFAULT NULL,
  `discount_amount` decimal(15,2) DEFAULT 0.00,
  `received_amount` decimal(15,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `tax_rate` decimal(5,2) DEFAULT 0.10,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pos_sessions`
--

INSERT INTO `pos_sessions` (`id`, `user_id`, `session_name`, `cart_items`, `customer_id`, `discount_amount`, `received_amount`, `notes`, `tax_rate`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Đơn 1', '[]', NULL, 0.00, 0.00, 'Đơn hàng mới', 0.10, '2025-07-31 11:14:45', '2025-07-31 11:14:45');

-- --------------------------------------------------------

--
-- Table structure for table `print_templates`
--

CREATE TABLE `print_templates` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` enum('receipt','pre_receipt') NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `print_templates`
--

INSERT INTO `print_templates` (`id`, `name`, `content`, `type`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 'Mẫu hóa đơn mặc định', '<div style=\"font-family: \'Arial\', sans-serif; font-size: 12px; width: 100%; max-width: 300px; margin: 0 auto; padding: 0;\">\n  <div style=\"text-align: center; margin-bottom: 10px;\">\n    <h2 style=\"margin: 0; font-size: 16px;\">CỬA HÀNG ABC</h2>\n    <p style=\"margin: 2px 0;\">Địa chỉ: 123 Đường XYZ, Quận 1, TP.HCM</p>\n    <p style=\"margin: 2px 0;\">Điện thoại: 0987.654.321</p>\n    <p style=\"margin: 2px 0;\">Mã số thuế: 0123456789</p>\n  </div>\n\n  <div style=\"text-align: center; margin-bottom: 10px;\">\n    <h3 style=\"margin: 0; font-size: 14px;\">HÓA ĐƠN BÁN HÀNG</h3>\n    <p style=\"margin: 2px 0;\">Mã HĐ: {orderNumber}</p>\n    <p style=\"margin: 2px 0;\">Ngày: {date}</p>\n    <p style=\"margin: 2px 0;\">Khách hàng: {customerName}</p>\n  </div>\n\n  <hr style=\"border: none; border-top: 1px dashed #ccc; margin: 10px 0;\" />\n\n  <div style=\"margin-bottom: 10px; padding: 0;\">\n    <h4 style=\"margin: 0; font-size: 13px; text-align: center; margin-bottom: 5px;\">Chi tiết sản phẩm:</h4>\n    {items}\n  </div>\n\n  <hr style=\"border: none; border-top: 1px dashed #ccc; margin: 10px 0;\" />\n\n  <div style=\"margin-bottom: 10px; padding: 0;\">\n    <div style=\"display: flex; justify-content: space-between; margin-bottom: 3px; padding: 0 5px;\">\n      <span>Tổng tiền hàng:</span>\n      <span>{subtotal}</span>\n    </div>\n    <div style=\"display: flex; justify-content: space-between; margin-bottom: 3px; padding: 0 5px;\">\n      <span>Thuế:</span>\n      <span>{taxAmount}</span>
    </div>
    <div style=\"display: flex; justify-content: space-between; margin-bottom: 3px; padding: 0 5px;\">\n      <span>Giảm giá:</span>\n      <span>{discountAmount}</span>
    </div>
    <div style=\"display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 8px; padding-top: 5px; border-top: 1px dashed #ccc; padding: 0 5px;\">\n      <span>TỔNG CỘNG:</span>\n      <span>{totalAmount}</span>
    </div>
  </div>\n\n  <hr style=\"border: none; border-top: 1px dashed #ccc; margin: 10px 0;\" />\n\n  <div style=\"margin-bottom: 10px; padding: 0;\">\n    <div style=\"display: flex; justify-content: space-between; margin-bottom: 3px; padding: 0 5px;\">\n      <span>Tiền nhận:</span>\n      <span>{receivedAmount}</span>
    </div>
    <div style=\"display: flex; justify-content: space-between; margin-bottom: 3px; padding: 0 5px;\">\n      <span>Tiền thừa:</span>\n      <span>{changeAmount}</span>
    </div>
    <div style=\"display: flex; justify-content: space-between; margin-bottom: 3px; padding: 0 5px;\">\n      <span>Phương thức:</span>\n      <span>{paymentMethod}</span>
    </div>
  </div>\n\n  <div style=\"text-align: center; margin-top: 15px;\">\n    <p style=\"margin: 0; font-weight: bold;\">Cảm ơn quý khách và hẹn gặp lại!</p>\n    <p style=\"margin: 5px 0 0; font-size: 10px; color: #666;\">Phần mềm quản lý bán hàng By.DALI</p>\n  </div>\n</div>', 'receipt', 1, '2025-07-30 15:21:26', '2025-07-30 15:21:26'),
(2, 'Mẫu tạm tính mặc định', '<div style=\"font-family: \'Arial\', sans-serif; font-size: 12px; width: 100%; max-width: 300px; margin: 0 auto; padding: 0;\">\n  <div style=\"text-align: center; margin-bottom: 10px;\">\n    <h2 style=\"margin: 0; font-size: 16px;\">DALI</h2>\n    <p style=\"margin: 2px 0;\">Xố 19 Xóm 6 Ninh Hiệp</p>\n    <p style=\"margin: 2px 0;\">Điện thoại: 0382.28.3388</p>\n    <p style=\"margin: 2px 0;\">Mã số thuế: 0123456789</p>\n  </div>\n\n  <div style=\"text-align: center; margin-bottom: 10px;\">\n    <h3 style=\"margin: 0; font-size: 14px;\">HÓA ĐƠN BÁN HÀNG</h3>\n    <p style=\"margin: 2px 0;\">Ngày: {date}</p>\n    <p style=\"margin: 2px 0;\">Khách hàng: {customerName}</p>\n  </div>\n\n  <hr style=\"border: none; border-top: 1px dashed #ccc; margin: 10px 0;\" />\n\n  <div style=\"margin-bottom: 10px; padding: 0;\">\n    <h4 style=\"margin: 0; font-size: 13px; text-align: center; margin-bottom: 5px;\">Chi tiết sản phẩm:</h4>\n    {items}\n  </div>\n\n  <hr style=\"border: none; border-top: 1px dashed #ccc; margin: 10px 0;\" />\n\n  <div style=\"margin-bottom: 10px; padding: 0;\">\n    <div style=\"display: flex; justify-content: space-between; margin-bottom: 3px; padding: 0 5px;\">\n      <span>Tổng tiền hàng:</span>\n      <span>{subtotal}</span>
    </div>
    <div style=\"display: flex; justify-content: space-between; margin-bottom: 3px; padding: 0 5px;\">\n      <span>Thuế:</span>\n      <span>{taxAmount}</span>
    </div>
    <div style=\"display: flex; justify-content: space-between; margin-bottom: 3px; padding: 0 5px;\">\n      <span>Giảm giá:</span>\n      <span>{discountAmount}</span>
    </div>
    <div style=\"display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 8px; padding-top: 5px; border-top: 1px dashed #ccc; padding: 0 5px;\">\n      <span>TỔNG CỘNG:</span>\n      <span>{totalAmount}</span>
    </div>
  </div>\n\n  <hr style=\"border: none; border-top: 1px dashed #ccc; margin: 10px 0;\" />\n\n\n\n  <div style=\"text-align: center; margin-top: 15px;\">\n    <p style=\"margin: 0; font-weight: bold;\">Cảm ơn quý khách và hẹn gặp lại!</p>\n    <p style=\"margin: 5px 0 0; font-size: 10px; color: #666;\">Phần mềm quản lý bán hàng By.DALI</p>\n  </div>\n</div>', 'pre_receipt', 1, '2025-07-30 15:21:26', '2025-07-30 15:21:26');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `retail_price` decimal(18,2) NOT NULL DEFAULT 0.00,
  `wholesale_price` decimal(18,2) DEFAULT NULL,
  `cost_price` decimal(18,2) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `min_stock_level` int(11) DEFAULT 0,
  `barcode` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `image_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image_data`)),
  `status` varchar(50) DEFAULT 'active',
  `sku` varchar(255) DEFAULT NULL,
  `is_service` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `display_name`, `description`, `permissions`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'Quản trị viên', 'Có toàn quyền truy cập hệ thống', '[\"all\"]', '2025-07-30 08:21:26', '2025-07-30 08:21:26'),
(2, 'manager', 'Quản lý', 'Quản lý cửa hàng, xem báo cáo, quản lý nhân viên', '[\"pos\", \"inventory\", \"reports\", \"customers\", \"settings_basic\"]', '2025-07-30 08:21:26', '2025-07-30 08:21:26'),
(3, 'cashier', 'Thu ngân', 'Chỉ được sử dụng POS và xem thông tin cơ bản', '[\"pos\", \"customers_basic\"]', '2025-07-30 08:21:26', '2025-07-30 08:21:26'),
(4, 'staff', 'Nhân viên', 'Truy cập hạn chế, chỉ POS và inventory cơ bản', '[\"pos\", \"inventory_basic\"]', '2025-07-30 08:21:26', '2025-07-30 08:21:26');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `key` varchar(255) NOT NULL,
  `value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`key`, `value`) VALUES
('hotline_number', '0963881993'),
('last_order_sequence', '0'),
('tax_rate', '0');

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `movement_type` varchar(50) NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `user_id`, `username`, `full_name`, `email`, `phone`, `password_hash`, `role_id`, `is_active`, `last_login`, `avatar_url`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'ADM001', 'admin', 'Quản trị viên hệ thống', 'admin@dalipos.com', '0123456789', '$2a$10$JcHUJBMxj.C1B7gJrZGtLuQK0Z3hKPJ5.Qo7S7RqJiTDGpqQvPpSu', 1, 1, NULL, NULL, '2025-07-30 08:21:26', '2025-07-30 08:21:26', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `invoice_settings`
--
ALTER TABLE `invoice_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_order_item_product_order` (`order_id`,`product_id`);

--
-- Indexes for table `pos_app_settings`
--
ALTER TABLE `pos_app_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pos_sessions`
--
ALTER TABLE `pos_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `print_templates`
--
ALTER TABLE `print_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UQ_products_barcode` (`barcode`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_stock_movements_product_id` (`product_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_user_sessions_expires` (`expires_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_settings`
--
ALTER TABLE `invoice_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pos_sessions`
--
ALTER TABLE `pos_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `print_templates`
--
ALTER TABLE `print_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` varchar(36) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
