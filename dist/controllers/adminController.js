"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgressAnalytics = exports.getSubscriptionAnalytics = exports.getAllVideos = exports.updateCourseAdmin = exports.createCourseAdmin = exports.getAllCourses = exports.updateUserAdmin = exports.getAllUsers = exports.getSystemStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Course_1 = __importDefault(require("../models/Course"));
const Video_1 = __importDefault(require("../models/Video"));
const Assignment_1 = __importDefault(require("../models/Assignment"));
const mongoose_1 = __importDefault(require("mongoose"));
const getSystemStats = async (req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments();
        const activeUsers = await User_1.default.countDocuments({ 'subscription.status': 'active' });
        const trialUsers = await User_1.default.countDocuments({ 'subscription.status': 'trial' });
        const premiumUsers = await User_1.default.countDocuments({ 'subscription.plan': 'premium' });
        const students = await User_1.default.countDocuments({ role: 'student' });
        const teachers = await User_1.default.countDocuments({ role: 'teacher' });
        const admins = await User_1.default.countDocuments({ role: 'admin' });
        const totalCourses = await Course_1.default.countDocuments();
        const publishedCourses = await Course_1.default.countDocuments({ isPublished: true });
        const totalVideos = await Video_1.default.countDocuments();
        const totalAssignments = await Assignment_1.default.countDocuments();
        const totalRevenue = 45680;
        const monthlyRevenue = 12340;
        const recentUsers = await User_1.default.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName email role createdAt');
        const recentCourses = await Course_1.default.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title instructor createdAt')
            .populate('instructor', 'firstName lastName');
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
        });
    }
    catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve system statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getSystemStats = getSystemStats;
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', role, subscriptionStatus, subscriptionPlan, search, dateFrom, dateTo } = req.query;
        const filter = {};
        if (role)
            filter.role = role;
        if (subscriptionStatus)
            filter['subscription.status'] = subscriptionStatus;
        if (subscriptionPlan)
            filter['subscription.plan'] = subscriptionPlan;
        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom)
                filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo)
                filter.createdAt.$lte = new Date(dateTo);
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = { [sort]: sortOrder };
        const users = await User_1.default.find(filter)
            .select('-password')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);
        const total = await User_1.default.countDocuments(filter);
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
        });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAllUsers = getAllUsers;
const updateUserAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, subscription, isEmailVerified } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
            return;
        }
        const user = await User_1.default.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (role)
            user.role = role;
        if (subscription) {
            if (subscription.plan)
                user.subscription.plan = subscription.plan;
            if (subscription.status)
                user.subscription.status = subscription.status;
            if (subscription.subscriptionStartDate)
                user.subscription.subscriptionStartDate = new Date(subscription.subscriptionStartDate);
            if (subscription.subscriptionEndDate)
                user.subscription.subscriptionEndDate = new Date(subscription.subscriptionEndDate);
        }
        if (isEmailVerified !== undefined)
            user.isEmailVerified = isEmailVerified;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: { user }
        });
    }
    catch (error) {
        console.error('Update user admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateUserAdmin = updateUserAdmin;
const getAllCourses = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', status, instructor, search } = req.query;
        const filter = {};
        if (status)
            filter.isPublished = status === 'published';
        if (instructor)
            filter.instructor = instructor;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = { [sort]: sortOrder };
        const courses = await Course_1.default.find(filter)
            .populate('instructor', 'firstName lastName email')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);
        const total = await Course_1.default.countDocuments(filter);
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
        });
    }
    catch (error) {
        console.error('Get all courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve courses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAllCourses = getAllCourses;
const createCourseAdmin = async (req, res) => {
    try {
        const { title, description, instructor, price, category, level, tags, isPublished = false, thumbnail } = req.body;
        if (!title || !description || !instructor || price === undefined || !category || !level) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: title, description, instructor, price, category, level'
            });
            return;
        }
        const instructorId = req.mongoUser._id;
        const course = new Course_1.default({
            title,
            description,
            instructor: instructorId,
            price: parseInt(price),
            category,
            level,
            tags: tags || [],
            isPublished,
            thumbnail: thumbnail || '/logo.jpeg'
        });
        await course.save();
        await course.populate('instructor', 'firstName lastName email');
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: { course }
        });
    }
    catch (error) {
        console.error('Create course admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createCourseAdmin = createCourseAdmin;
const updateCourseAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublished } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
            return;
        }
        const course = await Course_1.default.findById(id);
        if (!course) {
            res.status(404).json({
                success: false,
                message: 'Course not found'
            });
            return;
        }
        if (isPublished !== undefined)
            course.isPublished = isPublished;
        await course.save();
        await course.populate('instructor', 'firstName lastName email');
        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: { course }
        });
    }
    catch (error) {
        console.error('Update course admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateCourseAdmin = updateCourseAdmin;
const getAllVideos = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', course, status, search } = req.query;
        const filter = {};
        if (course)
            filter.course = course;
        if (status)
            filter.status = status;
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = { [sort]: sortOrder };
        const videos = await Video_1.default.find(filter)
            .populate('courseId', 'title instructor')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);
        const total = await Video_1.default.countDocuments(filter);
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
        });
    }
    catch (error) {
        console.error('Get all videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve videos',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAllVideos = getAllVideos;
const getSubscriptionAnalytics = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const totalSubscriptions = await User_1.default.countDocuments({ 'subscription.plan': { $ne: 'free' } });
        const activeSubscriptions = await User_1.default.countDocuments({ 'subscription.status': 'active' });
        const trialSubscriptions = await User_1.default.countDocuments({ 'subscription.status': 'trial' });
        const cancelledSubscriptions = await User_1.default.countDocuments({ 'subscription.status': 'cancelled' });
        const premiumSubscriptions = await User_1.default.countDocuments({ 'subscription.plan': 'premium' });
        const freeUsers = await User_1.default.countDocuments({ 'subscription.plan': 'free' });
        const recentSubscriptions = await User_1.default.find({ 'subscription.plan': { $ne: 'free' } })
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
        });
    }
    catch (error) {
        console.error('Get subscription analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscription analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getSubscriptionAnalytics = getSubscriptionAnalytics;
const getProgressAnalytics = async (req, res) => {
    try {
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
        });
    }
    catch (error) {
        console.error('Get progress analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve progress analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getProgressAnalytics = getProgressAnalytics;
//# sourceMappingURL=adminController.js.map