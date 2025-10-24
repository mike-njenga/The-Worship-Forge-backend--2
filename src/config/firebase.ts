import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Check if Firebase credentials are properly configured
    const hasValidCredentials = process.env.FIREBASE_PROJECT_ID && 
                               process.env.FIREBASE_PRIVATE_KEY && 
                               process.env.FIREBASE_CLIENT_EMAIL &&
                               process.env.FIREBASE_PRIVATE_KEY !== 'your-private-key' &&
                               process.env.FIREBASE_PROJECT_ID !== 'your-firebase-project-id';

    if (hasValidCredentials) {
      // Validate private key format
      const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
      
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Invalid Firebase private key format. Please ensure it includes proper PEM headers.');
      }

      const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });
      console.log('✅ Firebase Admin SDK initialized successfully with service account');
    } else {
      // Fallback to application default credentials (for development)
      console.log('⚠️  Firebase service account not configured, using application default credentials');
      console.log('   To configure Firebase, update your .env file with valid Firebase credentials');
      
      admin.initializeApp({
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'testproject-24b7d.appspot.com'
      });
      console.log('✅ Firebase Admin SDK initialized successfully with default credentials');
    }
  } catch (error) {
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
    
    // Don't exit the process, just log the error and continue
    // This allows the app to run without Firebase for development
  }
}

// Export Firebase services with error handling
export const auth = admin.apps.length > 0 ? admin.auth() : null;
export const db = admin.apps.length > 0 ? admin.firestore() : null;

// Helper function to check if Firebase is initialized
export const isFirebaseInitialized = () => admin.apps.length > 0;