import express from 'express';
import {
  getCourseAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  toggleAssignmentPublish,
  getAssignmentStats
} from '../controllers/assignmentController';
import { verifyFirebaseToken, requireAuth, requireRole, requireSubscription } from '../middleware/firebaseAuth';
import { validateAssignmentCreation, validateObjectId } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// @route   GET /api/assignments/course/:courseId
// @desc    Get assignments for a course
// @access  Public (published assignments) / Private (all assignments with subscription)
router.get('/course/:courseId', validateObjectId('courseId'), getCourseAssignments);

// @route   GET /api/assignments/:id
// @desc    Get single assignment by ID
// @access  Private (with subscription check)
router.get('/:id', validateObjectId('id'), verifyFirebaseToken, requireAuth, requireSubscription, getAssignmentById);

// @route   GET /api/assignments/:id/stats
// @desc    Get assignment statistics
// @access  Private (Instructor/Admin only)
router.get('/:id/stats', validateObjectId('id'), verifyFirebaseToken, requireAuth, getAssignmentStats);

// @route   POST /api/assignments
// @desc    Create new assignment
// @access  Private (Instructor/Admin only)
router.post('/', verifyFirebaseToken, requireAuth, requireRole(['teacher', 'admin']), validateAssignmentCreation, createAssignment);

// @route   PUT /api/assignments/:id
// @desc    Update assignment
// @access  Private (Instructor/Admin only)
router.put('/:id', validateObjectId('id'), verifyFirebaseToken, requireAuth, updateAssignment);

// @route   PATCH /api/assignments/:id/publish
// @desc    Publish/Unpublish assignment
// @access  Private (Instructor/Admin only)
router.patch('/:id/publish', validateObjectId('id'), verifyFirebaseToken, requireAuth, [
  body('isPublished')
    .isBoolean()
    .withMessage('isPublished must be a boolean value'),
], toggleAssignmentPublish);

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment
// @access  Private (Instructor/Admin only)
router.delete('/:id', validateObjectId('id'), verifyFirebaseToken, requireAuth, deleteAssignment);

export default router;
