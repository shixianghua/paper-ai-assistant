import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticateToken, userController.getProfile);

export default router;
