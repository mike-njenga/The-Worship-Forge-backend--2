"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
const User_1 = __importDefault(require("../models/User"));
router.post('/register', auth_1.default, async (req, res) => {
    try {
        const { firstName, lastName, role = 'student' } = req.body;
        const firebaseUser = req.firebaseUser;
        console.log('Registration request:', { firstName, lastName, role });
        console.log('Firebase user:', firebaseUser?.uid, firebaseUser?.email);
        const existingUser = await User_1.default.findOne({
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
        const newUser = new User_1.default({
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
    }
    catch (error) {
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
router.get('/me', auth_1.default, async (req, res) => {
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
    }
    catch (error) {
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
router.post('/logout', auth_1.default, async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Logout successful (handled by Firebase on client-side)'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Logout failed'
        });
    }
});
router.patch('/update-role', auth_1.default, async (req, res) => {
    try {
        const { userId, newRole } = req.body;
        const firebaseUser = req.firebaseUser;
        const currentUser = await User_1.default.findOne({ firebaseUid: firebaseUser.uid });
        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can update user roles'
            });
        }
        const updatedUser = await User_1.default.findOneAndUpdate({ _id: userId }, { role: newRole }, { new: true });
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
    }
    catch (error) {
        console.error('Update role error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update user role'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map