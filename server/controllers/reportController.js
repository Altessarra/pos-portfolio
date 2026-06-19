import pool from '../config/db.js';

export const getReports = async (req, res, next) => {
  try {
    const dailySales = await pool.query(`
      SELECT created_at::date AS date, SUM(total)::numeric AS total, COUNT(*)::int AS orders
      FROM sales
      WHERE created_at >= CURRENT_DATE - INTERVAL '14 days'
      GROUP BY created_at::date
      ORDER BY date ASC
    `);

    const monthlySales = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, SUM(total)::numeric AS total, COUNT(*)::int AS orders
      FROM sales
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `);

    const topProducts = await pool.query(`
      SELECT product_name AS name, SUM(quantity)::int AS quantity, SUM(total)::numeric AS total
      FROM sale_items
      GROUP BY product_name
      ORDER BY quantity DESC
      LIMIT 10
    `);

    const paymentSummary = await pool.query(`
      SELECT payment_method, SUM(total)::numeric AS total, COUNT(*)::int AS orders
      FROM sales
      GROUP BY payment_method
      ORDER BY total DESC
    `);

    res.json({
      dailySales: dailySales.rows,
      monthlySales: monthlySales.rows,
      topProducts: topProducts.rows,
      paymentSummary: paymentSummary.rows
    });
  } catch (error) {
    next(error);
  }
};
