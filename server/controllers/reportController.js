import db from '../config/db.js';

const numberize = (rows, numericFields) => rows.map(row => ({
  ...row,
  ...Object.fromEntries(numericFields.map(field => [field, Number(row[field])]))
}));

export const getReports = async (req, res, next) => {
  try {
    const dailySales = db.prepare(`
      SELECT DATE(created_at) AS date, SUM(total) AS total, COUNT(*) AS orders
      FROM sales
      WHERE DATE(created_at) >= DATE('now', '-14 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    const monthlySales = db.prepare(`
      SELECT strftime('%Y-%m', created_at) AS month, SUM(total) AS total, COUNT(*) AS orders
      FROM sales
      WHERE DATE(created_at) >= DATE('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all();

    const topProducts = db.prepare(`
      SELECT product_name AS name, SUM(quantity) AS quantity, SUM(total) AS total
      FROM sale_items
      GROUP BY product_name
      ORDER BY quantity DESC
      LIMIT 10
    `).all();

    const paymentSummary = db.prepare(`
      SELECT payment_method, SUM(total) AS total, COUNT(*) AS orders
      FROM sales
      GROUP BY payment_method
      ORDER BY total DESC
    `).all();

    res.json({
      dailySales: numberize(dailySales, ['total', 'orders']),
      monthlySales: numberize(monthlySales, ['total', 'orders']),
      topProducts: numberize(topProducts, ['quantity', 'total']),
      paymentSummary: numberize(paymentSummary, ['total', 'orders'])
    });
  } catch (error) {
    next(error);
  }
};
