import { Router } from 'express';
import { body } from 'express-validator';
import * as documentController from '../controllers/document.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();

router.get('/', authenticateToken, documentController.getDocuments);

router.get('/:id', authenticateToken, documentController.getDocument);

router.delete('/:id', authenticateToken, documentController.deleteDocument);

router.post(
  '/export',
  authenticateToken,
  [
    body('id').notEmpty().withMessage('请提供文档ID'),
    body('format').isIn(['docx', 'pdf']).withMessage('格式必须是docx或pdf'),
  ],
  validateRequest,
  documentController.exportDocument
);

export default router;
