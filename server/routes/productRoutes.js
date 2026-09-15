import express from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  archiveProduct
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', archiveProduct);

export default router;
