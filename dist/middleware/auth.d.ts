import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            firebaseUser?: any;
            mongoUser?: any;
            user?: any;
        }
    }
}
declare function authenticateFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
export default authenticateFirebaseToken;
//# sourceMappingURL=auth.d.ts.map