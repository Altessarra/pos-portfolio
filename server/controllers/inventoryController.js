import { client } from '../config/postgres.js';

const portfolioOperator = 'Portfolio Demo';

export const getInventory = async (req, res, next) => {
  try {
    const products = await client.unsafe(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id ' +
        'WHERE p.is_active = TRUE ORDER BY p.stock ASC, p.name ASC'
    );
    res.json(products);
  } catch (error) {
    next(error);
  }
};
export const getInventoryLogs = async (req, res, next) => {
  try {
    const logs = await client.unsafe(
      'SELECT il.*, p.name AS product_name FROM inventory_logs il LEFT JOIN products p ON p.id = il.product_id ' +
        'ORDER BY il.created_at DESC, il.id DESC LIMIT 300'
    );
    res.json(logs.map(log => ({ ...log, user_name: portfolioOperator })));
  } catch (error) {
    next(error);
  }
};
