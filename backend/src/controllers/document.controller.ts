import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Document from '../models/Document';
import History from '../models/History';
import logger from '../utils/logger';

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const documents = await Document.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-content');

    res.json({
      success: true,
      data: documents.map(doc => ({
        id: doc._id,
        userId: doc.userId,
        title: doc.title,
        type: doc.type,
        status: doc.status,
        metadata: doc.metadata,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })),
    });
  } catch (error: any) {
    logger.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: '获取文档列表失败',
    });
  }
};

export const getDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const document = await Document.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: '文档不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: document._id,
        userId: document.userId,
        title: document.title,
        content: document.content,
        type: document.type,
        status: document.status,
        metadata: document.metadata,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: '获取文档详情失败',
    });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const document = await Document.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: '文档不存在',
      });
      return;
    }

    // Save history
    await History.create({
      userId: req.user._id,
      action: 'delete_document',
      documentId: document._id,
      metadata: { title: document.title },
    });

    logger.info('Document deleted:', id);

    res.json({
      success: true,
      message: '文档删除成功',
    });
  } catch (error: any) {
    logger.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: '删除文档失败',
    });
  }
};

export const exportDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, format } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const document = await Document.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: '文档不存在',
      });
      return;
    }

    // Mock export - in production, use libraries like docx or jspdf
    logger.info('Document export requested:', { id, format });

    res.json({
      success: true,
      message: `文档导出成功（${format}格式）`,
    });
  } catch (error: any) {
    logger.error('Export document error:', error);
    res.status(500).json({
      success: false,
      message: '导出文档失败',
    });
  }
};
