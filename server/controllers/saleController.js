import pool from '../config/db.js';
import { generateReceiptNo } from '../utils/receipt.js';

export const checkout = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { items, discount = 0, payment_method, amount_received = 0 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    await client.query('BEGIN');

    const productIds = items.map(item => item.product_id);
    const { rows: products } = await client.query(
      `SELECT * FROM products WHERE id = ANY($1) AND is_active = TRUE FOR UPDATE`,
      [productIds]
    );

    const productMap = new Map(products.map(product => [product.id, product]));

    for (const item of items) {
      const product = productMap.get(Number(item.product_id));

      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}`);
      }
    }

    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(Number(item.product_id));
      subtotal += Number(product.price) * Number(item.quantity);
    }

    const safeDiscount = Math.min(Number(discount || 0), subtotal);
    const total = subtotal - safeDiscount;

    if (payment_method === 'cash' && Number(amount_received) < total) {
      throw new Error('Amount received is less than total');
    }

    const change_amount = payment_method === 'cash'
      ? Number(amount_received) - total
      : 0;

    const receiptNo = generateReceiptNo();

    const { rows: saleRows } = await client.query(
      `INSERT INTO sales
       (receipt_no, user_id, subtotal, discount, total, payment_method, amount_received, change_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        receiptNo,
        req.user.id,
        subtotal,
        safeDiscount,
        total,
        payment_method,
        amount_received,
        change_amount
      ]
    );

    const sale = saleRows[0];

    for (const item of items) {
      const product = productMap.get(Number(item.product_id));
      const quantity = Number(item.quantity);
      const lineTotal = Number(product.price) * quantity;
      const previousStock = Number(product.stock);
      const newStock = previousStock - quantity;

      await client.query(
        `INSERT INTO sale_items
         (sale_id, product_id, product_name, quantity, price, total)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [sale.id, product.id, product.name, quantity, product.price, lineTotal]
      );

      await client.query(
        `UPDATE products
         SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [quantity, product.id]
      );

      await client.query(
        `INSERT INTO inventory_logs
         (product_id, user_id, type, quantity, previous_stock, new_stock, note)
         VALUES ($1,$2,'sale',$3,$4,$5,$6)`,
        [product.id, req.user.id, -quantity, previousStock, newStock, `Sale ${receiptNo}`]
      );
    }

    const { rows: fullSale } = await client.query(
      `SELECT s.*, u.name AS cashier_name
       FROM sales s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [sale.id]
    );

    const { rows: saleItems } = await client.query(
      `SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY id ASC`,
      [sale.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...fullSale[0],
      items: saleItems
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const getSales = async (req, res, next) => {
  try {
    const { search = '', startDate = '', endDate = '' } = req.query;
    const values = [];
    let where = 'WHERE 1=1';

    if (search) {
      values.push(`%${search}%`);
      where += ` AND s.receipt_no ILIKE $${values.length}`;
    }

    if (startDate) {
      values.push(startDate);
      where += ` AND s.created_at::date >= $${values.length}`;
    }

    if (endDate) {
      values.push(endDate);
      where += ` AND s.created_at::date <= $${values.length}`;
    }

    const { rows } = await pool.query(`
      SELECT s.*, u.name AS cashier_name
      FROM sales s
      LEFT JOIN users u ON u.id = s.user_id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT 200
    `, values);

    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, u.name AS cashier_name
       FROM sales s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const items = await pool.query(
      'SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY id ASC',
      [req.params.id]
    );

    res.json({ ...rows[0], items: items.rows });
  } catch (error) {
    next(error);
  }
};
