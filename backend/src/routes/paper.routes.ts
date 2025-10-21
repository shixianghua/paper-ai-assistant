import { Router } from 'express';
import { body } from 'express-validator';
import * as paperController from '../controllers/paper.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post(
  '/generate-outline',
  authenticateToken,
  aiLimiter,
  [
    body('topic').notEmpty().withMessage('请输入论文主题'),
    body('keywords').isArray().withMessage('关键词必须是数组'),
    body('wordCount').isInt({ min: 1000 }).withMessage('字数至少需要1000字'),
  ],
  validateRequest,
  paperController.generateOutline
);

router.post(
  '/generate-content',
  authenticateToken,
  aiLimiter,
  [
    body('outline').notEmpty().withMessage('请提供论文大纲'),
    body('topic').notEmpty().withMessage('请输入论文主题'),
  ],
  validateRequest,
  paperController.generateContent
);

router.post(
  '/save',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('请输入论文标题'),
    body('content').notEmpty().withMessage('请输入论文内容'),
  ],
  validateRequest,
  paperController.savePaper
);

export default router;
