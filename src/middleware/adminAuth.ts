import { Request, Response, NextFunction } from 'express'

// Middleware to check if user is admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated and has admin role
  if (!req.user || !req.mongoUser) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  if (req.mongoUser.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }

  next();
};

// Middleware to check if user is admin or accessing their own resource
export const requireAdminOrOwner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.mongoUser) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  const resourceId = req.params.id;
  const userId = req.mongoUser._id.toString();

  // Allow if admin or if accessing own resource
  if (req.mongoUser.role === 'admin' || userId === resourceId) {
    return next();
  }

  return res.status(403).json({ 
    success: false,
    message: 'Access denied. Admin access required or you can only access your own resources.' 
  });
};
