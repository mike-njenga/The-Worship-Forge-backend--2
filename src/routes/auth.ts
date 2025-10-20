import express, { Request, Response } from 'express';
import authenticateFirebaseToken from '../middleware/auth';

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

const router = express.Router();

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticateFirebaseToken, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const mongoUser = req.mongoUser;
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { 
        user: {
          _id: user.uid,
          email: user.email,
          role: mongoUser?.role || 'student',
          profile: {
            firstName: mongoUser?.firstName || user.name?.split(' ')[0] || '',
            lastName: mongoUser?.lastName || user.name?.split(' ')[1] || '',
            avatar: user.picture || '',
            phone: mongoUser?.phone || '',
            bio: mongoUser?.bio || ''
          },
          subscription: {
            plan: mongoUser?.subscription?.plan || 'free',
            status: mongoUser?.subscription?.status || 'active',
            trialStartDate: mongoUser?.subscription?.trialStartDate || '',
            trialEndDate: mongoUser?.subscription?.trialEndDate || '',
            subscriptionStartDate: mongoUser?.subscription?.subscriptionStartDate || '',
            subscriptionEndDate: mongoUser?.subscription?.subscriptionEndDate || ''
          },
          isEmailVerified: user.email_verified || false,
          lastLogin: new Date().toISOString(),
          createdAt: mongoUser?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve user profile'
    });
  }
});

// @desc    Logout user (Firebase handles actual logout on frontend)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticateFirebaseToken, async (req: Request, res: Response) => {
  try {
    // Firebase handles session management on its own.
    // This endpoint can be used for any backend-specific cleanup if needed.
    return res.status(200).json({
      success: true,
      message: 'Logout successful (handled by Firebase on client-side)'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Logout failed'
    });
  }
});

export default router;
