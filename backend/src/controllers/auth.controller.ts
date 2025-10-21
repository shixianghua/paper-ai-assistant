import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import logger from '../utils/logger';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: '该邮箱已被注册',
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      username,
    });

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    logger.info('User registered:', email);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
        token,
      },
      message: '注册成功',
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
      });
      return;
    }

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    logger.info('User logged in:', email);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
        token,
      },
      message: '登录成功',
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
    });
  }
};
