import express from 'express';
import { 
  getSystemStats,
  getAllUsers,
  updateUserAdmin,
  getAllCourses,
  updateCourseAdmin,
  getAllVideos,
  getSubscriptionAnalytics,
  getProgressAnalytics
} from '../controllers/adminController';
import authenticateFirebaseToken from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateFirebaseToken);
router.use(requireAdmin);

// System statistics
router.get('/stats', getSystemStats);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUserAdmin);

// Course management
router.get('/courses', getAllCourses);
router.patch('/courses/:id', updateCourseAdmin);

// Video management
router.get('/videos', getAllVideos);

// Analytics
router.get('/subscriptions', getSubscriptionAnalytics);
router.get('/progress', getProgressAnalytics);

export default router;
