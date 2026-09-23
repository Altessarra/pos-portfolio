import { client } from '../config/postgres.js';

const createInventoryLog = async (connection, values) => connection.unsafe(
  'INSERT INTO inventory_logs (product_id, type, quantity, previous_stock, new_stock, note) VALUES ($1, $2, $3, $4, $5, $6)',
  values
);

export const getProducts = async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;
    const values = [];
    const filters = ['p.is_active = TRUE'];

    if (search) {
      values.push('%' + search + '%');
      const nameIndex = values.length;
      values.push('%' + search + '%');
      filters.push('(p.name ILIKE $' + nameIndex + ' OR p.sku ILIKE $' + values.length + ')');
    }

    if (category) {
      values.push(category);
      filters.push('p.category_id = $' + values.length);
    }

    const products = await client.unsafe(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ' +
        filters.join(' AND ') +
        ' ORDER BY p.name ASC',
      values
    );

    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await client.begin(async transaction => {
      const [created] = await transaction.unsafe(
        'INSERT INTO products (category_id, name, sku, description, price, cost, stock, low_stock_threshold, image_url) ' +
          'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          req.body.category_id || null,
          req.body.name,
          req.body.sku,
          req.body.description || null,
          Number(req.body.price),
          Number(req.body.cost || 0),
          Number(req.body.stock || 0),
          Number(req.body.low_stock_threshold || 5),
          req.body.image_url || null
        ]
      );

      await createInventoryLog(transaction, [
        created.id,
        'product_created',
        created.stock,
        0,
        created.stock,
        'Initial product stock'
      ]);

      return created;
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await client.begin(async transaction => {
      const [existing] = await transaction.unsafe(
        'SELECT * FROM products WHERE id = $1 FOR UPDATE',
        [req.params.id]
      );

      if (!existing) return null;

      const newStock = Number(req.body.stock);
      await transaction.unsafe(
        'UPDATE products SET category_id = $1, name = $2, sku = $3, description = $4, price = $5, cost = $6, ' +
          'stock = $7, low_stock_threshold = $8, image_url = $9, updated_at = NOW() WHERE id = $10',
        [
          req.body.category_id || null,
          req.body.name,
          req.body.sku,
          req.body.description || null,
          Number(req.body.price),
          Number(req.body.cost || 0),
          newStock,
          Number(req.body.low_stock_threshold || 5),
          req.body.image_url || null,
          req.params.id
        ]
      );

      if (Number(existing.stock) !== newStock) {
        await createInventoryLog(transaction, [
          req.params.id,
          'adjustment',
          newStock - Number(existing.stock),
          existing.stock,
          newStock,
          'Manual product stock update'
        ]);
      }

      const [updated] = await transaction.unsafe(
        'SELECT * FROM products WHERE id = $1',
        [req.params.id]
      );
      return updated;
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const archiveProduct = async (req, res, next) => {
  try {
    await client.unsafe(
      'UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Product archived' });
  } catch (error) {
    next(error);
  }
};
