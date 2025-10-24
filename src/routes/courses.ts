import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleCoursePublish,
  getInstructorCourses,
  getCourseStats,
  addVideosToCourse,
  getCourseWithVideos
} from '../controllers/courseController';
import authenticateFirebaseToken from '../middleware/auth';
import { validateCourseCreation, validateObjectId, validatePagination } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses with filtering and pagination
// @access  Public
router.get('/', validatePagination, getCourses);

// @route   GET /api/courses/instructor/:instructorId
// @desc    Get courses by instructor
// @access  Public
router.get('/instructor/:instructorId', validateObjectId('instructorId'), validatePagination, getInstructorCourses);

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
router.get('/:id', validateObjectId('id'), getCourseById);

// @route   GET /api/courses/:id/stats
// @desc    Get course statistics
// @access  Private (Instructor/Admin only)
router.get('/:id/stats', validateObjectId('id'), authenticateFirebaseToken, getCourseStats);

// @route   GET /api/courses/:id/videos
// @desc    Get course with all videos
// @access  Public
router.get('/:id/videos', validateObjectId('id'), getCourseWithVideos);

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Teacher/Admin only)
router.post('/', authenticateFirebaseToken, validateCourseCreation, createCourse);

// @route   POST /api/courses/:id/videos
// @desc    Add multiple videos to a course
// @access  Private (Instructor/Admin only)
router.post('/:id/videos', validateObjectId('id'), authenticateFirebaseToken, [
  body('videos')
    .isArray({ min: 1 })
    .withMessage('Videos must be a non-empty array'),
  body('videos.*.title')
    .notEmpty()
    .withMessage('Video title is required'),
  body('videos.*.videoUrl')
    .notEmpty()
    .withMessage('Video URL is required'),
  body('videos.*.thumbnail')
    .notEmpty()
    .withMessage('Video thumbnail is required'),
  body('videos.*.duration')
    .isInt({ min: 1 })
    .withMessage('Video duration must be a positive integer')
], addVideosToCourse);

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Instructor/Admin only)
router.put('/:id', validateObjectId('id'), authenticateFirebaseToken, updateCourse);

// @route   PATCH /api/courses/:id/publish
// @desc    Publish/Unpublish course
// @access  Private (Instructor/Admin only)
router.patch('/:id/publish', validateObjectId('id'), authenticateFirebaseToken, [
  body('isPublished')
    .isBoolean()
    .withMessage('isPublished must be a boolean value'),
], toggleCoursePublish);

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Instructor/Admin only)
router.delete('/:id', validateObjectId('id'), authenticateFirebaseToken, deleteCourse);

export default router;
