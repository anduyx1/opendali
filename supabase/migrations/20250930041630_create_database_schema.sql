/*
  # Create POS System Database Schema

  This migration creates the complete database schema for the POS system including:

  1. Core Tables
    - `categories` - Product categories
    - `customers` - Customer information
    - `suppliers` - Supplier information
    - `products` - Product catalog with category relationships
    - `users` - User accounts
    - `roles` - User roles and permissions
    - `orders` - Sales orders
    - `order_items` - Order line items
    
  2. Settings and Configuration
    - `pos_app_settings` - Application settings including order sequence
    - `invoice_settings` - Invoice configuration
    - `print_templates` - Receipt and pre-receipt templates
    - `settings` - Key-value configuration pairs
    
  3. Operations Tables
    - `stock_movements` - Inventory tracking
    - `pos_sessions` - POS session data
    - `user_sessions` - User authentication sessions
    
  4. Security
    - Enable RLS on all tables
    - Create appropriate policies for data access
    - Set up proper foreign key relationships
    
  5. Default Data
    - Create default roles and settings
    - Set up initial configuration
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  customer_type TEXT CHECK (customer_type IN ('new', 'regular', 'vip')) DEFAULT 'new',
  total_orders BIGINT DEFAULT 0,
  total_spent DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role_id BIGINT REFERENCES roles(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  category_id BIGINT REFERENCES categories(id),
  retail_price DECIMAL(15,2) DEFAULT 0,
  wholesale_price DECIMAL(15,2),
  cost_price DECIMAL(15,2),
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER,
  is_service BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  image_url TEXT,
  image_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id BIGINT REFERENCES customers(id),
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'completed',
  order_status TEXT DEFAULT 'completed',
  refund_amount DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  product_id BIGINT REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) DEFAULT 0,
  total_price DECIMAL(15,2) DEFAULT 0,
  cost_price DECIMAL(15,2),
  returned_quantity INTEGER DEFAULT 0,
  returned_at TIMESTAMPTZ,
  return_reason TEXT,
  is_service BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity_change INTEGER NOT NULL,
  movement_type TEXT NOT NULL,
  reason TEXT,
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pos_app_settings table
CREATE TABLE IF NOT EXISTS pos_app_settings (
  id TEXT PRIMARY KEY DEFAULT 'pos_settings',
  shop_name TEXT DEFAULT 'My Store',
  shop_address TEXT DEFAULT '',
  shop_phone TEXT,
  tax_rate DECIMAL(5,4) DEFAULT 0.1,
  last_order_sequence INTEGER DEFAULT 0,
  default_receipt_template_id TEXT,
  default_pre_receipt_template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create print_templates table
CREATE TABLE IF NOT EXISTS print_templates (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receipt', 'pre_receipt')),
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice_settings table
CREATE TABLE IF NOT EXISTS invoice_settings (
  id BIGSERIAL PRIMARY KEY,
  business_name TEXT DEFAULT 'My Business',
  business_address TEXT DEFAULT '',
  business_phone TEXT DEFAULT '',
  business_tax_id TEXT DEFAULT '',
  logo_url TEXT,
  show_customer_info BOOLEAN DEFAULT true,
  show_tax BOOLEAN DEFAULT true,
  show_discount BOOLEAN DEFAULT true,
  show_notes BOOLEAN DEFAULT true,
  header_font_size TEXT DEFAULT '18',
  text_color TEXT DEFAULT '#000000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pos_sessions table
CREATE TABLE IF NOT EXISTS pos_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_name TEXT NOT NULL,
  user_id BIGINT REFERENCES users(id),
  customer_id BIGINT REFERENCES customers(id),
  cart_items JSONB DEFAULT '[]'::jsonb,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(5,4),
  received_amount DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id BIGINT NOT NULL REFERENCES users(id),
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table (key-value pairs)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - will be refined later)
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on suppliers" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations on roles" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on stock_movements" ON stock_movements FOR ALL USING (true);
CREATE POLICY "Allow all operations on pos_app_settings" ON pos_app_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations on print_templates" ON print_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on invoice_settings" ON invoice_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations on pos_sessions" ON pos_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_sessions" ON user_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on settings" ON settings FOR ALL USING (true);

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions) VALUES
('admin', 'Administrator', 'Full system access', '["*"]'::jsonb),
('manager', 'Manager', 'Store management access', '["orders.view", "orders.create", "orders.edit", "products.view", "products.create", "products.edit", "customers.view", "customers.create", "customers.edit", "reports.view"]'::jsonb),
('cashier', 'Cashier', 'Basic POS operations', '["orders.create", "orders.view", "products.view", "customers.view"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert default POS settings
INSERT INTO pos_app_settings (id, shop_name, shop_address, tax_rate, last_order_sequence) VALUES
('pos_settings', 'My Store', '123 Main Street', 0.1, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert default invoice settings
INSERT INTO invoice_settings (business_name, business_address, business_phone) VALUES
('My Business', '123 Main Street', '+1-234-567-8900');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);