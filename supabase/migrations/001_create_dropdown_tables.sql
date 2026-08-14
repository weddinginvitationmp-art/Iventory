-- Create units table
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Allow public read access on units" ON units
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on warehouses" ON warehouses
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on categories" ON categories
  FOR SELECT USING (true);

-- Insert default units
INSERT INTO units (name, description) VALUES
  ('Cái', 'Đơn vị lẻ'),
  ('Hộp', 'Hộp 10 cái'),
  ('Thùng', 'Thùng 100 cái'),
  ('Bộ', 'Bộ hoàn chỉnh'),
  ('Set', 'Set bao gồm nhiều items'),
  ('Kg', 'Kilogram'),
  ('Lít', 'Lít nước/dầu'),
  ('Bale', 'Bale vải'),
  ('Tấm', 'Tấm gỗ/kính'),
  ('Cuộn', 'Cuộn dây/vải')
ON CONFLICT (name) DO NOTHING;

-- Insert default warehouses
INSERT INTO warehouses (name, location, description) VALUES
  ('Kho chính', 'Tầng 1, Phòng A101', 'Kho lưu trữ chính'),
  ('Kho phụ 1', 'Tầng 2, Phòng B201', 'Kho lưu trữ phụ số 1'),
  ('Kho phụ 2', 'Tầng 3, Phòng C301', 'Kho lưu trữ phụ số 2'),
  ('Kho tạm', 'Sảnh chờ', 'Kho tạm thời cho hàng nhập')
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Điện tử', 'Các sản phẩm điện tử'),
  ('Văn phòng phẩm', 'Đồ dùng văn phòng'),
  ('Thực phẩm', 'Sản phẩm thực phẩm'),
  ('Dụng cụ', 'Các dụng cụ và công cụ'),
  ('Quần áo', 'Sản phẩm thời trang'),
  ('Phụ kiện', 'Phụ kiện các loại'),
  ('Sách báo', 'Sách và tài liệu'),
  ('Nước uống', 'Nước uống các loại')
ON CONFLICT (name) DO NOTHING;
