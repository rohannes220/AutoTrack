import { Router } from 'express';
import { mechanicLogin } from '../controllers/authController.js';

const router = Router();

router.post('/mechanic/login', mechanicLogin);

export default router;
