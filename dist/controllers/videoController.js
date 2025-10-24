"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncVideoWithMux = exports.getVideoStatus = exports.handleMuxWebhook = exports.createUploadUrl = exports.getVideoStats = exports.reorderVideos = exports.deleteVideo = exports.updateVideo = exports.createVideo = exports.getVideoById = exports.getCourseVideos = void 0;
const Video_1 = __importDefault(require("../models/Video"));
const Course_1 = __importDefault(require("../models/Course"));
const mongoose_1 = __importDefault(require("mongoose"));
const muxService_1 = __importDefault(require("../services/muxService"));
const getCourseVideos = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { includePreview = 'true' } = req.query;
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
        if (includePreview === 'false') {
            filter.isPreview = false;
        }
        const videos = await Video_1.default.find(filter)
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
        });
    }
    catch (error) {
        console.error('Get course videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve course videos',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getCourseVideos = getCourseVideos;
const getVideoById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
            return;
        }
        const video = await Video_1.default.findById(id).populate({
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
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Video retrieved successfully',
            data: { video }
        });
    }
    catch (error) {
        console.error('Get video error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve video',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getVideoById = getVideoById;
const createVideo = async (req, res) => {
    try {
        const { courseId, title, description, videoUrl, thumbnail, duration, order, isPreview = false } = req.body;
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
                message: 'You can only add videos to your own courses'
            });
            return;
        }
        const existingVideo = await Video_1.default.findOne({ courseId, order });
        if (existingVideo) {
            res.status(400).json({
                success: false,
                message: 'A video with this order number already exists in this course'
            });
            return;
        }
        const video = new Video_1.default({
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
        course.videos.push(video._id);
        await course.save();
        res.status(201).json({
            success: true,
            message: 'Video created successfully',
            data: { video }
        });
    }
    catch (error) {
        console.error('Create video error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create video',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createVideo = createVideo;
const updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
            return;
        }
        const video = await Video_1.default.findById(id).populate('courseId', 'instructor');
        if (!video) {
            res.status(404).json({
                success: false,
                message: 'Video not found'
            });
            return;
        }
        const course = video.courseId;
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only update videos in your own courses'
            });
            return;
        }
        if (updates.order && updates.order !== video.order) {
            const existingVideo = await Video_1.default.findOne({
                courseId: video.courseId,
                order: updates.order,
                _id: { $ne: id }
            });
            if (existingVideo) {
                res.status(400).json({
                    success: false,
                    message: 'A video with this order number already exists in this course'
                });
                return;
            }
        }
        delete updates.courseId;
        delete updates.createdAt;
        delete updates.updatedAt;
        const updatedVideo = await Video_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: 'Video updated successfully',
            data: { video: updatedVideo }
        });
    }
    catch (error) {
        console.error('Update video error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update video',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateVideo = updateVideo;
const deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
            return;
        }
        const video = await Video_1.default.findById(id).populate('courseId', 'instructor');
        if (!video) {
            res.status(404).json({
                success: false,
                message: 'Video not found'
            });
            return;
        }
        const course = video.courseId;
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only delete videos from your own courses'
            });
            return;
        }
        await Course_1.default.findByIdAndUpdate(video.courseId, { $pull: { videos: video._id } });
        await Video_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Video deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete video error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete video',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteVideo = deleteVideo;
const reorderVideos = async (req, res) => {
    try {
        const { courseId, videoOrders } = req.body;
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
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only reorder videos in your own courses'
            });
            return;
        }
        if (!Array.isArray(videoOrders)) {
            res.status(400).json({
                success: false,
                message: 'videoOrders must be an array'
            });
            return;
        }
        const updatePromises = videoOrders.map((item) => {
            return Video_1.default.findByIdAndUpdate(item.videoId, { order: item.order }, { new: true });
        });
        await Promise.all(updatePromises);
        res.status(200).json({
            success: true,
            message: 'Videos reordered successfully'
        });
    }
    catch (error) {
        console.error('Reorder videos error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder videos',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.reorderVideos = reorderVideos;
const getVideoStats = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
            return;
        }
        const video = await Video_1.default.findById(id).populate('courseId', 'instructor');
        if (!video) {
            res.status(404).json({
                success: false,
                message: 'Video not found'
            });
            return;
        }
        const course = video.courseId;
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only view stats for videos in your own courses'
            });
            return;
        }
        const stats = {
            title: video.title,
            duration: video.duration,
            durationFormatted: video.formattedDuration,
            order: video.order,
            isPreview: video.isPreview,
            createdAt: video.createdAt,
            updatedAt: video.updatedAt
        };
        res.status(200).json({
            success: true,
            message: 'Video statistics retrieved successfully',
            data: { stats }
        });
    }
    catch (error) {
        console.error('Get video stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve video statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getVideoStats = getVideoStats;
const createUploadUrl = async (req, res) => {
    try {
        const { courseId, title, description, order, isPreview = false } = req.body;
        console.log('createUploadUrl called with:', { courseId, title, description, order, isPreview });
        const course = await Course_1.default.findById(courseId);
        if (!course) {
            console.log('Course not found:', courseId);
            res.status(404).json({
                success: false,
                message: 'Course not found'
            });
            return;
        }
        console.log('Course found:', course.title);
        console.log('Creating Mux direct upload for course:', courseId);
        const uploadData = await muxService_1.default.createDirectUpload({
            cors_origin: process.env.FRONTEND_URL || 'http://localhost:3000'
        });
        console.log('Mux upload data received:', uploadData);
        const video = new Video_1.default({
            courseId,
            title,
            description: description || '',
            muxUploadId: uploadData.id,
            muxStatus: 'waiting',
            thumbnail: '',
            duration: 0,
            order: order || (course.videos.length + 1),
            isPreview
        });
        await video.save();
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
        });
    }
    catch (error) {
        console.error('Create upload URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create upload URL',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createUploadUrl = createUploadUrl;
const handleMuxWebhook = async (req, res) => {
    try {
        const signature = req.headers['mux-signature'];
        const payload = JSON.stringify(req.body);
        if (!muxService_1.default.verifyWebhookSignature(payload, signature)) {
            res.status(401).json({
                success: false,
                message: 'Invalid webhook signature'
            });
            return;
        }
        const { type, data } = req.body;
        if (type === 'video.asset.ready') {
            const video = await Video_1.default.findOne({ muxAssetId: data.id });
            if (!video) {
                console.error('Video not found for Mux asset:', data.id);
                res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
                return;
            }
            const assetDetails = await muxService_1.default.getAsset(data.id);
            video.muxAssetId = data.id;
            video.muxPlaybackId = assetDetails.playback_ids?.[0]?.id;
            video.muxStatus = 'ready';
            video.duration = assetDetails.duration || 0;
            video.thumbnail = `https://image.mux.com/${assetDetails.playback_ids?.[0]?.id}/thumbnail.jpg?time=0`;
            await video.save();
            console.log(`Video ${video._id} is ready for playback`);
        }
        else if (type === 'video.asset.errored') {
            const video = await Video_1.default.findOne({ muxAssetId: data.id });
            if (video) {
                video.muxStatus = 'errored';
                await video.save();
                console.error(`Video ${video._id} processing failed`);
            }
        }
        res.status(200).json({
            success: true,
            message: 'Webhook processed successfully'
        });
    }
    catch (error) {
        console.error('Mux webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process webhook',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.handleMuxWebhook = handleMuxWebhook;
const getVideoStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
            return;
        }
        const video = await Video_1.default.findById(id).populate('courseId', 'instructor');
        if (!video) {
            res.status(404).json({
                success: false,
                message: 'Video not found'
            });
            return;
        }
        const course = video.courseId;
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only view status for videos in your own courses'
            });
            return;
        }
        if (video.muxAssetId) {
            try {
                const assetDetails = await muxService_1.default.getAsset(video.muxAssetId);
                video.muxStatus = assetDetails.status;
                await video.save();
            }
            catch (error) {
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
        });
    }
    catch (error) {
        console.error('Get video status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve video status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getVideoStatus = getVideoStatus;
const syncVideoWithMux = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid video ID'
            });
            return;
        }
        const video = await Video_1.default.findById(id).populate('courseId', 'instructor');
        if (!video) {
            res.status(404).json({
                success: false,
                message: 'Video not found'
            });
            return;
        }
        const course = video.courseId;
        if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only sync videos in your own courses'
            });
            return;
        }
        if (!video.muxUploadId) {
            res.status(400).json({
                success: false,
                message: 'Video does not have a Mux upload ID'
            });
            return;
        }
        console.log(`Manually syncing video ${video._id} with Mux upload ID: ${video.muxUploadId}`);
        const uploadDetails = await muxService_1.default.getUpload(video.muxUploadId);
        console.log('Upload details from Mux:', uploadDetails);
        if (uploadDetails.asset_id) {
            const assetDetails = await muxService_1.default.getAsset(uploadDetails.asset_id);
            console.log('Asset details from Mux:', assetDetails);
            video.muxAssetId = uploadDetails.asset_id;
            video.muxPlaybackId = assetDetails.playback_ids?.[0]?.id;
            video.muxStatus = 'ready';
            video.duration = assetDetails.duration || 0;
            video.thumbnail = `https://image.mux.com/${assetDetails.playback_ids?.[0]?.id}/thumbnail.jpg?time=0`;
            await video.save();
            console.log(`Video ${video._id} synced successfully with Mux`);
            res.status(200).json({
                success: true,
                message: 'Video synced successfully with Mux',
                data: {
                    muxStatus: video.muxStatus,
                    muxAssetId: video.muxAssetId,
                    muxPlaybackId: video.muxPlaybackId,
                    duration: video.duration,
                    thumbnail: video.thumbnail
                }
            });
        }
        else {
            res.status(200).json({
                success: true,
                message: 'Video is still being processed by Mux',
                data: {
                    muxStatus: 'processing',
                    muxUploadId: video.muxUploadId,
                    muxAssetId: null,
                    muxPlaybackId: null
                }
            });
        }
    }
    catch (error) {
        console.error('Sync video with Mux error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync video with Mux',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.syncVideoWithMux = syncVideoWithMux;
//# sourceMappingURL=videoController.js.map