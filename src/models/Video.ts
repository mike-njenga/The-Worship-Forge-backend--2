import mongoose, { Schema } from 'mongoose';
import { IVideo } from '../types';

const videoSchema = new Schema<IVideo>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  // Legacy video URL (for backward compatibility)
  videoUrl: {
    type: String,
    required: function() {
      return !this.muxUploadId && !this.muxAssetId; // Required only if no Mux upload/asset
    }
  },
  // Mux integration fields
  muxAssetId: {
    type: String,
    sparse: true, // Allows multiple documents without this field
    index: true
  },
  muxUploadId: {
    type: String,
    sparse: true
  },
  muxPlaybackId: {
    type: String,
    sparse: true
  },
  muxStatus: {
    type: String,
    enum: ['waiting', 'preparing', 'ready', 'errored'],
    default: 'waiting'
  },
  thumbnail: {
    type: String,
    required: function() {
      return !this.muxUploadId && !this.muxAssetId; // Required only if no Mux upload/asset
    }
  },
  duration: {
    type: Number,
    required: function() {
      return !this.muxUploadId && !this.muxAssetId; // Required only if no Mux upload/asset
    },
    min: 0 // Allow 0 for Mux videos, will be validated in pre-save hook
  },
  order: {
    type: Number,
    required: [true, 'Video order is required'],
    min: [1, 'Order must be at least 1']
  },
  isPreview: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
videoSchema.index({ courseId: 1, order: 1 });
videoSchema.index({ courseId: 1 });
videoSchema.index({ isPreview: 1 });
// Note: muxAssetId index is already created by sparse: true in schema
videoSchema.index({ muxStatus: 1 });

// Virtual for formatted duration
videoSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for Mux playback URL
videoSchema.virtual('playbackUrl').get(function() {
  if (this.muxPlaybackId) {
    return `https://stream.mux.com/${this.muxPlaybackId}.m3u8`;
  }
  return this.videoUrl; // Fallback to legacy URL
});

// Virtual to check if video is ready for playback
videoSchema.virtual('isReady').get(function() {
  return this.muxStatus === 'ready' || !!this.videoUrl;
});

// Method to check if user can access video
videoSchema.methods.canUserAccess = function(user: any): boolean {
  // Admin can access all videos
  if (user.role === 'admin') {
    return true;
  }

  // Check if user has active subscription
  if (!user.hasActiveSubscription()) {
    return false;
  }

  // Preview videos are accessible to all subscribed users
  if (this.isPreview) {
    return true;
  }

  // For now, all subscribed users can access all videos
  // Later we can add course enrollment-based access
  return true;
};

export default mongoose.model<IVideo>('Video', videoSchema);
