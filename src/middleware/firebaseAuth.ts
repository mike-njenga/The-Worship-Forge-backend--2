import { Request, Response, NextFunction } from 'express'
import { auth, db } from '../config/firebase'
import { FirebaseUser } from '../types'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: FirebaseUser
      firebaseUser?: any
    }
  }
}

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the Firebase token
    const decodedToken = await auth.verifyIdToken(token)
    
    // Get user data from Firestore
    const userDoc = await auth.getUser(decodedToken.uid)
    const userData = await db.collection('users').doc(decodedToken.uid).get()
    
    if (!userData.exists) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    const userInfo = userData.data()
    
    // Create user object
    const user: FirebaseUser = {
      _id: decodedToken.uid,
      email: userDoc.email || '',
      role: userInfo?.role || 'student',
      profile: {
        firstName: userInfo?.firstName || userDoc.displayName?.split(' ')[0] || '',
        lastName: userInfo?.lastName || userDoc.displayName?.split(' ')[1] || '',
        avatar: userDoc.photoURL || userInfo?.avatar || '',
        phone: userInfo?.phone || '',
        bio: userInfo?.bio || ''
      },
      subscription: {
        plan: userInfo?.subscription?.plan || 'free',
        status: userInfo?.subscription?.status || 'active',
        trialStartDate: userInfo?.subscription?.trialStartDate || '',
        trialEndDate: userInfo?.subscription?.trialEndDate || '',
        subscriptionStartDate: userInfo?.subscription?.subscriptionStartDate || '',
        subscriptionEndDate: userInfo?.subscription?.subscriptionEndDate || ''
      },
      isEmailVerified: userDoc.emailVerified,
      lastLogin: new Date(),
      createdAt: userInfo?.createdAt ? new Date(userInfo.createdAt) : new Date(),
      updatedAt: new Date()
    }

    req.user = user
    req.firebaseUser = userDoc
    return next()
  } catch (error) {
    console.error('Firebase token verification error:', error)
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    })
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }
  return next()
}

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }

    return next()
  }
}

export const requireSubscription = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }

  if (req.user.subscription.status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Active subscription required'
    })
  }

  return next()
}
