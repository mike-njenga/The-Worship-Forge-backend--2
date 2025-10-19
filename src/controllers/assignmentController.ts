import { Request, Response } from 'express';
import Assignment from '../models/Assignment';
import Course from '../models/Course';
import { ApiResponse, AuthRequest } from '../types';
import mongoose from 'mongoose';

// @desc    Get assignments for a course
// @route   GET /api/assignments/course/:courseId
// @access  Public (with subscription check)
export const getCourseAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { includeUnpublished = 'false' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      } as ApiResponse);
      return;
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      } as ApiResponse);
      return;
    }

    // Build filter
    const filter: any = { courseId };
    if (includeUnpublished === 'false') {
      filter.isPublished = true;
    }

    const assignments = await Assignment.find(filter)
      .sort({ dueDate: 1 })
      .select('title description dueDate maxPoints assignmentType isPublished allowLateSubmission');

    res.status(200).json({
      success: true,
      message: 'Course assignments retrieved successfully',
      data: { 
        course: {
          id: course._id,
          title: course.title,
          isPublished: course.isPublished
        },
        assignments 
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get course assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course assignments',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get single assignment by ID
// @route   GET /api/assignments/:id
// @access  Private (with subscription check)
export const getAssignmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid assignment ID'
      } as ApiResponse);
      return;
    }

    const assignment = await Assignment.findById(id).populate({
      path: 'courseId',
      select: 'title instructor isPublished',
      populate: {
        path: 'instructor',
        select: 'profile.firstName profile.lastName'
      }
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found'
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Assignment retrieved successfully',
      data: { assignment }
    } as ApiResponse);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignment',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Instructor/Admin only)
export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      courseId,
      title,
      description,
      instructions,
      dueDate,
      maxPoints,
      assignmentType,
      attachments = [],
      isPublished = false,
      allowLateSubmission = false,
      latePenalty = 0
    } = req.body;

    // Check if course exists and user is instructor
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      } as ApiResponse);
      return;
    }

    // Check if user can add assignments to this course
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only add assignments to your own courses'
      } as ApiResponse);
      return;
    }

    // Validate due date
    const dueDateObj = new Date(dueDate);
    if (dueDateObj <= new Date()) {
      res.status(400).json({
        success: false,
        message: 'Due date must be in the future'
      } as ApiResponse);
      return;
    }

    const assignment = new Assignment({
      courseId,
      title,
      description,
      instructions,
      dueDate: dueDateObj,
      maxPoints,
      assignmentType,
      attachments,
      isPublished,
      allowLateSubmission,
      latePenalty
    });

    await assignment.save();

    // Add assignment to course's assignments array
    course.assignments.push(assignment._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment }
    } as ApiResponse);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private (Instructor/Admin only)
export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid assignment ID'
      } as ApiResponse);
      return;
    }

    const assignment = await Assignment.findById(id).populate('courseId', 'instructor');

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found'
      } as ApiResponse);
      return;
    }

    // Check if user can update this assignment
    const course = assignment.courseId as any;
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only update assignments in your own courses'
      } as ApiResponse);
      return;
    }

    // Validate due date if being updated
    if (updates.dueDate) {
      const dueDateObj = new Date(updates.dueDate);
      if (dueDateObj <= new Date()) {
        res.status(400).json({
          success: false,
          message: 'Due date must be in the future'
        } as ApiResponse);
        return;
      }
      updates.dueDate = dueDateObj;
    }

    // Remove fields that shouldn't be updated directly
    delete updates.courseId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment: updatedAssignment }
    } as ApiResponse);
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Instructor/Admin only)
export const deleteAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid assignment ID'
      } as ApiResponse);
      return;
    }

    const assignment = await Assignment.findById(id).populate('courseId', 'instructor');

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found'
      } as ApiResponse);
      return;
    }

    // Check if user can delete this assignment
    const course = assignment.courseId as any;
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only delete assignments from your own courses'
      } as ApiResponse);
      return;
    }

    // Remove assignment from course's assignments array
    await Course.findByIdAndUpdate(
      assignment.courseId,
      { $pull: { assignments: assignment._id } }
    );

    await Assignment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Publish/Unpublish assignment
// @route   PATCH /api/assignments/:id/publish
// @access  Private (Instructor/Admin only)
export const toggleAssignmentPublish = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid assignment ID'
      } as ApiResponse);
      return;
    }

    const assignment = await Assignment.findById(id).populate('courseId', 'instructor');

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found'
      } as ApiResponse);
      return;
    }

    // Check if user can modify this assignment
    const course = assignment.courseId as any;
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only modify assignments in your own courses'
      } as ApiResponse);
      return;
    }

    assignment.isPublished = isPublished;
    await assignment.save();

    res.status(200).json({
      success: true,
      message: `Assignment ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: { assignment }
    } as ApiResponse);
  } catch (error) {
    console.error('Toggle assignment publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment publish status',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get assignment statistics
// @route   GET /api/assignments/:id/stats
// @access  Private (Instructor/Admin only)
export const getAssignmentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid assignment ID'
      } as ApiResponse);
      return;
    }

    const assignment = await Assignment.findById(id).populate('courseId', 'instructor');

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found'
      } as ApiResponse);
      return;
    }

    // Check if user can view stats
    const course = assignment.courseId as any;
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only view stats for assignments in your own courses'
      } as ApiResponse);
      return;
    }

    // Calculate basic statistics
    const stats = {
      title: assignment.title,
      dueDate: assignment.dueDate,
      maxPoints: assignment.maxPoints,
      assignmentType: assignment.assignmentType,
      isPublished: assignment.isPublished,
      daysUntilDue: assignment.daysUntilDue,
      status: assignment.status,
      isOverdue: assignment.isOverdue(),
      isDueSoon: assignment.isDueSoon(),
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt
      // TODO: Add submission count, average grade, etc. when submission system is implemented
    };

    res.status(200).json({
      success: true,
      message: 'Assignment statistics retrieved successfully',
      data: { stats }
    } as ApiResponse);
  } catch (error) {
    console.error('Get assignment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignment statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};
