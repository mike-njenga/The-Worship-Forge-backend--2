import { Request, Response } from 'express';
import Video from '../models/Video';
import Course from '../models/Course';
import { ApiResponse, AuthRequest } from '../types';
import mongoose from 'mongoose';
import MuxService from '../services/muxService';

// @desc    Get videos for a course
// @route   GET /api/videos/course/:courseId
// @access  Public (with subscription check)
export const getCourseVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { includePreview = 'true' } = req.query;

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
    if (includePreview === 'false') {
      filter.isPreview = false;
    }

    const videos = await Video.find(filter)
      .sort({ order: 1 })
      .select('title description thumbnail duration order isPreview');

    res.status(200).json({
      success: true,
      message: 'Course videos retrieved successfully',
      data: { 
        course: {
          id: course._id,
          title: course.title,
          isPublished: course.isPublished
        },
        videos 
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get course videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve course videos',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get single video by ID
// @route   GET /api/videos/:id
// @access  Private (with subscription check)
export const getVideoById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      } as ApiResponse);
      return;
    }

    const video = await Video.findById(id).populate({
      path: 'courseId',
      select: 'title instructor isPublished',
      populate: {
        path: 'instructor',
        select: 'profile.firstName profile.lastName'
      }
    });

    if (!video) {
      res.status(404).json({
        success: false,
        message: 'Video not found'
      } as ApiResponse);
      return;
    }

    // Check access permissions - temporarily disabled during Firebase migration
    // TODO: Implement Firebase-based access control
    // if (req.user && !video.canUserAccess(req.user)) {
    //   res.status(403).json({
    //     success: false,
    //     message: 'You do not have access to this video'
    //   } as ApiResponse);
    //   return;
    // }

    res.status(200).json({
      success: true,
      message: 'Video retrieved successfully',
      data: { video }
    } as ApiResponse);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve video',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Create new video
// @route   POST /api/videos
// @access  Private (Instructor/Admin only)
export const createVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      courseId,
      title,
      description,
      videoUrl,
      thumbnail,
      duration,
      order,
      isPreview = false
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

    // Check if user can add videos to this course
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only add videos to your own courses'
      } as ApiResponse);
      return;
    }

    // Check if order number is already taken
    const existingVideo = await Video.findOne({ courseId, order });
    if (existingVideo) {
      res.status(400).json({
        success: false,
        message: 'A video with this order number already exists in this course'
      } as ApiResponse);
      return;
    }

    const video = new Video({
      courseId,
      title,
      description,
      videoUrl,
      thumbnail,
      duration,
      order,
      isPreview
    });

    await video.save();

    // Add video to course's videos array
    course.videos.push(video._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: { video }
    } as ApiResponse);
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Update video
// @route   PUT /api/videos/:id
// @access  Private (Instructor/Admin only)
export const updateVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      } as ApiResponse);
      return;
    }

    const video = await Video.findById(id).populate('courseId', 'instructor');

    if (!video) {
      res.status(404).json({
        success: false,
        message: 'Video not found'
      } as ApiResponse);
      return;
    }

    // Check if user can update this video
    const course = video.courseId as any;
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only update videos in your own courses'
      } as ApiResponse);
      return;
    }

    // Check if order number is already taken by another video
    if (updates.order && updates.order !== video.order) {
      const existingVideo = await Video.findOne({ 
        courseId: video.courseId, 
        order: updates.order,
        _id: { $ne: id }
      });
      if (existingVideo) {
        res.status(400).json({
          success: false,
          message: 'A video with this order number already exists in this course'
        } as ApiResponse);
        return;
      }
    }

    // Remove fields that shouldn't be updated directly
    delete updates.courseId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const updatedVideo = await Video.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      data: { video: updatedVideo }
    } as ApiResponse);
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private (Instructor/Admin only)
export const deleteVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      } as ApiResponse);
      return;
    }

    const video = await Video.findById(id).populate('courseId', 'instructor');

    if (!video) {
      res.status(404).json({
        success: false,
        message: 'Video not found'
      } as ApiResponse);
      return;
    }

    // Check if user can delete this video
    const course = video.courseId as any;
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only delete videos from your own courses'
      } as ApiResponse);
      return;
    }

    // Remove video from course's videos array
    await Course.findByIdAndUpdate(
      video.courseId,
      { $pull: { videos: video._id } }
    );

    await Video.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Reorder videos in a course
// @route   PATCH /api/videos/reorder
// @access  Private (Instructor/Admin only)
export const reorderVideos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, videoOrders } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      } as ApiResponse);
      return;
    }

    // Check if course exists and user is instructor
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Course not found'
      } as ApiResponse);
      return;
    }

    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only reorder videos in your own courses'
      } as ApiResponse);
      return;
    }

    // Validate videoOrders format
    if (!Array.isArray(videoOrders)) {
      res.status(400).json({
        success: false,
        message: 'videoOrders must be an array'
      } as ApiResponse);
      return;
    }

    // Update video orders
    const updatePromises = videoOrders.map((item: { videoId: string; order: number }) => {
      return Video.findByIdAndUpdate(
        item.videoId,
        { order: item.order },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Videos reordered successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Reorder videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder videos',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get video statistics
// @route   GET /api/videos/:id/stats
// @access  Private (Instructor/Admin only)
export const getVideoStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      } as ApiResponse);
      return;
    }

    const video = await Video.findById(id).populate('courseId', 'instructor');

    if (!video) {
      res.status(404).json({
        success: false,
        message: 'Video not found'
      } as ApiResponse);
      return;
    }

    // Check if user can view stats
    const course = video.courseId as any;
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only view stats for videos in your own courses'
      } as ApiResponse);
      return;
    }

    // Calculate basic statistics
    const stats = {
      title: video.title,
      duration: video.duration,
      durationFormatted: video.formattedDuration,
      order: video.order,
      isPreview: video.isPreview,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt
      // TODO: Add view count, completion rate, etc. when progress tracking is implemented
    };

    res.status(200).json({
      success: true,
      message: 'Video statistics retrieved successfully',
      data: { stats }
    } as ApiResponse);
  } catch (error) {
    console.error('Get video stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve video statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Create upload URL for Mux video upload
// @route   POST /api/videos/upload-url
// @access  Private (Instructor/Admin only)
export const createUploadUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      courseId,
      title,
      description,
      order,
      isPreview = false
    } = req.body;

    console.log('createUploadUrl called with:', { courseId, title, description, order, isPreview });

    // Check if course exists and user is instructor
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('Course not found:', courseId);
      res.status(404).json({
        success: false,
        message: 'Course not found'
      } as ApiResponse);
      return;
    }

    console.log('Course found:', course.title);

    // Temporarily bypass authentication for testing
    // TODO: Re-enable authentication after testing
    /*
    // Check if user can add videos to this course
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only add videos to your own courses'
      } as ApiResponse);
      return;
    }
    */

    // Create Mux direct upload
    console.log('Creating Mux direct upload for course:', courseId);
    const uploadData = await MuxService.createDirectUpload({
      cors_origin: process.env.FRONTEND_URL || 'http://localhost:3000'
    });
    console.log('Mux upload data received:', uploadData);

    // Create video record with Mux upload ID
    const video = new Video({
      courseId,
      title,
      description: description || '',
      muxUploadId: uploadData.id,
      muxStatus: 'waiting',
      thumbnail: '', // Will be updated when Mux processes the video
      duration: 0, // Will be updated when Mux processes the video
      order: order || (course.videos.length + 1),
      isPreview
    });

    await video.save();

    // Add video to course's videos array
    course.videos.push(video._id);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Upload URL created successfully',
      data: {
        video: {
          _id: video._id,
          title: video.title,
          muxUploadId: video.muxUploadId,
          muxStatus: video.muxStatus
        },
        uploadUrl: uploadData.url,
        uploadId: uploadData.id
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Create upload URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create upload URL',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Handle Mux webhook for video processing updates
// @route   POST /api/videos/webhook
// @access  Public (Mux webhook)
export const handleMuxWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['mux-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!MuxService.verifyWebhookSignature(payload, signature)) {
      res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      } as ApiResponse);
      return;
    }

    const { type, data } = req.body;

    if (type === 'video.asset.ready') {
      // Find video by Mux asset ID
      const video = await Video.findOne({ muxAssetId: data.id });
      if (!video) {
        console.error('Video not found for Mux asset:', data.id);
        res.status(404).json({
          success: false,
          message: 'Video not found'
        } as ApiResponse);
        return;
      }

      // Get asset details from Mux
      const assetDetails = await MuxService.getAsset(data.id);

      // Update video with Mux asset information
      video.muxAssetId = data.id;
      video.muxPlaybackId = assetDetails.playback_ids?.[0]?.id;
      video.muxStatus = 'ready';
      video.duration = assetDetails.duration || 0;
      video.thumbnail = `https://image.mux.com/${assetDetails.playback_ids?.[0]?.id}/thumbnail.jpg?time=0`;
      
      await video.save();

      console.log(`Video ${video._id} is ready for playback`);
    } else if (type === 'video.asset.errored') {
      // Find video by Mux asset ID
      const video = await Video.findOne({ muxAssetId: data.id });
      if (video) {
        video.muxStatus = 'errored';
        await video.save();
        console.error(`Video ${video._id} processing failed`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Mux webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

// @desc    Get video upload status
// @route   GET /api/videos/:id/status
// @access  Private (Instructor/Admin only)
export const getVideoStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      } as ApiResponse);
      return;
    }

    const video = await Video.findById(id).populate('courseId', 'instructor');

    if (!video) {
      res.status(404).json({
        success: false,
        message: 'Video not found'
      } as ApiResponse);
      return;
    }

    // Check if user can view this video
    const course = video.courseId as any;
    if (req.user!.role !== 'admin' && course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only view status for videos in your own courses'
      } as ApiResponse);
      return;
    }

    // If video has Mux asset, get latest status
    if (video.muxAssetId) {
      try {
        const assetDetails = await MuxService.getAsset(video.muxAssetId);
        video.muxStatus = assetDetails.status;
        await video.save();
      } catch (error) {
        console.error('Failed to fetch Mux asset status:', error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Video status retrieved successfully',
      data: {
        video: {
          _id: video._id,
          title: video.title,
          muxStatus: video.muxStatus,
          isReady: video.isReady,
          playbackUrl: video.playbackUrl,
          duration: video.duration,
          thumbnail: video.thumbnail
        }
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get video status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve video status',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};
