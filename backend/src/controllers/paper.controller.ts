import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Document from '../models/Document';
import History from '../models/History';
import aiService from '../services/ai.service';
import logger from '../utils/logger';

export const generateOutline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topic, keywords, wordCount, subject } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const outline = await aiService.generateOutline(topic, keywords, wordCount, subject);

    // Save history
    await History.create({
      userId: req.user._id,
      action: 'generate_outline',
      metadata: { topic, keywords, wordCount },
    });

    logger.info('Outline generated for user:', req.user.email);

    res.json({
      success: true,
      data: { outline },
      message: '大纲生成成功',
    });
  } catch (error: any) {
    logger.error('Generate outline error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '生成大纲失败',
    });
  }
};

export const generateContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { outline, topic } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const content = await aiService.generateContent(outline, topic);

    // Save history
    await History.create({
      userId: req.user._id,
      action: 'generate_content',
      metadata: { topic },
    });

    logger.info('Content generated for user:', req.user.email);

    res.json({
      success: true,
      data: { content },
      message: '内容生成成功',
    });
  } catch (error: any) {
    logger.error('Generate content error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '生成内容失败',
    });
  }
};

export const savePaper = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, metadata } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const document = await Document.create({
      userId: req.user._id,
      title,
      content,
      type: 'generate',
      status: 'completed',
      metadata,
    });

    // Save history
    await History.create({
      userId: req.user._id,
      action: 'save_paper',
      documentId: document._id,
      metadata: { title },
    });

    logger.info('Paper saved for user:', req.user.email);

    res.json({
      success: true,
      data: {
        id: document._id,
        title: document.title,
        createdAt: document.createdAt,
      },
      message: '论文保存成功',
    });
  } catch (error: any) {
    logger.error('Save paper error:', error);
    res.status(500).json({
      success: false,
      message: '保存论文失败',
    });
  }
};
