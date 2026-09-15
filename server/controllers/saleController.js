import db from '../config/db.js';
import { generateReceiptNo } from '../utils/receipt.js';

const portfolioOperator = 'Portfolio Demo';

const insertSale = db.prepare(`
  INSERT INTO sales
  (receipt_no, cashier_name, subtotal, discount, total, payment_method, amount_received, change_amount)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertSaleItem = db.prepare(`
  INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, total)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const updateProductStock = db.prepare(`
  UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
`);
const insertInventoryLog = db.prepare(`
  INSERT INTO inventory_logs
  (product_id, type, quantity, previous_stock, new_stock, note)
  VALUES (?, 'sale', ?, ?, ?, ?)
`);

const completeCheckout = db.transaction(({ items, discount = 0, payment_method, amount_received = 0, cashier_name }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty');
  }

  const quantities = new Map();
  for (const item of items) {
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Cart contains an invalid item');
    }

    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const productById = new Map();
  for (const [productId, quantity] of quantities) {
    const product = db.prepare(
      'SELECT * FROM products WHERE id = ? AND is_active = 1'
    ).get(productId);

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    if (product.stock < quantity) {
      throw new Error(`Not enough stock for ${product.name}`);
    }

    productById.set(productId, product);
  }

  const subtotal = [...quantities].reduce((sum, [productId, quantity]) => {
    return sum + Number(productById.get(productId).price) * quantity;
  }, 0);
  const safeDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = subtotal - safeDiscount;
  const received = Number(amount_received) || 0;

  if (payment_method === 'cash' && received < total) {
    throw new Error('Amount received is less than total');
  }

  const changeAmount = payment_method === 'cash' ? received - total : 0;
  const receiptNo = generateReceiptNo();
  const cashierName = typeof cashier_name === 'string' && cashier_name.trim()
    ? cashier_name.trim().slice(0, 80)
    : portfolioOperator;
  const saleResult = insertSale.run(
    receiptNo,
    cashierName,
    subtotal,
    safeDiscount,
    total,
    payment_method,
    received,
    changeAmount
  );
  const saleId = Number(saleResult.lastInsertRowid);

  for (const [productId, quantity] of quantities) {
    const product = productById.get(productId);
    const previousStock = Number(product.stock);
    const newStock = previousStock - quantity;
    const lineTotal = Number(product.price) * quantity;

    insertSaleItem.run(saleId, product.id, product.name, quantity, product.price, lineTotal);
    updateProductStock.run(newStock, product.id);
    insertInventoryLog.run(product.id, -quantity, previousStock, newStock, `Sale ${receiptNo}`);
  }

  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
  const saleItems = db.prepare(
    'SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC'
  ).all(saleId);

  return { ...sale, items: saleItems };
});

export const checkout = async (req, res, next) => {
  try {
    const sale = completeCheckout(req.body);
    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};

export const getSales = async (req, res, next) => {
  try {
    const { search = '', startDate = '', endDate = '' } = req.query;
    const filters = ['1 = 1'];
    const values = [];

    if (search) {
      filters.push('s.receipt_no LIKE ?');
      values.push(`%${search}%`);
    }

    if (startDate) {
      filters.push('DATE(s.created_at) >= DATE(?)');
      values.push(startDate);
    }

    if (endDate) {
      filters.push('DATE(s.created_at) <= DATE(?)');
      values.push(endDate);
    }

    const sales = db.prepare(`
      SELECT s.*
      FROM sales s
      WHERE ${filters.join(' AND ')}
      ORDER BY s.created_at DESC, s.id DESC
      LIMIT 200
    `).all(...values);

    res.json(sales.map(sale => ({ ...sale, cashier_name: sale.cashier_name || portfolioOperator })));
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (req, res, next) => {
  try {
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const items = db.prepare(
      'SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC'
    ).all(req.params.id);

    res.json({ ...sale, cashier_name: sale.cashier_name || portfolioOperator, items });
  } catch (error) {
    next(error);
  }
};
