declare global {
    namespace Express {
        interface Request {
            firebaseUser?: any;
            mongoUser?: any;
            user?: any;
        }
    }
}
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=auth.d.ts.map