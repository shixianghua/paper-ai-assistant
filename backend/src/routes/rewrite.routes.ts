import { Router } from 'express';
import { body } from 'express-validator';
import * as rewriteController from '../controllers/rewrite.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post(
  '/check-similarity',
  authenticateToken,
  aiLimiter,
  [body('text').notEmpty().withMessage('请输入需要检测的文本')],
  validateRequest,
  rewriteController.checkSimilarity
);

router.post(
  '/rewrite-text',
  authenticateToken,
  aiLimiter,
  [body('text').notEmpty().withMessage('请输入需要改写的文本')],
  validateRequest,
  rewriteController.rewriteText
);

router.post(
  '/suggest',
  authenticateToken,
  aiLimiter,
  [body('text').notEmpty().withMessage('请输入文本')],
  validateRequest,
  rewriteController.getSuggestions
);

export default router;
