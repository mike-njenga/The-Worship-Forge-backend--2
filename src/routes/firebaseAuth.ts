import express, { Request, Response } from 'express';
import { verifyFirebaseToken, requireAuth } from '../middleware/firebaseAuth';
import { auth, db } from '../config/firebase';
import { ApiResponse } from '../types';

const router = express.Router();

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', verifyFirebaseToken, requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { user }
    } as ApiResponse);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', verifyFirebaseToken, requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const { firstName, lastName, phone, bio, avatar } = req.body;

    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      firstName,
      lastName,
      phone,
      bio,
      avatar,
      updatedAt: new Date().toISOString()
    });

    // Get updated user data
    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.data();

    const updatedUser = {
      ...req.user!,
      profile: {
        ...req.user!.profile,
        firstName: updatedUserData?.firstName || req.user!.profile.firstName,
        lastName: updatedUserData?.lastName || req.user!.profile.lastName,
        phone: updatedUserData?.phone || req.user!.profile.phone,
        bio: updatedUserData?.bio || req.user!.profile.bio,
        avatar: updatedUserData?.avatar || req.user!.profile.avatar
      },
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    } as ApiResponse);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

// @desc    Update user subscription
// @route   PUT /api/auth/subscription
// @access  Private
router.put('/subscription', verifyFirebaseToken, requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id.toString();
    const { plan, status, trialStartDate, trialEndDate, subscriptionStartDate, subscriptionEndDate } = req.body;

    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      'subscription.plan': plan,
      'subscription.status': status,
      'subscription.trialStartDate': trialStartDate,
      'subscription.trialEndDate': trialEndDate,
      'subscription.subscriptionStartDate': subscriptionStartDate,
      'subscription.subscriptionEndDate': subscriptionEndDate,
      updatedAt: new Date().toISOString()
    });

    // Get updated user data
    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.data();

    const updatedUser = {
      ...req.user!,
      subscription: {
        plan: updatedUserData?.subscription?.plan || req.user!.subscription.plan,
        status: updatedUserData?.subscription?.status || req.user!.subscription.status,
        trialStartDate: updatedUserData?.subscription?.trialStartDate || req.user!.subscription.trialStartDate,
        trialEndDate: updatedUserData?.subscription?.trialEndDate || req.user!.subscription.trialEndDate,
        subscriptionStartDate: updatedUserData?.subscription?.subscriptionStartDate || req.user!.subscription.subscriptionStartDate,
        subscriptionEndDate: updatedUserData?.subscription?.subscriptionEndDate || req.user!.subscription.subscriptionEndDate
      },
      updatedAt: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: { user: updatedUser }
    } as ApiResponse);
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
router.delete('/account', verifyFirebaseToken, requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id.toString();

    // Delete user data from Firestore
    await db.collection('users').doc(userId).delete();

    // Delete user from Firebase Auth
    await auth.deleteUser(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', verifyFirebaseToken, requireAuth, async (req: Request, res: Response) => {
  try {
    // In Firebase, logout is handled client-side by removing the token from storage
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    } as ApiResponse);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

export default router;
