import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest, IUser, JWTPayload } from '../types';
import User from '../models/User';

// Interface for JWT payload
interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Generate JWT token
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
};

// Generate refresh token
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '30d' });
};

// Verify JWT token
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

// Authentication middleware
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if user account is still active
    if (!user.isEmailVerified) {
      res.status(401).json({
        success: false,
        message: 'Please verify your email address'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

// Optional authentication middleware (for routes that work with or without auth)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isEmailVerified) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Token is invalid, but we continue without user
    next();
  }
};

// Check if user has active subscription
export const requireSubscription = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  // Admin and teachers don't need subscription
  if (req.user.role === 'admin' || req.user.role === 'teacher') {
    next();
    return;
  }

  // Check if user has active subscription
  if (!req.user.hasActiveSubscription()) {
    res.status(403).json({
      success: false,
      message: 'Active subscription required',
      subscriptionStatus: req.user.subscription.status
    });
    return;
  }

  next();
};
