import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare const getCourses: (req: Request, res: Response) => Promise<void>;
export declare const getCourseById: (req: Request, res: Response) => Promise<void>;
export declare const createCourse: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateCourse: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteCourse: (req: AuthRequest, res: Response) => Promise<void>;
export declare const toggleCoursePublish: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getInstructorCourses: (req: Request, res: Response) => Promise<void>;
export declare const getCourseStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const addVideosToCourse: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCourseWithVideos: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=courseController.d.ts.map