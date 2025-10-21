import mongoose, { Schema } from 'mongoose';
import { ICourse } from '../types';

const courseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  thumbnail: {
    type: String,
    required: [true, 'Course thumbnail is required']
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  videos: [{
    type: Schema.Types.ObjectId,
    ref: 'Video'
  }],
  assignments: [{
    type: Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: [
      'guitar',
      'piano',
      'drums',
      'vocals',
      'bass',
      'violin',
      'music-theory',
      'composition',
      'production',
      'other'
    ]
  },
  level: {
    type: String,
    required: [true, 'Course level is required'],
    enum: ['beginner', 'intermediate', 'advanced']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ price: 1 });

// Virtual for total videos count
courseSchema.virtual('totalVideos').get(function() {
  return this.videos ? this.videos.length : 0;
});

// Virtual for total assignments count
courseSchema.virtual('totalAssignments').get(function() {
  return this.assignments ? this.assignments.length : 0;
});

// Virtual for estimated duration (if videos have duration)
courseSchema.virtual('estimatedDuration').get(function() {
  // This would need to be populated with video durations
  return 0;
});

// Method to check if user can access course
courseSchema.methods.canUserAccess = function(user: any): boolean {
  // Admin and instructors can always access
  if (user.role === 'admin' || user._id.toString() === this.instructor.toString()) {
    return true;
  }

  // Check if user has active subscription
  if (!user.hasActiveSubscription()) {
    return false;
  }

  // For now, all subscribed users can access all courses
  // Later we can add enrollment-based access
  return true;
};

export default mongoose.model<ICourse>('Course', courseSchema);
