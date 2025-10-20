import express from 'express';
import {
  getUsers,
  getUserById,
  updateUserProfile,
  deleteUser,
  updateUserSubscription,
  getUserCourses,
  getUserStats,
  changePassword
} from '../controllers/userController';
import { verifyFirebaseToken, requireAuth, requireRole } from '../middleware/firebaseAuth';
import { validateObjectId, validatePagination } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get('/', verifyFirebaseToken, requireAuth, requireRole(['admin']), validatePagination, getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Own profile or Admin)
router.get('/:id', validateObjectId('id'), verifyFirebaseToken, requireAuth, getUserById);

// @route   GET /api/users/:id/courses
// @desc    Get user's courses (as instructor)
// @access  Private (Own profile or Admin)
router.get('/:id/courses', validateObjectId('id'), verifyFirebaseToken, requireAuth, validatePagination, getUserCourses);

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Private (Own profile or Admin)
router.get('/:id/stats', validateObjectId('id'), verifyFirebaseToken, requireAuth, getUserStats);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (Own profile or Admin)
router.put('/:id', validateObjectId('id'), verifyFirebaseToken, requireAuth, [
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('profile.phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('profile.avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
], updateUserProfile);

// @route   PATCH /api/users/:id/subscription
// @desc    Update user subscription (Admin only)
// @access  Private (Admin only)
router.patch('/:id/subscription', validateObjectId('id'), verifyFirebaseToken, requireAuth, requireRole(['admin']), [
  body('plan')
    .optional()
    .isIn(['free', 'premium'])
    .withMessage('Plan must be free or premium'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'trial'])
    .withMessage('Status must be active, inactive, or trial'),
  
  body('subscriptionStartDate')
    .optional()
    .isISO8601()
    .withMessage('Subscription start date must be a valid date'),
  
  body('subscriptionEndDate')
    .optional()
    .isISO8601()
    .withMessage('Subscription end date must be a valid date'),
], updateUserSubscription);

// @route   PATCH /api/users/:id/password
// @desc    Change user password
// @access  Private (Own account only)
router.patch('/:id/password', validateObjectId('id'), verifyFirebaseToken, requireAuth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
], changePassword);

// @route   DELETE /api/users/:id
// @desc    Delete user account
// @access  Private (Own account or Admin)
router.delete('/:id', validateObjectId('id'), verifyFirebaseToken, requireAuth, deleteUser);

export default router;
