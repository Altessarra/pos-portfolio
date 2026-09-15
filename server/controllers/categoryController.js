import db from '../config/db.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = db.prepare(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC'
    ).all();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const result = db.prepare(
      'INSERT INTO categories (name, description) VALUES (?, ?)'
    ).run(name, description || null);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    db.prepare(`
      UPDATE categories
      SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description || null, req.params.id);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const archiveCategory = async (req, res, next) => {
  try {
    db.prepare(`
      UPDATE categories SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);
    res.json({ message: 'Category archived' });
  } catch (error) {
    next(error);
  }
};
