import pool from '../config/db.js';

export const getCategories = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { rows } = await pool.query(
      `UPDATE categories
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, description || null, req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

export const archiveCategory = async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE categories SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.params.id]
    );
    res.json({ message: 'Category archived' });
  } catch (error) {
    next(error);
  }
};
