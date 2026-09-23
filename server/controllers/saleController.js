import { client } from '../config/postgres.js';
import { generateReceiptNo } from '../utils/receipt.js';

const portfolioOperator = 'Portfolio Demo';

const completeCheckout = async payload => client.begin(async transaction => {
  const { items, discount = 0, payment_method, amount_received = 0, cashier_name } = payload;
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
  for (const [productId, quantity] of [...quantities].sort(([left], [right]) => left - right)) {
    const [product] = await transaction.unsafe(
      'SELECT * FROM products WHERE id = $1 AND is_active = TRUE FOR UPDATE',
      [productId]
    );

    if (!product) throw new Error('Product not found: ' + productId);
    if (Number(product.stock) < quantity) {
      throw new Error('Not enough stock for ' + product.name);
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
  const [sale] = await transaction.unsafe(
    'INSERT INTO sales (receipt_no, cashier_name, subtotal, discount, total, payment_method, amount_received, change_amount) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [receiptNo, cashierName, subtotal, safeDiscount, total, payment_method, received, changeAmount]
  );

  const saleId = Number(sale.id);
  for (const [productId, quantity] of quantities) {
    const product = productById.get(productId);
    const previousStock = Number(product.stock);
    const newStock = previousStock - quantity;
    const lineTotal = Number(product.price) * quantity;

    await transaction.unsafe(
      'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, total) VALUES ($1, $2, $3, $4, $5, $6)',
      [saleId, product.id, product.name, quantity, product.price, lineTotal]
    );
    await transaction.unsafe(
      'UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2',
      [newStock, product.id]
    );
    await transaction.unsafe(
      "INSERT INTO inventory_logs (product_id, type, quantity, previous_stock, new_stock, note) " +
        "VALUES ($1, 'sale', $2, $3, $4, $5)",
      [product.id, -quantity, previousStock, newStock, 'Sale ' + receiptNo]
    );
  }

  const [savedSale] = await transaction.unsafe('SELECT * FROM sales WHERE id = $1', [saleId]);
  const saleItems = await transaction.unsafe('SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY id ASC', [saleId]);
  return { ...savedSale, items: saleItems };
});

export const checkout = async (req, res, next) => {
  try {
    const sale = await completeCheckout(req.body);
    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};

export const getSales = async (req, res, next) => {
  try {
    const { search = '', startDate = '', endDate = '' } = req.query;
    const filters = ['TRUE'];
    const values = [];

    if (search) {
      values.push('%' + search + '%');
      filters.push('s.receipt_no ILIKE $' + values.length);
    }

    if (startDate) {
      values.push(startDate);
      filters.push("(s.created_at AT TIME ZONE 'Asia/Manila')::date >= $" + values.length + '::date');
    }

    if (endDate) {
      values.push(endDate);
      filters.push("(s.created_at AT TIME ZONE 'Asia/Manila')::date <= $" + values.length + '::date');
    }

    const sales = await client.unsafe(
      'SELECT s.* FROM sales s WHERE ' + filters.join(' AND ') +
        ' ORDER BY s.created_at DESC, s.id DESC LIMIT 200',
      values
    );

    res.json(sales.map(sale => ({ ...sale, cashier_name: sale.cashier_name || portfolioOperator })));
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (req, res, next) => {
  try {
    const [sale] = await client.unsafe('SELECT * FROM sales WHERE id = $1', [req.params.id]);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    const items = await client.unsafe(
      'SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY id ASC',
      [req.params.id]
    );

    res.json({ ...sale, cashier_name: sale.cashier_name || portfolioOperator, items });
  } catch (error) {
    next(error);
  }
};
