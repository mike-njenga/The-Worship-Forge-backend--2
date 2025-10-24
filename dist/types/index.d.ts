import { Request } from 'express';
import { Document, ObjectId } from 'mongoose';
export interface IUser extends Document {
    _id: ObjectId;
    firebaseUid?: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'admin';
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    bio?: string;
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
export interface IVideo extends Document {
    _id: ObjectId;
    courseId: ObjectId;
    title: string;
    description: string;
    videoUrl?: string;
    thumbnail: string;
    duration: number;
    order: number;
    isPreview: boolean;
    muxAssetId?: string;
    muxUploadId?: string;
    muxPlaybackId?: string;
    muxStatus?: 'waiting' | 'preparing' | 'ready' | 'errored';
    createdAt: Date;
    updatedAt: Date;
    formattedDuration: string;
    playbackUrl: string;
    isReady: boolean;
    canUserAccess(user: IUser): boolean;
}
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
export interface IProgress extends Document {
    _id: ObjectId;
    studentId: ObjectId;
    courseId: ObjectId;
    videoId: ObjectId;
    watchTime: number;
    completed: boolean;
    lastWatched: Date;
}
export interface FirebaseUser {
    _id: string;
    email: string;
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
        trialStartDate?: string;
        trialEndDate?: string;
        subscriptionStartDate?: string;
        subscriptionEndDate?: string;
    };
    isEmailVerified: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}
export interface AuthRequest extends Request {
    user?: FirebaseUser;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}
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
export interface ICourseEnrollment extends Document {
    _id: ObjectId;
    studentId: ObjectId;
    courseId: ObjectId;
    enrolledAt: Date;
    completedAt?: Date;
    progress: number;
    isActive: boolean;
}
export interface AdminStats {
    totalUsers: number;
    totalCourses: number;
    totalVideos: number;
    activeSubscriptions: number;
    trialUsers: number;
    premiumUsers: number;
    totalRevenue: number;
    monthlyRevenue: number;
}
export interface SubscriptionAnalytics {
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    cancelledSubscriptions: number;
    monthlyRevenue: number;
    totalRevenue: number;
    conversionRate: number;
}
export interface ProgressAnalytics {
    totalProgress: number;
    averageProgress: number;
    completionRate: number;
    topPerformingCourses: Array<{
        courseId: string;
        courseTitle: string;
        averageProgress: number;
        studentCount: number;
    }>;
}
export interface ChatMessage {
    id: string;
    author: 'me' | 'teacher' | 'peer';
    text: string;
    timestamp: string;
}
export interface StudentPerformance {
    studentId: string;
    studentName: string;
    studentEmail: string;
    courseId: string;
    courseTitle: string;
    totalAssignments: number;
    completedAssignments: number;
    averageGrade: number;
    lastActivity: string;
    currentVideo: string;
    canProceed: boolean;
    performanceRating: 'excellent' | 'good' | 'average' | 'needs_improvement' | 'poor';
}
export interface Feedback {
    id: string;
    studentId: string;
    studentName: string;
    assignmentTitle: string;
    feedback: string;
    rating: number;
    createdAt: string;
}
//# sourceMappingURL=index.d.ts.map