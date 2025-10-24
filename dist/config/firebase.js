"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFirebaseInitialized = exports.db = exports.auth = void 0;
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    try {
        const hasValidCredentials = process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_PRIVATE_KEY &&
            process.env.FIREBASE_CLIENT_EMAIL &&
            process.env.FIREBASE_PRIVATE_KEY !== 'your-private-key' &&
            process.env.FIREBASE_PROJECT_ID !== 'your-firebase-project-id';
        if (hasValidCredentials) {
            const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
            if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
                throw new Error('Invalid Firebase private key format. Please ensure it includes proper PEM headers.');
            }
            const serviceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: privateKey,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            };
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
            });
            console.log('✅ Firebase Admin SDK initialized successfully with service account');
        }
        else {
            console.log('⚠️  Firebase service account not configured, using application default credentials');
            console.log('   To configure Firebase, update your .env file with valid Firebase credentials');
            admin.initializeApp({
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'testproject-24b7d.appspot.com'
            });
            console.log('✅ Firebase Admin SDK initialized successfully with default credentials');
        }
    }
    catch (error) {
        console.error('❌ Firebase Admin SDK initialization failed:', error);
        console.log('');
        console.log('🔧 To fix this issue:');
        console.log('1. Get your Firebase service account key from Firebase Console');
        console.log('2. Update your backend/.env file with the correct values:');
        console.log('   FIREBASE_PROJECT_ID=your-actual-project-id');
        console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
        console.log('   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com');
        console.log('');
        console.log('📝 Note: The app will continue to run but Firebase features will be disabled.');
    }
}
exports.auth = admin.apps.length > 0 ? admin.auth() : null;
exports.db = admin.apps.length > 0 ? admin.firestore() : null;
const isFirebaseInitialized = () => admin.apps.length > 0;
exports.isFirebaseInitialized = isFirebaseInitialized;
//# sourceMappingURL=firebase.js.map