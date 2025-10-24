import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare const getAllAssignments: (req: Request, res: Response) => Promise<void>;
export declare const getCourseAssignments: (req: Request, res: Response) => Promise<void>;
export declare const getAssignmentById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createAssignment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateAssignment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteAssignment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const toggleAssignmentPublish: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAssignmentStats: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=assignmentController.d.ts.map