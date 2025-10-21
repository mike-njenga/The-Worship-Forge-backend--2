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

// Import User model for registration
import User from '../models/User';

// @desc    Register user in MongoDB (called after Firebase registration)
// @route   POST /api/auth/register
// @access  Private (requires Firebase token)
router.post('/register', authenticateFirebaseToken, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, role = 'student' } = req.body;
    const firebaseUser = req.firebaseUser;
    
    console.log('Registration request:', { firstName, lastName, role });
    console.log('Firebase user:', firebaseUser?.uid, firebaseUser?.email);

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ 
      $or: [
        { firebaseUid: firebaseUser.uid },
        { email: firebaseUser.email }
      ]
    });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'User already exists in database',
        data: { user: existingUser }
      });
    }

    // Create new user in MongoDB
    const newUser = new User({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      role: role,
      firstName: firstName || firebaseUser.name?.split(' ')[0] || '',
      lastName: lastName || firebaseUser.name?.split(' ')[1] || '',
      avatar: firebaseUser.picture || '',
      phone: '',
      bio: '',
      subscription: {
        plan: 'free',
        status: 'active'
      },
      isEmailVerified: firebaseUser.email_verified || false
    });

    const savedUser = await newUser.save();
    console.log('User saved successfully:', savedUser._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully in database',
      data: { user: savedUser }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      errors: error.errors
    });
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to register user',
      ...(process.env.NODE_ENV === 'development' && { details: error.errors })
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticateFirebaseToken, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const mongoUser = req.mongoUser;
    
    console.log('Fetching user profile for:', user?.uid);
    console.log('MongoDB user found:', !!mongoUser);
    
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
          firstName: mongoUser?.firstName || user.name?.split(' ')[0] || '',
          lastName: mongoUser?.lastName || user.name?.split(' ')[1] || '',
          avatar: user.picture || '',
          phone: mongoUser?.phone || '',
          bio: mongoUser?.bio || '',
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
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve user profile',
      ...(process.env.NODE_ENV === 'development' && { details: error.stack })
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

// @desc    Update user role (Admin only)
// @route   PATCH /api/auth/update-role
// @access  Private (requires Firebase token)
router.patch('/update-role', authenticateFirebaseToken, async (req: Request, res: Response) => {
  try {
    const { userId, newRole } = req.body;
    const firebaseUser = req.firebaseUser;

    // Get the current user to check if they're admin
    const currentUser = await User.findOne({ firebaseUid: firebaseUser.uid });
    
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update user roles'
      });
    }

    // Update the target user's role
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { role: newRole },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: { user: updatedUser }
    });
  } catch (error: any) {
    console.error('Update role error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user role'
    });
  }
});

export default router;
