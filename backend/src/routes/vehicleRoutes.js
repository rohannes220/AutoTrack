import { Router } from 'express';
import { create, list, update } from '../controllers/vehicleController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Every vehicle management route is mechanic-only.
router.use(requireAuth, requireRole('mechanic'));

router.post('/', create);
router.get('/', list);
router.patch('/:vehicleId', update);

export default router;
