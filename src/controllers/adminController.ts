import { Request, Response } from 'express';
import User from '../models/User';
import Course from '../models/Course';
import Video from '../models/Video';
import Assignment from '../models/Assignment';
import { ApiResponse, AuthRequest } from '../types';
import mongoose from 'mongoose';

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
export const getSystemStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 'subscription.status': 'active' });
    const trialUsers = await User.countDocuments({ 'subscription.status': 'trial' });
    const premiumUsers = await User.countDocuments({ 'subscription.plan': 'premium' });
    const students = await User.countDocuments({ role: 'student' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const admins = await User.countDocuments({ role: 'admin' });

    // Get content statistics
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });
    const totalVideos = await Video.countDocuments();
    const totalAssignments = await Assignment.countDocuments();

    // Get revenue statistics (mock data for now)
    const totalRevenue = 45680;
    const monthlyRevenue = 12340;

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('profile.firstName profile.lastName email role createdAt');

    const recentCourses = await Course.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title instructor createdAt')
      .populate('instructor', 'profile.firstName profile.lastName');

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        trial: trialUsers,
        premium: premiumUsers,
        students,
        teachers,
        admins
      },
      content: {
        totalCourses,
        publishedCourses,
        totalVideos,
        totalAssignments
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue
      },
      recentActivity: {
        users: recentUsers,
        courses: recentCourses
      }
    };

    res.status(200).json({
      success: true,
      message: 'System statistics retrieved successfully',
      data: { stats }
    } as ApiResponse);
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get all users with advanced filtering
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      role,
      subscriptionStatus,
      subscriptionPlan,
      search,
      dateFrom,
      dateTo
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (role) filter.role = role;
    if (subscriptionStatus) filter['subscription.status'] = subscriptionStatus;
    if (subscriptionPlan) filter['subscription.plan'] = subscriptionPlan;
    
    // Add text search in name and email
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo as string);
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
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Update user role or subscription
// @route   PATCH /api/admin/users/:id
// @access  Private (Admin only)
export const updateUserAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, subscription, isEmailVerified } = req.body;

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

    // Update fields
    if (role) user.role = role;
    if (subscription) {
      if (subscription.plan) user.subscription.plan = subscription.plan;
      if (subscription.status) user.subscription.status = subscription.status;
      if (subscription.subscriptionStartDate) user.subscription.subscriptionStartDate = new Date(subscription.subscriptionStartDate);
      if (subscription.subscriptionEndDate) user.subscription.subscriptionEndDate = new Date(subscription.subscriptionEndDate);
    }
    if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    } as ApiResponse);
  } catch (error) {
    console.error('Update user admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get all courses with admin details
// @route   GET /api/admin/courses
// @access  Private (Admin only)
export const getAllCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      status,
      instructor,
      search
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (status) filter.isPublished = status === 'published';
    if (instructor) filter.instructor = instructor;
    
    // Add text search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
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
    const courses = await Course.find(filter)
      .populate('instructor', 'profile.firstName profile.lastName email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Course.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: {
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
    console.error('Get all courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve courses',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Update course status
// @route   PATCH /api/admin/courses/:id
// @access  Private (Admin only)
export const updateCourseAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      } as ApiResponse);
      return;
    }

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      } as ApiResponse);
      return;
    }

    // Update fields
    if (isPublished !== undefined) course.isPublished = isPublished;

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    } as ApiResponse);
  } catch (error) {
    console.error('Update course admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get all videos with admin details
// @route   GET /api/admin/videos
// @access  Private (Admin only)
export const getAllVideos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      course,
      status,
      search
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (course) filter.course = course;
    if (status) filter.status = status;
    
    // Add text search
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = { [sort as string]: sortOrder };

    // Execute query
    const videos = await Video.find(filter)
      .populate('course', 'title instructor')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Video.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Videos retrieved successfully',
      data: {
        videos,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalVideos: total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get all videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve videos',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get subscription analytics
// @route   GET /api/admin/subscriptions
// @access  Private (Admin only)
export const getSubscriptionAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period = 'month' } = req.query;

    // Get subscription statistics
    const totalSubscriptions = await User.countDocuments({ 'subscription.plan': { $ne: 'free' } });
    const activeSubscriptions = await User.countDocuments({ 'subscription.status': 'active' });
    const trialSubscriptions = await User.countDocuments({ 'subscription.status': 'trial' });
    const cancelledSubscriptions = await User.countDocuments({ 'subscription.status': 'cancelled' });

    // Get subscription breakdown by plan
    const premiumSubscriptions = await User.countDocuments({ 'subscription.plan': 'premium' });
    const freeUsers = await User.countDocuments({ 'subscription.plan': 'free' });

    // Get recent subscriptions
    const recentSubscriptions = await User.find({ 'subscription.plan': { $ne: 'free' } })
      .sort({ 'subscription.subscriptionStartDate': -1 })
      .limit(10)
      .select('profile.firstName profile.lastName email subscription createdAt');

    const analytics = {
      overview: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        trial: trialSubscriptions,
        cancelled: cancelledSubscriptions
      },
      breakdown: {
        premium: premiumSubscriptions,
        free: freeUsers
      },
      recent: recentSubscriptions
    };

    res.status(200).json({
      success: true,
      message: 'Subscription analytics retrieved successfully',
      data: { analytics }
    } as ApiResponse);
  } catch (error) {
    console.error('Get subscription analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get progress analytics
// @route   GET /api/admin/progress
// @access  Private (Admin only)
export const getProgressAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // This would typically involve complex aggregation queries
    // For now, returning mock data structure
    const progressData = {
      courseCompletion: {
        total: 100,
        completed: 75,
        inProgress: 20,
        notStarted: 5
      },
      averageProgress: 68,
      topPerformers: [
        { userId: 'user1', userName: 'John Doe', progress: 95, course: 'Guitar Fundamentals' },
        { userId: 'user2', userName: 'Sarah Smith', progress: 88, course: 'Piano Basics' }
      ],
      strugglingStudents: [
        { userId: 'user3', userName: 'Mike Wilson', progress: 25, course: 'Guitar Fundamentals' }
      ]
    };

    res.status(200).json({
      success: true,
      message: 'Progress analytics retrieved successfully',
      data: { progressData }
    } as ApiResponse);
  } catch (error) {
    console.error('Get progress analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve progress analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};
