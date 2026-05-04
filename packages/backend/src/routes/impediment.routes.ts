import express, { type Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getImpediments,
  getImpedimentById,
  createImpediment,
  updateImpediment,
  deleteImpediment,
  getImpedimentStats,
} from '../controllers/impediment.controller';

const router: Router = express.Router();

router.get('/', authenticate, getImpediments);
router.get('/stats', authenticate, getImpedimentStats);
router.get('/:id', authenticate, getImpedimentById);
router.post('/', authenticate, createImpediment);
router.put('/:id', authenticate, updateImpediment);
router.delete('/:id', authenticate, deleteImpediment);

export default router;
