import express from 'express';
import { checkout, getSales, getSaleById } from '../controllers/saleController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/checkout', protect, authorize('admin', 'manager', 'cashier'), checkout);
router.get('/', protect, authorize('admin', 'manager', 'cashier'), getSales);
router.get('/:id', protect, authorize('admin', 'manager', 'cashier'), getSaleById);

export default router;
