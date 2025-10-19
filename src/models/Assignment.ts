import mongoose, { Schema } from 'mongoose';
import { IAssignment } from '../types';

const assignmentSchema = new Schema<IAssignment>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  instructions: {
    type: String,
    required: [true, 'Assignment instructions are required'],
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  maxPoints: {
    type: Number,
    required: [true, 'Maximum points is required'],
    min: [1, 'Maximum points must be at least 1'],
    max: [1000, 'Maximum points cannot exceed 1000']
  },
  assignmentType: {
    type: String,
    required: [true, 'Assignment type is required'],
    enum: ['quiz', 'project', 'essay', 'performance', 'recording', 'other']
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  latePenalty: {
    type: Number,
    default: 0,
    min: [0, 'Late penalty cannot be negative'],
    max: [100, 'Late penalty cannot exceed 100%']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
assignmentSchema.index({ courseId: 1, dueDate: 1 });
assignmentSchema.index({ courseId: 1 });
assignmentSchema.index({ assignmentType: 1 });
assignmentSchema.index({ isPublished: 1 });

// Virtual for days until due
assignmentSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for assignment status
assignmentSchema.virtual('status').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  
  if (now > due) {
    return 'overdue';
  } else if (now > new Date(due.getTime() - 24 * 60 * 60 * 1000)) {
    return 'due_soon'; // Due within 24 hours
  } else {
    return 'upcoming';
  }
});

// Method to check if assignment is overdue
assignmentSchema.methods.isOverdue = function(): boolean {
  return new Date() > new Date(this.dueDate);
};

// Method to check if assignment is due soon (within 24 hours)
assignmentSchema.methods.isDueSoon = function(): boolean {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffHours = diffTime / (1000 * 60 * 60);
  return diffHours <= 24 && diffHours > 0;
};

export default mongoose.model<IAssignment>('Assignment', assignmentSchema);
