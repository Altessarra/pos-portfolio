import express from 'express';
import { getInventory, getInventoryLogs } from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/', getInventory);
router.get('/logs', getInventoryLogs);

export default router;
