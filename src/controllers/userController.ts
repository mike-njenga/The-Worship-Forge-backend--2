import { Request, Response } from 'express';
import User from '../models/User';
import Course from '../models/Course';
import { ApiResponse, AuthRequest } from '../types';
import mongoose from 'mongoose';

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      role,
      subscriptionStatus,
      search
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (role) filter.role = role;
    if (subscriptionStatus) filter['subscription.status'] = subscriptionStatus;
    
    // Add text search in name and email
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = { [sort as string]: sortOrder };

    // Execute query
    const users = await User.find(filter)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalUsers: total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Own profile or Admin)
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      } as ApiResponse);
      return;
    }

    // Check if user can access this profile
    if (req.user!.role !== 'admin' && req.user!._id.toString() !== id) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own profile'
      } as ApiResponse);
      return;
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: { user }
    } as ApiResponse);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (Own profile or Admin)
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      } as ApiResponse);
      return;
    }

    // Check if user can update this profile
    if (req.user!.role !== 'admin' && req.user!._id.toString() !== id) {
      res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      } as ApiResponse);
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    // Remove fields that shouldn't be updated directly
    delete updates.password;
    delete updates.email;
    delete updates.role;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Non-admin users cannot update subscription or verification status
    if (req.user!.role !== 'admin') {
      delete updates.subscription;
      delete updates.isEmailVerified;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: { user: updatedUser }
    } as ApiResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/:id
// @access  Private (Own account or Admin)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      } as ApiResponse);
      return;
    }

    // Check if user can delete this account
    if (req.user!.role !== 'admin' && req.user!._id.toString() !== id) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own account'
      } as ApiResponse);
      return;
    }

    // Prevent admin from deleting their own account
    if (req.user!.role === 'admin' && req.user!._id.toString() === id) {
      res.status(400).json({
        success: false,
        message: 'Admins cannot delete their own account'
      } as ApiResponse);
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user account',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Update user subscription
// @route   PATCH /api/users/:id/subscription
// @access  Private (Admin only)
export const updateUserSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { plan, status, subscriptionStartDate, subscriptionEndDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      } as ApiResponse);
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    // Update subscription
    if (plan) user.subscription.plan = plan;
    if (status) user.subscription.status = status;
    if (subscriptionStartDate) user.subscription.subscriptionStartDate = new Date(subscriptionStartDate);
    if (subscriptionEndDate) user.subscription.subscriptionEndDate = new Date(subscriptionEndDate);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User subscription updated successfully',
      data: { 
        user: {
          id: user._id,
          email: user.email,
          subscription: user.subscription
        }
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user subscription',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get user's courses (as instructor)
// @route   GET /api/users/:id/courses
// @access  Private (Own profile or Admin)
export const getUserCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, isPublished } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      } as ApiResponse);
      return;
    }

    // Check if user can access this data
    if (req.user!.role !== 'admin' && req.user!._id.toString() !== id) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own courses'
      } as ApiResponse);
      return;
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    // Build filter
    const filter: any = { instructor: id };
    if (isPublished !== undefined) {
      filter.isPublished = isPublished === 'true';
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const courses = await Course.find(filter)
      .populate('videos', 'title duration order isPreview')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'User courses retrieved successfully',
      data: {
        user: {
          id: user._id,
          name: `${user.profile.firstName} ${user.profile.lastName}`,
          role: user.role
        },
        courses,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalCourses: total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get user courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user courses',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private (Own profile or Admin)
export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      } as ApiResponse);
      return;
    }

    // Check if user can access this data
    if (req.user!.role !== 'admin' && req.user!._id.toString() !== id) {
      res.status(403).json({
        success: false,
        message: 'You can only view your own statistics'
      } as ApiResponse);
      return;
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    // Get course statistics if user is instructor
    let courseStats = null;
    if (user.role === 'teacher' || user.role === 'admin') {
      const totalCourses = await Course.countDocuments({ instructor: user._id });
      const publishedCourses = await Course.countDocuments({ instructor: user._id, isPublished: true });
      
      courseStats = {
        totalCourses,
        publishedCourses,
        unpublishedCourses: totalCourses - publishedCourses
      };
    }

    const stats = {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        subscription: user.subscription,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      courseStats
    };

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: { stats }
    } as ApiResponse);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Change user password
// @route   PATCH /api/users/:id/password
// @access  Private (Own account only)
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      } as ApiResponse);
      return;
    }

    // Only allow users to change their own password
    if (req.user!._id.toString() !== id) {
      res.status(403).json({
        success: false,
        message: 'You can only change your own password'
      } as ApiResponse);
      return;
    }

    const user = await User.findById(id).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      } as ApiResponse);
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};
