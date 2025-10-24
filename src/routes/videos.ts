import express from 'express';
import {
  getCourseVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  reorderVideos,
  getVideoStats,
  createUploadUrl,
  handleMuxWebhook,
  getVideoStatus
} from '../controllers/videoController';
import authenticateFirebaseToken from '../middleware/auth';
import { validateVideoCreation, validateObjectId } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// @route   GET /api/videos/course/:courseId
// @desc    Get videos for a course
// @access  Public (preview videos) / Private (full access with subscription)
router.get('/course/:courseId', validateObjectId('courseId'), getCourseVideos);

// @route   GET /api/videos/:id
// @desc    Get single video by ID
// @access  Private (with subscription check)
router.get('/:id', validateObjectId('id'), authenticateFirebaseToken, getVideoById);

// @route   GET /api/videos/:id/stats
// @desc    Get video statistics
// @access  Private (Instructor/Admin only)
router.get('/:id/stats', validateObjectId('id'), authenticateFirebaseToken, getVideoStats);

// @route   POST /api/videos
// @desc    Create new video
// @access  Private (Instructor/Admin only)
router.post('/', authenticateFirebaseToken, validateVideoCreation, createVideo);

// @route   PUT /api/videos/:id
// @desc    Update video
// @access  Private (Instructor/Admin only)
router.put('/:id', validateObjectId('id'), authenticateFirebaseToken, updateVideo);

// @route   PATCH /api/videos/reorder
// @desc    Reorder videos in a course
// @access  Private (Instructor/Admin only)
router.patch('/reorder', authenticateFirebaseToken, [
  body('courseId')
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('videoOrders')
    .isArray()
    .withMessage('videoOrders must be an array'),
  body('videoOrders.*.videoId')
    .isMongoId()
    .withMessage('Invalid video ID'),
  body('videoOrders.*.order')
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer')
], reorderVideos);

// @route   DELETE /api/videos/:id
// @desc    Delete video
// @access  Private (Instructor/Admin only)
router.delete('/:id', validateObjectId('id'), authenticateFirebaseToken, deleteVideo);

// @route   POST /api/videos/upload-url
// @desc    Create Mux upload URL for video upload
// @access  Private (Instructor/Admin only)
router.post('/upload-url', /* authenticateFirebaseToken, */ [
  body('courseId')
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('title')
    .notEmpty()
    .withMessage('Video title is required'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('order')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),
  body('isPreview')
    .optional()
    .isBoolean()
    .withMessage('isPreview must be a boolean')
], createUploadUrl);

// @route   POST /api/videos/webhook
// @desc    Handle Mux webhook for video processing updates
// @access  Public (Mux webhook)
router.post('/webhook', handleMuxWebhook);

// @route   GET /api/videos/:id/status
// @desc    Get video upload status
// @access  Private (Instructor/Admin only)
router.get('/:id/status', validateObjectId('id'), authenticateFirebaseToken, getVideoStatus);

export default router;
