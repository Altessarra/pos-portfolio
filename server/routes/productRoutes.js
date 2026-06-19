import express from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  archiveProduct
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getProducts);
router.post('/', protect, authorize('admin', 'manager'), createProduct);
router.put('/:id', protect, authorize('admin', 'manager'), updateProduct);
router.delete('/:id', protect, authorize('admin', 'manager'), archiveProduct);

export default router;
