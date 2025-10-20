import { Request, Response, NextFunction } from 'express'
import { auth } from '../config/firebase'
import User from '../models/User'

// Extend Request interface to include our custom properties
declare global {
  namespace Express {
    interface Request {
      firebaseUser?: any;
      mongoUser?: any;
      user?: any;
    }
  }
}

async function authenticateFirebaseToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  
  const idToken = authHeader.split(' ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);

    // Always attach decoded Firebase token
    req.firebaseUser = decodedToken;
    req.user = decodedToken;
    
    // Try to fetch user from MongoDB using firebaseUid
    let mongoUser = await User.findOne({ firebaseUid: decodedToken.uid });
    // If not found by firebaseUid, try by email
    if (!mongoUser) {
      mongoUser = await User.findOne({ email: decodedToken.email });
    }

    if (mongoUser) {
      req.mongoUser = mongoUser; // Attach full MongoDB user object (including role)
      // Also attach the role to req.user for convenience
      req.user.role = mongoUser.role;
    }

    // Do NOT return 401 if user is not found; allow route handler to decide
    next();
  } catch (err: any) {
    // Provide more specific error messages
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token has expired' });
    } else if (err.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token has been revoked' });
    } else if (err.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token format' });
    } else {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}

export default authenticateFirebaseToken;
