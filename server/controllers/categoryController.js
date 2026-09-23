import { client } from '../config/postgres.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await client.unsafe(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const [category] = await client.unsafe(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const [category] = await client.unsafe(
      'UPDATE categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description || null, req.params.id]
    );
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const archiveCategory = async (req, res, next) => {
  try {
    await client.unsafe(
      'UPDATE categories SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Category archived' });
  } catch (error) {
    next(error);
  }
};
