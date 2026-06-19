DROP TABLE IF EXISTS inventory_logs CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(160) NOT NULL,
    sku VARCHAR(80) NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    receipt_no VARCHAR(80) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'card', 'gcash', 'maya', 'bank_transfer')),
    amount_received NUMERIC(12, 2) NOT NULL DEFAULT 0,
    change_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(160) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0)
);

CREATE TABLE inventory_logs (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'adjustment', 'sale', 'product_created')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);

INSERT INTO users (name, email, password, role)
VALUES
('System Admin', 'admin@pos.com', '$2a$10$CV4w2NEQCws/7u3fd09QmeAqO7j74kJ2P2.IJf6Jr62u6Lw7N0O8O', 'admin'),
('Store Manager', 'manager@pos.com', '$2a$10$CV4w2NEQCws/7u3fd09QmeAqO7j74kJ2P2.IJf6Jr62u6Lw7N0O8O', 'manager'),
('Main Cashier', 'cashier@pos.com', '$2a$10$CV4w2NEQCws/7u3fd09QmeAqO7j74kJ2P2.IJf6Jr62u6Lw7N0O8O', 'cashier');

INSERT INTO categories (name, description)
VALUES
('Coffee', 'Hot and iced coffee drinks'),
('Pastries', 'Bread, cakes, and pastries'),
('Meals', 'Rice meals and snacks'),
('Drinks', 'Non-coffee beverages');

INSERT INTO products (category_id, name, sku, description, price, cost, stock, low_stock_threshold, image_url)
VALUES
(1, 'Iced Americano', 'COF-001', 'Classic iced americano', 95.00, 35.00, 40, 8, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80&auto=format&fit=crop'),
(1, 'Cafe Latte', 'COF-002', 'Espresso with steamed milk', 120.00, 45.00, 35, 8, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=600&q=80&auto=format&fit=crop'),
(1, 'Caramel Macchiato', 'COF-003', 'Sweet espresso drink', 145.00, 55.00, 20, 5, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80&auto=format&fit=crop'),
(2, 'Croissant', 'PAS-001', 'Butter croissant', 85.00, 35.00, 15, 5, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80&auto=format&fit=crop'),
(2, 'Blueberry Muffin', 'PAS-002', 'Fresh muffin', 75.00, 25.00, 18, 5, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80&auto=format&fit=crop'),
(3, 'Chicken Rice Bowl', 'MEA-001', 'Chicken meal with rice', 155.00, 75.00, 12, 4, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&auto=format&fit=crop'),
(4, 'Bottled Water', 'DRK-001', '500ml bottled water', 25.00, 10.00, 50, 10, 'https://images.unsplash.com/photo-1560847468-5eef0e58881c?w=600&q=80&auto=format&fit=crop');
