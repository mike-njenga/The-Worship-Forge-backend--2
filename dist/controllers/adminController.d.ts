import { Response } from 'express';
import { AuthRequest } from '../types';
export declare const getSystemStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllUsers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateUserAdmin: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllCourses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createCourseAdmin: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateCourseAdmin: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllVideos: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getSubscriptionAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProgressAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map