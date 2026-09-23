import { client } from '../config/postgres.js';

export const getDashboard = async (req, res, next) => {
  try {
    const todaySales = await client.unsafe(
      "SELECT COALESCE(SUM(total), 0) AS total FROM sales " +
        "WHERE (created_at AT TIME ZONE 'Asia/Manila')::date = (NOW() AT TIME ZONE 'Asia/Manila')::date"
    );

    const totalOrders = await client.unsafe(
      "SELECT COUNT(*) AS count FROM sales " +
        "WHERE (created_at AT TIME ZONE 'Asia/Manila')::date = (NOW() AT TIME ZONE 'Asia/Manila')::date"
    );

    const lowStock = await client.unsafe(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id ' +
        'WHERE p.is_active = TRUE AND p.stock <= p.low_stock_threshold ORDER BY p.stock ASC LIMIT 10'
    );

    const topProducts = await client.unsafe(
      "SELECT si.product_name AS name, SUM(si.quantity) AS sold, SUM(si.total) AS revenue " +
        "FROM sale_items si JOIN sales s ON s.id = si.sale_id " +
        "WHERE (s.created_at AT TIME ZONE 'Asia/Manila')::date = (NOW() AT TIME ZONE 'Asia/Manila')::date " +
        'GROUP BY si.product_name ORDER BY sold DESC LIMIT 5'
    );

    res.json({
      todaySales: Number(todaySales[0].total),
      totalOrders: Number(totalOrders[0].count),
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
