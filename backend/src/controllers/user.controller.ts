import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '未授权',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: req.user._id,
        email: req.user.email,
        username: req.user.username,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
    });
  }
};
