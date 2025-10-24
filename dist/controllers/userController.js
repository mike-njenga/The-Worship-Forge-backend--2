"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getUserStats = exports.getUserCourses = exports.updateUserSubscription = exports.deleteUser = exports.updateUserProfile = exports.getUserById = exports.getUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const Course_1 = __importDefault(require("../models/Course"));
const mongoose_1 = __importDefault(require("mongoose"));
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', role, subscriptionStatus, search } = req.query;
        const filter = {};
        if (role)
            filter.role = role;
        if (subscriptionStatus)
            filter['subscription.status'] = subscriptionStatus;
        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
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
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
            return;
        }
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            res.status(403).json({
                success: false,
                message: 'You can only view your own profile'
            });
            return;
        }
        const user = await User_1.default.findById(id).select('-password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'User retrieved successfully',
            data: { user }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getUserById = getUserById;
const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
            return;
        }
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            res.status(403).json({
                success: false,
                message: 'You can only update your own profile'
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
        delete updates.password;
        delete updates.email;
        delete updates.role;
        delete updates.createdAt;
        delete updates.updatedAt;
        if (req.user.role !== 'admin') {
            delete updates.subscription;
            delete updates.isEmailVerified;
        }
        const updatedUser = await User_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
        res.status(200).json({
            success: true,
            message: 'User profile updated successfully',
            data: { user: updatedUser }
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user profile',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateUserProfile = updateUserProfile;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
            return;
        }
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            res.status(403).json({
                success: false,
                message: 'You can only delete your own account'
            });
            return;
        }
        if (req.user.role === 'admin' && req.user._id.toString() === id) {
            res.status(400).json({
                success: false,
                message: 'Admins cannot delete their own account'
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
        await User_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'User account deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user account',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteUser = deleteUser;
const updateUserSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { plan, status, subscriptionStartDate, subscriptionEndDate } = req.body;
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
        if (plan)
            user.subscription.plan = plan;
        if (status)
            user.subscription.status = status;
        if (subscriptionStartDate)
            user.subscription.subscriptionStartDate = new Date(subscriptionStartDate);
        if (subscriptionEndDate)
            user.subscription.subscriptionEndDate = new Date(subscriptionEndDate);
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
        });
    }
    catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user subscription',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateUserSubscription = updateUserSubscription;
const getUserCourses = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10, isPublished } = req.query;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
            return;
        }
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            res.status(403).json({
                success: false,
                message: 'You can only view your own courses'
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
        const filter = { instructor: id };
        if (isPublished !== undefined) {
            filter.isPublished = isPublished === 'true';
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const courses = await Course_1.default.find(filter)
            .populate('videos', 'title duration order isPreview')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = await Course_1.default.countDocuments(filter);
        res.status(200).json({
            success: true,
            message: 'User courses retrieved successfully',
            data: {
                user: {
                    id: user._id,
                    name: `${user.firstName} ${user.lastName}`,
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
        });
    }
    catch (error) {
        console.error('Get user courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user courses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getUserCourses = getUserCourses;
const getUserStats = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
            return;
        }
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            res.status(403).json({
                success: false,
                message: 'You can only view your own statistics'
            });
            return;
        }
        const user = await User_1.default.findById(id).select('-password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        let courseStats = null;
        if (user.role === 'teacher' || user.role === 'admin') {
            const totalCourses = await Course_1.default.countDocuments({ instructor: user._id });
            const publishedCourses = await Course_1.default.countDocuments({ instructor: user._id, isPublished: true });
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
        });
    }
    catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getUserStats = getUserStats;
const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
            return;
        }
        if (req.user._id.toString() !== id) {
            res.status(403).json({
                success: false,
                message: 'You can only change your own password'
            });
            return;
        }
        const user = await User_1.default.findById(id).select('+password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
            return;
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.changePassword = changePassword;
//# sourceMappingURL=userController.js.map