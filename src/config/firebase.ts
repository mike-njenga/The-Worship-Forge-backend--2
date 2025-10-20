import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Try to use service account from environment variables first
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });
      console.log('✅ Firebase Admin SDK initialized successfully with service account');
    } else {
      // Fallback to application default credentials (for development)
      console.log('No Firebase service account found, using application default credentials');
      admin.initializeApp({
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'testproject-24b7d.appspot.com'
      });
      console.log('✅ Firebase Admin SDK initialized successfully with default credentials');
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    // Exit on fatal init error in backend
    process.exit(1);
  }
}

export const auth = admin.auth();
export const db = admin.firestore();