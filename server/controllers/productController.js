import db from '../config/db.js';

const createInventoryLog = db.prepare(`
  INSERT INTO inventory_logs
  (product_id, type, quantity, previous_stock, new_stock, note)
  VALUES (?, ?, ?, ?, ?, ?)
`);

export const getProducts = async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;
    const values = [];
    const filters = ['p.is_active = 1'];

    if (search) {
      const term = `%${search}%`;
      filters.push('(p.name LIKE ? OR p.sku LIKE ?)');
      values.push(term, term);
    }

    if (category) {
      filters.push('p.category_id = ?');
      values.push(category);
    }

    const products = db.prepare(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${filters.join(' AND ')}
      ORDER BY p.name ASC
    `).all(...values);

    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = db.transaction((payload) => {
      const result = db.prepare(`
        INSERT INTO products
        (category_id, name, sku, description, price, cost, stock, low_stock_threshold, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        payload.category_id || null,
        payload.name,
        payload.sku,
        payload.description || null,
        Number(payload.price),
        Number(payload.cost || 0),
        Number(payload.stock || 0),
        Number(payload.low_stock_threshold || 5),
        payload.image_url || null
      );
      const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

      createInventoryLog.run(
        created.id,
        'product_created',
        created.stock,
        0,
        created.stock,
        'Initial product stock'
      );

      return created;
    })(req.body);

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = db.transaction((id, payload) => {
      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

      if (!existing) {
        return null;
      }

      const newStock = Number(payload.stock);
      db.prepare(`
        UPDATE products SET
          category_id = ?,
          name = ?,
          sku = ?,
          description = ?,
          price = ?,
          cost = ?,
          stock = ?,
          low_stock_threshold = ?,
          image_url = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        payload.category_id || null,
        payload.name,
        payload.sku,
        payload.description || null,
        Number(payload.price),
        Number(payload.cost || 0),
        newStock,
        Number(payload.low_stock_threshold || 5),
        payload.image_url || null,
        id
      );

      if (existing.stock !== newStock) {
        createInventoryLog.run(
          id,
          'adjustment',
          newStock - existing.stock,
          existing.stock,
          newStock,
          'Manual product stock update'
        );
      }

      return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    })(req.params.id, req.body);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const archiveProduct = async (req, res, next) => {
  try {
    db.prepare(`
      UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);
    res.json({ message: 'Product archived' });
  } catch (error) {
    next(error);
  }
};
