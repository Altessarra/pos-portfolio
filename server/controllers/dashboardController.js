import pool from '../config/db.js';

export const getDashboard = async (req, res, next) => {
  try {
    const todaySales = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM sales
      WHERE created_at::date = CURRENT_DATE
    `);

    const totalOrders = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM sales
      WHERE created_at::date = CURRENT_DATE
    `);

    const lowStock = await pool.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = TRUE AND p.stock <= p.low_stock_threshold
      ORDER BY p.stock ASC
      LIMIT 10
    `);

    const topProducts = await pool.query(`
      SELECT si.product_name AS name, SUM(si.quantity)::int AS sold, SUM(si.total)::numeric AS revenue
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE s.created_at::date = CURRENT_DATE
      GROUP BY si.product_name
      ORDER BY sold DESC
      LIMIT 5
    `);

    res.json({
      todaySales: Number(todaySales.rows[0].total),
      totalOrders: totalOrders.rows[0].count,
      lowStockProducts: lowStock.rows,
      topSellingProducts: topProducts.rows
    });
  } catch (error) {
    next(error);
  }
};
