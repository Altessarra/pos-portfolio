import db from '../config/db.js';

export const getDashboard = async (req, res, next) => {
  try {
    const todaySales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM sales
      WHERE DATE(created_at) = DATE('now', 'localtime')
    `).get();

    const totalOrders = db.prepare(`
      SELECT COUNT(*) AS count
      FROM sales
      WHERE DATE(created_at) = DATE('now', 'localtime')
    `).get();

    const lowStock = db.prepare(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1 AND p.stock <= p.low_stock_threshold
      ORDER BY p.stock ASC
      LIMIT 10
    `).all();

    const topProducts = db.prepare(`
      SELECT si.product_name AS name, SUM(si.quantity) AS sold, SUM(si.total) AS revenue
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      WHERE DATE(s.created_at) = DATE('now', 'localtime')
      GROUP BY si.product_name
      ORDER BY sold DESC
      LIMIT 5
    `).all();

    res.json({
      todaySales: Number(todaySales.total),
      totalOrders: Number(totalOrders.count),
      lowStockProducts: lowStock,
      topSellingProducts: topProducts.map(product => ({
        ...product,
        sold: Number(product.sold),
        revenue: Number(product.revenue)
      }))
    });
  } catch (error) {
    next(error);
  }
};
