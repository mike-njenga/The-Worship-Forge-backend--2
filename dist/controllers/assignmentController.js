"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssignmentStats = exports.toggleAssignmentPublish = exports.deleteAssignment = exports.updateAssignment = exports.createAssignment = exports.getAssignmentById = exports.getCourseAssignments = exports.getAllAssignments = void 0;
const Assignment_1 = __importDefault(require("../models/Assignment"));
const Course_1 = __importDefault(require("../models/Course"));
const mongoose_1 = __importDefault(require("mongoose"));
const getAllAssignments = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'dueDate', order = 'asc', courseId, assignmentType, isPublished = true } = req.query;
        const filter = {};
        if (courseId)
            filter.courseId = courseId;
        if (assignmentType)
            filter.assignmentType = assignmentType;
        if (isPublished !== undefined)
            filter.isPublished = isPublished === 'true';
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = {};
        sortObj[sort] = sortOrder;
        const assignments = await Assignment_1.default.find(filter)
            .populate('courseId', 'title instructor')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);
        const total = await Assignment_1.default.countDocuments(filter);
        res.status(200).json({
            success: true,
            message: 'Assignments retrieved successfully',
            data: {
                assignments,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalAssignments: total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1
                }
            }
        });
    }
    catch (error) {
        console.error('Get all assignments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve assignments',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAllAssignments = getAllAssignments;
const getCourseAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { includeUnpublished = 'false' } = req.query;
        if (!mongoose_1.default.Types.ObjectId.isValid(courseId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
            return;
        }
        const course = await Course_1.default.findById(courseId);
        if (!course) {
            res.status(404).json({
                success: false,
                message: 'Course not found'
            });
            return;
        }
        const filter = { courseId };
        if (includeUnpublished === 'false') {
            filter.isPublished = true;
        }
        const assignments = await Assignment_1.default.find(filter)
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
        });
    }
    catch (error) {
        console.error('Get course assignments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve course assignments',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getCourseAssignments = getCourseAssignments;
const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
            return;
        }
        const assignment = await Assignment_1.default.findById(id).populate({
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
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Assignment retrieved successfully',
            data: { assignment }
        });
    }
    catch (error) {
        console.error('Get assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve assignment',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAssignmentById = getAssignmentById;
const createAssignment = async (req, res) => {
    try {
        const { courseId, title, description, instructions, dueDate, maxPoints, assignmentType, attachments = [], isPublished = false, allowLateSubmission = false, latePenalty = 0 } = req.body;
        const course = await Course_1.default.findById(courseId);
        if (!course) {
            res.status(404).json({
                success: false,
                message: 'Course not found'
            });
            return;
        }
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only add assignments to your own courses'
            });
            return;
        }
        const dueDateObj = new Date(dueDate);
        if (dueDateObj <= new Date()) {
            res.status(400).json({
                success: false,
                message: 'Due date must be in the future'
            });
            return;
        }
        const assignment = new Assignment_1.default({
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
        course.assignments.push(assignment._id);
        await course.save();
        res.status(201).json({
            success: true,
            message: 'Assignment created successfully',
            data: { assignment }
        });
    }
    catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create assignment',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createAssignment = createAssignment;
const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
            return;
        }
        const assignment = await Assignment_1.default.findById(id).populate('courseId', 'instructor');
        if (!assignment) {
            res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
            return;
        }
        const course = assignment.courseId;
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only update assignments in your own courses'
            });
            return;
        }
        if (updates.dueDate) {
            const dueDateObj = new Date(updates.dueDate);
            if (dueDateObj <= new Date()) {
                res.status(400).json({
                    success: false,
                    message: 'Due date must be in the future'
                });
                return;
            }
            updates.dueDate = dueDateObj;
        }
        delete updates.courseId;
        delete updates.createdAt;
        delete updates.updatedAt;
        const updatedAssignment = await Assignment_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: 'Assignment updated successfully',
            data: { assignment: updatedAssignment }
        });
    }
    catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update assignment',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateAssignment = updateAssignment;
const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
            return;
        }
        const assignment = await Assignment_1.default.findById(id).populate('courseId', 'instructor');
        if (!assignment) {
            res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
            return;
        }
        const course = assignment.courseId;
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only delete assignments from your own courses'
            });
            return;
        }
        await Course_1.default.findByIdAndUpdate(assignment.courseId, { $pull: { assignments: assignment._id } });
        await Assignment_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Assignment deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete assignment',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteAssignment = deleteAssignment;
const toggleAssignmentPublish = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublished } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
            return;
        }
        const assignment = await Assignment_1.default.findById(id).populate('courseId', 'instructor');
        if (!assignment) {
            res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
            return;
        }
        const course = assignment.courseId;
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only modify assignments in your own courses'
            });
            return;
        }
        assignment.isPublished = isPublished;
        await assignment.save();
        res.status(200).json({
            success: true,
            message: `Assignment ${isPublished ? 'published' : 'unpublished'} successfully`,
            data: { assignment }
        });
    }
    catch (error) {
        console.error('Toggle assignment publish error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update assignment publish status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.toggleAssignmentPublish = toggleAssignmentPublish;
const getAssignmentStats = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
            return;
        }
        const assignment = await Assignment_1.default.findById(id).populate('courseId', 'instructor');
        if (!assignment) {
            res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
            return;
        }
        const course = assignment.courseId;
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only view stats for assignments in your own courses'
            });
            return;
        }
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
        };
        res.status(200).json({
            success: true,
            message: 'Assignment statistics retrieved successfully',
            data: { stats }
        });
    }
    catch (error) {
        console.error('Get assignment stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve assignment statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAssignmentStats = getAssignmentStats;
//# sourceMappingURL=assignmentController.js.map