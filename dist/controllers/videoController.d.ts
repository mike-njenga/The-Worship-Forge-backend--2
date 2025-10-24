import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare const getCourseVideos: (req: Request, res: Response) => Promise<void>;
export declare const getVideoById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createVideo: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateVideo: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteVideo: (req: AuthRequest, res: Response) => Promise<void>;
export declare const reorderVideos: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getVideoStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createUploadUrl: (req: AuthRequest, res: Response) => Promise<void>;
export declare const handleMuxWebhook: (req: Request, res: Response) => Promise<void>;
export declare const getVideoStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const syncVideoWithMux: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=videoController.d.ts.map