import { Request, Response } from 'express';
import Course from '../models/Course';
import Video from '../models/Video';
import User from '../models/User';
import { ApiResponse, AuthRequest } from '../types';
import mongoose from 'mongoose';

// @desc    Get all courses with filtering, sorting, and pagination
// @route   GET /api/courses
// @access  Public
export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      category,
      level,
      instructor,
      search,
      isPublished = true
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (instructor) filter.instructor = instructor;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    
    // Add text search
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: any = {};
    
    if (search && filter.$text) {
      sortObj.score = { $meta: 'textScore' };
    } else {
      sortObj[sort as string] = sortOrder;
    }

    // Execute query
    const courses = await Course.find(filter)
      .populate('instructor', 'profile.firstName profile.lastName profile.avatar')
      .populate('videos', 'title duration order isPreview')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Course.countDocuments(filter);

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
    } as ApiResponse);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve courses',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      } as ApiResponse);
      return;
    }

    const course = await Course.findById(id)
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
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Course retrieved successfully',
      data: { course }
    } as ApiResponse);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Teacher/Admin only)
export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      thumbnail,
      price,
      category,
      level,
      tags = [],
      videos = [] // Array of video objects to attach
    } = req.body;

    // Check if user is teacher or admin
    if (req.user!.role !== 'teacher' && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only teachers and admins can create courses'
      } as ApiResponse);
      return;
    }

    const course = new Course({
      title,
      description,
      thumbnail,
      instructor: req.user!._id,
      price,
      category,
      level,
      tags,
      isPublished: false // Courses start as unpublished
    });

    await course.save();

    // Create videos if provided
    const createdVideos = [];
    if (videos && videos.length > 0) {
      for (const videoData of videos) {
        const video = new Video({
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

    // Populate instructor info and videos
    await course.populate('instructor', 'profile.firstName profile.lastName profile.avatar');
    await course.populate('videos', 'title duration order isPreview');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { 
        course,
        videos: createdVideos
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor/Admin only)
export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { videos, ...updates } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      } as ApiResponse);
      return;
    }

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      } as ApiResponse);
      return;
    }

    // Check if user can update this course
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only update your own courses'
      } as ApiResponse);
      return;
    }

    // Remove fields that shouldn't be updated directly
    delete updates.instructor;
    delete updates.assignments;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Update course basic information
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    // Handle video additions if provided
    const createdVideos = [];
    if (videos && videos.length > 0) {
      for (const videoData of videos) {
        const video = new Video({
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
        updatedCourse!.videos.push(video._id);
      }
      await updatedCourse!.save();
    }

    // Populate instructor info and videos
    await updatedCourse!.populate('instructor', 'profile.firstName profile.lastName profile.avatar');
    await updatedCourse!.populate('videos', 'title duration order isPreview');

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { 
        course: updatedCourse,
        newVideos: createdVideos
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor/Admin only)
export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      } as ApiResponse);
      return;
    }

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      } as ApiResponse);
      return;
    }

    // Check if user can delete this course
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own courses'
      } as ApiResponse);
      return;
    }

    await Course.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Publish/Unpublish course
// @route   PATCH /api/courses/:id/publish
// @access  Private (Instructor/Admin only)
export const toggleCoursePublish = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      } as ApiResponse);
      return;
    }

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      } as ApiResponse);
      return;
    }

    // Check if user can modify this course
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only modify your own courses'
      } as ApiResponse);
      return;
    }

    course.isPublished = isPublished;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: { course }
    } as ApiResponse);
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course publish status',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get instructor's courses
// @route   GET /api/courses/instructor/:instructorId
// @access  Public
export const getInstructorCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instructorId } = req.params;
    const { page = 1, limit = 10, isPublished } = req.query;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid instructor ID'
      } as ApiResponse);
      return;
    }

    // Check if instructor exists
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      res.status(404).json({
        success: false,
        message: 'Instructor not found'
      } as ApiResponse);
      return;
    }

    // Build filter
    const filter: any = { instructor: instructorId };
    if (isPublished !== undefined) {
      filter.isPublished = isPublished === 'true';
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const courses = await Course.find(filter)
      .populate('instructor', 'profile.firstName profile.lastName profile.avatar')
      .populate('videos', 'title duration order isPreview')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Course.countDocuments(filter);

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
    } as ApiResponse);
  } catch (error) {
    console.error('Get instructor courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve instructor courses',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get course statistics
// @route   GET /api/courses/:id/stats
// @access  Private (Instructor/Admin only)
export const getCourseStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      } as ApiResponse);
      return;
    }

    const course = await Course.findById(id)
      .populate('videos', 'duration')
      .populate('assignments');

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      } as ApiResponse);
      return;
    }

    // Check if user can view stats
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only view stats for your own courses'
      } as ApiResponse);
      return;
    }

    // Calculate statistics
    const totalVideos = course.videos.length;
    const totalAssignments = course.assignments.length;
    const totalDuration = course.videos.reduce((sum: number, video: any) => sum + (video.duration || 0), 0);

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
    } as ApiResponse);
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Add multiple videos to a course
// @route   POST /api/courses/:id/videos
// @access  Private (Instructor/Admin only)
export const addVideosToCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { videos } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      } as ApiResponse);
      return;
    }

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      } as ApiResponse);
      return;
    }

    // Check if user can add videos to this course
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only add videos to your own courses'
      } as ApiResponse);
      return;
    }

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Videos array is required and must not be empty'
      } as ApiResponse);
      return;
    }

    const createdVideos = [];
    let nextOrder = course.videos.length + 1;

    for (const videoData of videos) {
      const video = new Video({
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
    } as ApiResponse);
  } catch (error) {
    console.error('Add videos to course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add videos to course',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get course with all videos
// @route   GET /api/courses/:id/videos
// @access  Public
export const getCourseWithVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      } as ApiResponse);
      return;
    }

    const course = await Course.findById(id)
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
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Course with videos retrieved successfully',
      data: { course }
    } as ApiResponse);
  } catch (error) {
    console.error('Get course with videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course with videos',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// Helper function to format duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
