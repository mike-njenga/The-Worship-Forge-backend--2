import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleCoursePublish,
  getInstructorCourses,
  getCourseStats
} from '../controllers/courseController';
import { authenticate, authorize } from '../middleware/auth';
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
router.get('/:id/stats', validateObjectId('id'), authenticate, getCourseStats);

// @route   POST /api/courses
// @desc    Create new course
// @access  Private (Teacher/Admin only)
router.post('/', authenticate, authorize('teacher', 'admin'), validateCourseCreation, createCourse);

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Instructor/Admin only)
router.put('/:id', validateObjectId('id'), authenticate, updateCourse);

// @route   PATCH /api/courses/:id/publish
// @desc    Publish/Unpublish course
// @access  Private (Instructor/Admin only)
router.patch('/:id/publish', validateObjectId('id'), authenticate, [
  body('isPublished')
    .isBoolean()
    .withMessage('isPublished must be a boolean value'),
], toggleCoursePublish);

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Instructor/Admin only)
router.delete('/:id', validateObjectId('id'), authenticate, deleteCourse);

export default router;
