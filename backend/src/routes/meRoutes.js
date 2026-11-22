import { Router } from 'express';
import { getMyVehicle, listMyVehicles } from '../controllers/meController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Read-only routes for the authenticated customer's own data.
router.use(requireAuth, requireRole('customer'));

router.get('/vehicles', listMyVehicles);
router.get('/vehicles/:vehicleId', getMyVehicle);

export default router;
