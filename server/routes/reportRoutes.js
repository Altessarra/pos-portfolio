import express from 'express';
import { getReports } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'manager'), getReports);

export default router;
