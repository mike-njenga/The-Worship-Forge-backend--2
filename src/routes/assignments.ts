import express from 'express';
import {
  getAllAssignments,
  getCourseAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  toggleAssignmentPublish,
  getAssignmentStats
} from '../controllers/assignmentController';
import authenticateFirebaseToken from '../middleware/auth';
import { validateAssignmentCreation, validateObjectId } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// @route   GET /api/assignments
// @desc    Get all published assignments with filtering and pagination
// @access  Public
router.get('/', getAllAssignments);

// @route   GET /api/assignments/course/:courseId
// @desc    Get assignments for a course
// @access  Public (published assignments) / Private (all assignments with subscription)
router.get('/course/:courseId', validateObjectId('courseId'), getCourseAssignments);

// @route   GET /api/assignments/:id
// @desc    Get single assignment by ID
// @access  Private (with subscription check)
router.get('/:id', validateObjectId('id'), authenticateFirebaseToken, getAssignmentById);

// @route   GET /api/assignments/:id/stats
// @desc    Get assignment statistics
// @access  Private (Instructor/Admin only)
router.get('/:id/stats', validateObjectId('id'), authenticateFirebaseToken, getAssignmentStats);

// @route   POST /api/assignments
// @desc    Create new assignment
// @access  Private (Instructor/Admin only)
router.post('/', authenticateFirebaseToken, validateAssignmentCreation, createAssignment);

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private (Instructor/Admin only)
router.put('/:id', validateObjectId('id'), authenticateFirebaseToken, updateAssignment);

// @route   PATCH /api/assignments/:id/publish
// @desc    Publish/Unpublish assignment
// @access  Private (Instructor/Admin only)
router.patch('/:id/publish', validateObjectId('id'), authenticateFirebaseToken, [
  body('isPublished')
    .isBoolean()
    .withMessage('isPublished must be a boolean value'),
], toggleAssignmentPublish);

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private (Instructor/Admin only)
router.delete('/:id', validateObjectId('id'), authenticateFirebaseToken, deleteAssignment);

export default router;
