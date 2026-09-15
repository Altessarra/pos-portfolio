import express from 'express';
import { checkout, getSales, getSaleById } from '../controllers/saleController.js';

const router = express.Router();

router.post('/checkout', checkout);
router.get('/', getSales);
router.get('/:id', getSaleById);

export default router;
