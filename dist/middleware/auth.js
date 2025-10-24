"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("../config/firebase");
const User_1 = __importDefault(require("../models/User"));
async function authenticateFirebaseToken(req, res, next) {
    if (!(0, firebase_1.isFirebaseInitialized)() || !firebase_1.auth) {
        return res.status(503).json({
            error: 'Firebase authentication is not available. Please configure Firebase credentials.'
        });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const idToken = authHeader.split(' ')[1];
    try {
        const decodedToken = await firebase_1.auth.verifyIdToken(idToken);
        req.firebaseUser = decodedToken;
        req.user = decodedToken;
        let mongoUser = await User_1.default.findOne({ firebaseUid: decodedToken.uid });
        if (!mongoUser) {
            mongoUser = await User_1.default.findOne({ email: decodedToken.email });
        }
        if (mongoUser) {
            req.mongoUser = mongoUser;
            req.user.role = mongoUser.role;
        }
        next();
    }
    catch (err) {
        if (err.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token has expired' });
        }
        else if (err.code === 'auth/id-token-revoked') {
            return res.status(401).json({ error: 'Token has been revoked' });
        }
        else if (err.code === 'auth/invalid-id-token') {
            return res.status(401).json({ error: 'Invalid token format' });
        }
        else {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    }
}
exports.default = authenticateFirebaseToken;
//# sourceMappingURL=auth.js.map