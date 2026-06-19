import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

export const getUsers = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_active, created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email, hashed, role]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, is_active, password } = req.body;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        `UPDATE users
         SET name=$1, email=$2, role=$3, is_active=$4, password=$5, updated_at=CURRENT_TIMESTAMP
         WHERE id=$6
         RETURNING id, name, email, role, is_active, created_at`,
        [name, email, role, is_active, hashed, req.params.id]
      );
      return res.json(rows[0]);
    }

    const { rows } = await pool.query(
      `UPDATE users
       SET name=$1, email=$2, role=$3, is_active=$4, updated_at=CURRENT_TIMESTAMP
       WHERE id=$5
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email, role, is_active, req.params.id]
    );

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

export const archiveUser = async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.params.id]
    );
    res.json({ message: 'User deactivated' });
  } catch (error) {
    next(error);
  }
};
