import { Router } from 'express';
import { customerLogin, mechanicLogin } from '../controllers/authController.js';

const router = Router();

router.post('/mechanic/login', mechanicLogin);
router.post('/customer/login', customerLogin);

export default router;
