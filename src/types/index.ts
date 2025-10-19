import { Request } from 'express';
import { Document, ObjectId } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: ObjectId;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    bio?: string;
  };
  subscription: {
    plan: 'free' | 'premium';
    status: 'active' | 'inactive' | 'trial';
    trialStartDate?: Date;
    trialEndDate?: Date;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  };
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isInTrialPeriod(): boolean;
  hasActiveSubscription(): boolean;
}

// Course Types
export interface ICourse extends Document {
  _id: ObjectId;
  title: string;
  description: string;
  thumbnail: string;
  instructor: ObjectId;
  videos: ObjectId[];
  assignments: ObjectId[];
  price: number;
  isPublished: boolean;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Video Types
export interface IVideo extends Document {
  _id: ObjectId;
  courseId: ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: number; // in seconds
  order: number;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
  formattedDuration: string;
  canUserAccess(user: IUser): boolean;
}

// Assignment Types
export interface IAssignment extends Document {
  _id: ObjectId;
  courseId: ObjectId;
  title: string;
  description: string;
  instructions: string;
  dueDate: Date;
  maxPoints: number;
  assignmentType: 'quiz' | 'project' | 'essay' | 'performance' | 'recording' | 'other';
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }>;
  isPublished: boolean;
  allowLateSubmission: boolean;
  latePenalty: number;
  createdAt: Date;
  updatedAt: Date;
  daysUntilDue: number;
  status: 'upcoming' | 'due_soon' | 'overdue';
  isOverdue(): boolean;
  isDueSoon(): boolean;
}

// Submission Types
export interface ISubmission extends Document {
  _id: ObjectId;
  assignmentId: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  files: string[];
  textSubmission?: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
  submittedAt: Date;
  gradedAt?: Date;
}

// Progress Types
export interface IProgress extends Document {
  _id: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  videoId: ObjectId;
  watchTime: number; // in seconds
  completed: boolean;
  lastWatched: Date;
}

// Request Types
export interface AuthRequest extends Request {
  user?: IUser;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// JWT Payload Types
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// File Upload Types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Pagination Types
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Course Enrollment Types
export interface ICourseEnrollment extends Document {
  _id: ObjectId;
  studentId: ObjectId;
  courseId: ObjectId;
  enrolledAt: Date;
  completedAt?: Date;
  progress: number; // percentage
  isActive: boolean;
}
