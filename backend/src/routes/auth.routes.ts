import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').isLength({ min: 6 }).withMessage('密码至少需要6个字符'),
    body('username').notEmpty().withMessage('请输入用户名'),
  ],
  validateRequest,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    body('password').notEmpty().withMessage('请输入密码'),
  ],
  validateRequest,
  authController.login
);

export default router;
