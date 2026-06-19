import express from 'express';
import { getInventory, getInventoryLogs } from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'manager'), getInventory);
router.get('/logs', protect, authorize('admin', 'manager'), getInventoryLogs);

export default router;
