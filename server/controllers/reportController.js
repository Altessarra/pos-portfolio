import { client } from '../config/postgres.js';

const numberize = (rows, numericFields) => rows.map(row => ({
  ...row,
  ...Object.fromEntries(numericFields.map(field => [field, Number(row[field])]))
}));

export const getReports = async (req, res, next) => {
  try {
    const dailySales = await client.unsafe(
      "SELECT (created_at AT TIME ZONE 'Asia/Manila')::date AS date, SUM(total) AS total, COUNT(*) AS orders " +
        "FROM sales WHERE (created_at AT TIME ZONE 'Asia/Manila')::date >= " +
        "((NOW() AT TIME ZONE 'Asia/Manila')::date - INTERVAL '14 days')::date " +
        "GROUP BY (created_at AT TIME ZONE 'Asia/Manila')::date ORDER BY date ASC"
    );

    const monthlySales = await client.unsafe(
      "SELECT TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Manila'), 'YYYY-MM') AS month, " +
        'SUM(total) AS total, COUNT(*) AS orders FROM sales ' +
        "WHERE created_at >= ((DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Manila') - INTERVAL '12 months') AT TIME ZONE 'Asia/Manila') " +
        "GROUP BY DATE_TRUNC('month', created_at AT TIME ZONE 'Asia/Manila') ORDER BY month ASC"
    );

    const topProducts = await client.unsafe(
      'SELECT product_name AS name, SUM(quantity) AS quantity, SUM(total) AS total ' +
        'FROM sale_items GROUP BY product_name ORDER BY quantity DESC LIMIT 10'
    );

    const paymentSummary = await client.unsafe(
      'SELECT payment_method, SUM(total) AS total, COUNT(*) AS orders ' +
        'FROM sales GROUP BY payment_method ORDER BY total DESC'
    );

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
