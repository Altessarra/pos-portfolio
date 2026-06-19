import pool from '../config/db.js';

export const getProducts = async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;
    const values = [];
    let where = 'WHERE p.is_active = TRUE';

    if (search) {
      values.push(`%${search}%`);
      where += ` AND (p.name ILIKE $${values.length} OR p.sku ILIKE $${values.length})`;
    }

    if (category) {
      values.push(category);
      where += ` AND p.category_id = $${values.length}`;
    }

    const { rows } = await pool.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${where}
      ORDER BY p.name ASC
    `, values);

    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      category_id, name, sku, description, price, cost,
      stock, low_stock_threshold, image_url
    } = req.body;

    const { rows } = await client.query(
      `INSERT INTO products
       (category_id, name, sku, description, price, cost, stock, low_stock_threshold, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        category_id || null,
        name,
        sku,
        description || null,
        price,
        cost || 0,
        stock || 0,
        low_stock_threshold || 5,
        image_url || null
      ]
    );

    const product = rows[0];

    await client.query(
      `INSERT INTO inventory_logs
       (product_id, user_id, type, quantity, previous_stock, new_stock, note)
       VALUES ($1,$2,'product_created',$3,0,$3,'Initial product stock')`,
      [product.id, req.user.id, product.stock]
    );

    await client.query('COMMIT');
    res.status(201).json(product);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const updateProduct = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM products WHERE id = $1', [req.params.id]);

    if (!existing.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Product not found' });
    }

    const oldProduct = existing.rows[0];
    const {
      category_id, name, sku, description, price, cost,
      stock, low_stock_threshold, image_url
    } = req.body;

    const newStock = Number(stock);

    const { rows } = await client.query(
      `UPDATE products SET
        category_id = $1,
        name = $2,
        sku = $3,
        description = $4,
        price = $5,
        cost = $6,
        stock = $7,
        low_stock_threshold = $8,
        image_url = $9,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        category_id || null,
        name,
        sku,
        description || null,
        price,
        cost || 0,
        newStock,
        low_stock_threshold || 5,
        image_url || null,
        req.params.id
      ]
    );

    if (oldProduct.stock !== newStock) {
      await client.query(
        `INSERT INTO inventory_logs
         (product_id, user_id, type, quantity, previous_stock, new_stock, note)
         VALUES ($1,$2,'adjustment',$3,$4,$5,'Manual product stock update')`,
        [req.params.id, req.user.id, newStock - oldProduct.stock, oldProduct.stock, newStock]
      );
    }

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const archiveProduct = async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.params.id]
    );
    res.json({ message: 'Product archived' });
  } catch (error) {
    next(error);
  }
};
