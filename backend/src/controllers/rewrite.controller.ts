import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import History from '../models/History';
import aiService from '../services/ai.service';
import similarityService from '../services/similarity.service';
import logger from '../utils/logger';

export const checkSimilarity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const result = await similarityService.checkSimilarity(text);

    // Save history
    await History.create({
      userId: req.user._id,
      action: 'check_similarity',
      metadata: { textLength: text.length, similarity: result.similarity },
    });

    logger.info('Similarity checked for user:', req.user.email);

    res.json({
      success: true,
      data: result,
      message: '相似度检测完成',
    });
  } catch (error: any) {
    logger.error('Check similarity error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '检测相似度失败',
    });
  }
};

export const rewriteText = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const rewrittenText = await aiService.rewriteText(text);

    // Save history
    await History.create({
      userId: req.user._id,
      action: 'rewrite_text',
      metadata: { originalLength: text.length, rewrittenLength: rewrittenText.length },
    });

    logger.info('Text rewritten for user:', req.user.email);

    res.json({
      success: true,
      data: { rewrittenText },
      message: '文本改写成功',
    });
  } catch (error: any) {
    logger.error('Rewrite text error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '改写文本失败',
    });
  }
};

export const getSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const suggestions = await aiService.getSuggestions(text);

    logger.info('Suggestions generated for user:', req.user.email);

    res.json({
      success: true,
      data: suggestions,
      message: '获取建议成功',
    });
  } catch (error: any) {
    logger.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取建议失败',
    });
  }
};
