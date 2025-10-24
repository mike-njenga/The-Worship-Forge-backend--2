"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminOrOwner = exports.requireAdmin = void 0;
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.mongoUser) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    if (req.mongoUser.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireAdminOrOwner = (req, res, next) => {
    if (!req.user || !req.mongoUser) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    const resourceId = req.params.id;
    const userId = req.mongoUser._id.toString();
    if (req.mongoUser.role === 'admin' || userId === resourceId) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required or you can only access your own resources.'
    });
};
exports.requireAdminOrOwner = requireAdminOrOwner;
//# sourceMappingURL=adminAuth.js.map