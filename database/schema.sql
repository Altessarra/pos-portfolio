CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    description TEXT,
    price REAL NOT NULL CHECK (price >= 0),
    cost REAL NOT NULL DEFAULT 0 CHECK (cost >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    image_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY,
    receipt_no TEXT NOT NULL UNIQUE,
    cashier_name TEXT NOT NULL DEFAULT 'Portfolio Demo',
    subtotal REAL NOT NULL CHECK (subtotal >= 0),
    discount REAL NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total REAL NOT NULL CHECK (total >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'gcash', 'maya', 'bank_transfer')),
    amount_received REAL NOT NULL DEFAULT 0,
    change_amount REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price REAL NOT NULL CHECK (price >= 0),
    total REAL NOT NULL CHECK (total >= 0)
);

CREATE TABLE IF NOT EXISTS inventory_logs (
    id INTEGER PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'adjustment', 'sale', 'product_created')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);

INSERT OR IGNORE INTO categories (id, name, description) VALUES
(1, 'Coffee', 'Hot and iced coffee drinks'),
(2, 'Pastries', 'Bread, cakes, and pastries'),
(3, 'Meals', 'Rice meals and snacks'),
(4, 'Drinks', 'Non-coffee beverages');

INSERT OR IGNORE INTO products
(id, category_id, name, sku, description, price, cost, stock, low_stock_threshold, image_url)
VALUES
(1, 1, 'Iced Americano', 'COF-001', 'Classic iced americano', 95.00, 35.00, 40, 8, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80&auto=format&fit=crop'),
(2, 1, 'Cafe Latte', 'COF-002', 'Espresso with steamed milk', 120.00, 45.00, 35, 8, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=600&q=80&auto=format&fit=crop'),
(3, 1, 'Caramel Macchiato', 'COF-003', 'Sweet espresso drink', 145.00, 55.00, 20, 5, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80&auto=format&fit=crop'),
(4, 2, 'Croissant', 'PAS-001', 'Butter croissant', 85.00, 35.00, 15, 5, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80&auto=format&fit=crop'),
(5, 2, 'Blueberry Muffin', 'PAS-002', 'Fresh muffin', 75.00, 25.00, 18, 5, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80&auto=format&fit=crop'),
(6, 3, 'Chicken Rice Bowl', 'MEA-001', 'Chicken meal with rice', 155.00, 75.00, 12, 4, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63e?w=600&q=80&auto=format&fit=crop'),
(7, 4, 'Bottled Water', 'DRK-001', '500ml bottled water', 25.00, 10.00, 50, 10, 'https://images.unsplash.com/photo-1560847468-5eef0e58881c?w=600&q=80&auto=format&fit=crop');
