import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  archiveCategory
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', archiveCategory);

export default router;
