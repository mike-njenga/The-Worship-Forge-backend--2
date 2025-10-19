import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB Configuration
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/music-lms',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-fallback-secret-key',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-fallback-refresh-secret',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
  
  // Firebase Configuration
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    clientId: process.env.FIREBASE_CLIENT_ID || '',
    authUri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    tokenUri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL || '',
  },
  
  // CORS Configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // File Upload Configuration
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
  },
};

// Validate required environment variables
export const validateConfig = (): void => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
  }
};

export default config;
