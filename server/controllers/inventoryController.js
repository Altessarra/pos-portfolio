import pool from '../config/db.js';

export const getInventory = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = TRUE
      ORDER BY p.stock ASC, p.name ASC
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const getInventoryLogs = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT il.*, p.name AS product_name, u.name AS user_name
      FROM inventory_logs il
      LEFT JOIN products p ON p.id = il.product_id
      LEFT JOIN users u ON u.id = il.user_id
      ORDER BY il.created_at DESC
      LIMIT 300
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};
