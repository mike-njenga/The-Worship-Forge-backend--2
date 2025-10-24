"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseWithVideos = exports.addVideosToCourse = exports.getCourseStats = exports.getInstructorCourses = exports.toggleCoursePublish = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourseById = exports.getCourses = void 0;
const Course_1 = __importDefault(require("../models/Course"));
const Video_1 = __importDefault(require("../models/Video"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const getCourses = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', category, level, instructor, search, isPublished = true } = req.query;
        const filter = {};
        if (category)
            filter.category = category;
        if (level)
            filter.level = level;
        if (instructor)
            filter.instructor = instructor;
        if (isPublished !== undefined)
            filter.isPublished = isPublished === 'true';
        if (search) {
            filter.$text = { $search: search };
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortObj = {};
        if (search && filter.$text) {
            sortObj.score = { $meta: 'textScore' };
        }
        else {
            sortObj[sort] = sortOrder;
        }
        const courses = await Course_1.default.find(filter)
            .populate('instructor', 'profile.firstName profile.lastName profile.avatar')
            .populate('videos', 'title duration order isPreview')
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);
        const total = await Course_1.default.countDocuments(filter);
        res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            data: {
                courses,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalCourses: total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1
                }
            }
        });
    }
    catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve courses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getCourses = getCourses;
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
            return;
        }
        const course = await Course_1.default.findById(id)
            .populate('instructor', 'profile.firstName profile.lastName profile.avatar profile.bio')
            .populate({
            path: 'videos',
            select: 'title description videoUrl thumbnail duration order isPreview',
            options: { sort: { order: 1 } }
        })
            .populate({
            path: 'assignments',
            select: 'title description dueDate maxPoints',
            options: { sort: { dueDate: 1 } }
        });
        if (!course) {
            res.status(404).json({
                success: false,
                message: 'Course not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Course retrieved successfully',
            data: { course }
        });
    }
    catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve course',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getCourseById = getCourseById;
const createCourse = async (req, res) => {
    try {
        const { title, description, thumbnail, price, category, level, tags = [], videos = [] } = req.body;
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: 'Only teachers and admins can create courses'
            });
            return;
        }
        const course = new Course_1.default({
            title,
            description,
            thumbnail,
            instructor: req.user._id,
            price,
            category,
            level,
            tags,
            isPublished: false
        });
        await course.save();
        const createdVideos = [];
        if (videos && videos.length > 0) {
            for (const videoData of videos) {
                const video = new Video_1.default({
                    courseId: course._id,
                    title: videoData.title,
                    description: videoData.description || '',
                    videoUrl: videoData.videoUrl,
                    thumbnail: videoData.thumbnail,
                    duration: videoData.duration,
                    order: videoData.order || 1,
                    isPreview: videoData.isPreview || false
                });
                await video.save();
                createdVideos.push(video);
                course.videos.push(video._id);
            }
            await course.save();
        }
        await course.populate('instructor', 'profile.firstName profile.lastName profile.avatar');
        await course.populate('videos', 'title duration order isPreview');
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: {
                course,
                videos: createdVideos
            }
        });
    }
    catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createCourse = createCourse;
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { videos, ...updates } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
            return;
        }
        const course = await Course_1.default.findById(id);
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
                message: 'You can only update your own courses'
            });
            return;
        }
        delete updates.instructor;
        delete updates.assignments;
        delete updates.createdAt;
        delete updates.updatedAt;
        const updatedCourse = await Course_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        const createdVideos = [];
        if (videos && videos.length > 0) {
            for (const videoData of videos) {
                const video = new Video_1.default({
                    courseId: course._id,
                    title: videoData.title,
                    description: videoData.description || '',
                    videoUrl: videoData.videoUrl,
                    thumbnail: videoData.thumbnail,
                    duration: videoData.duration,
                    order: videoData.order || (course.videos.length + 1),
                    isPreview: videoData.isPreview || false
                });
                await video.save();
                createdVideos.push(video);
                updatedCourse.videos.push(video._id);
            }
            await updatedCourse.save();
        }
        await updatedCourse.populate('instructor', 'profile.firstName profile.lastName profile.avatar');
        await updatedCourse.populate('videos', 'title duration order isPreview');
        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: {
                course: updatedCourse,
                newVideos: createdVideos
            }
        });
    }
    catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateCourse = updateCourse;
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
            return;
        }
        const course = await Course_1.default.findById(id);
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
                message: 'You can only delete your own courses'
            });
            return;
        }
        await Course_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete course',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteCourse = deleteCourse;
const toggleCoursePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublished } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
            return;
        }
        const course = await Course_1.default.findById(id);
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
                message: 'You can only modify your own courses'
            });
            return;
        }
        course.isPublished = isPublished;
        await course.save();
        res.status(200).json({
            success: true,
            message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
            data: { course }
        });
    }
    catch (error) {
        console.error('Toggle publish error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course publish status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.toggleCoursePublish = toggleCoursePublish;
const getInstructorCourses = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const { page = 1, limit = 10, isPublished } = req.query;
        if (!mongoose_1.default.Types.ObjectId.isValid(instructorId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid instructor ID'
            });
            return;
        }
        const instructor = await User_1.default.findById(instructorId);
        if (!instructor) {
            res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
            return;
        }
        const filter = { instructor: instructorId };
        if (isPublished !== undefined) {
            filter.isPublished = isPublished === 'true';
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const courses = await Course_1.default.find(filter)
            .populate('instructor', 'profile.firstName profile.lastName profile.avatar')
            .populate('videos', 'title duration order isPreview')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = await Course_1.default.countDocuments(filter);
        res.status(200).json({
            success: true,
            message: 'Instructor courses retrieved successfully',
            data: {
                instructor: {
                    id: instructor._id,
                    name: `${instructor.firstName} ${instructor.lastName}`,
                    avatar: instructor.avatar,
                    bio: instructor.bio
                },
                courses,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalCourses: total,
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1
                }
            }
        });
    }
    catch (error) {
        console.error('Get instructor courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve instructor courses',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getInstructorCourses = getInstructorCourses;
const getCourseStats = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
            return;
        }
        const course = await Course_1.default.findById(id)
            .populate('videos', 'duration')
            .populate('assignments');
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
                message: 'You can only view stats for your own courses'
            });
            return;
        }
        const totalVideos = course.videos.length;
        const totalAssignments = course.assignments.length;
        const totalDuration = course.videos.reduce((sum, video) => sum + (video.duration || 0), 0);
        const stats = {
            totalVideos,
            totalAssignments,
            totalDuration,
            totalDurationFormatted: formatDuration(totalDuration),
            isPublished: course.isPublished,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt
        };
        res.status(200).json({
            success: true,
            message: 'Course statistics retrieved successfully',
            data: { stats }
        });
    }
    catch (error) {
        console.error('Get course stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve course statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getCourseStats = getCourseStats;
const addVideosToCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { videos } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
            return;
        }
        const course = await Course_1.default.findById(id);
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
                message: 'You can only add videos to your own courses'
            });
            return;
        }
        if (!videos || !Array.isArray(videos) || videos.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Videos array is required and must not be empty'
            });
            return;
        }
        const createdVideos = [];
        let nextOrder = course.videos.length + 1;
        for (const videoData of videos) {
            const video = new Video_1.default({
                courseId: course._id,
                title: videoData.title,
                description: videoData.description || '',
                videoUrl: videoData.videoUrl,
                thumbnail: videoData.thumbnail,
                duration: videoData.duration,
                order: videoData.order || nextOrder++,
                isPreview: videoData.isPreview || false
            });
            await video.save();
            createdVideos.push(video);
            course.videos.push(video._id);
        }
        await course.save();
        res.status(201).json({
            success: true,
            message: `${createdVideos.length} videos added to course successfully`,
            data: {
                course: course._id,
                videos: createdVideos
            }
        });
    }
    catch (error) {
        console.error('Add videos to course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add videos to course',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.addVideosToCourse = addVideosToCourse;
const getCourseWithVideos = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
            return;
        }
        const course = await Course_1.default.findById(id)
            .populate('instructor', 'profile.firstName profile.lastName profile.avatar profile.bio')
            .populate({
            path: 'videos',
            select: 'title description videoUrl thumbnail duration order isPreview',
            options: { sort: { order: 1 } }
        });
        if (!course) {
            res.status(404).json({
                success: false,
                message: 'Course not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Course with videos retrieved successfully',
            data: { course }
        });
    }
    catch (error) {
        console.error('Get course with videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve course with videos',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getCourseWithVideos = getCourseWithVideos;
const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};
//# sourceMappingURL=courseController.js.map