import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config, validateConfig } from './config';
import './config/firebase'; // Initialize Firebase
import connectDB from './config/database';

// Import routes
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import videoRoutes from './routes/videos';
import assignmentRoutes from './routes/assignments';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';

const app = express();

// Validate configuration
validateConfig();

// Firebase is initialized in the config/firebase.ts file

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development or when disabled
  skip: (req) => {
    return !config.rateLimit.enabled || (config.nodeEnv === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'));
  }
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// More lenient rate limiting for admin endpoints (they make multiple calls)
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute for admin endpoints
  message: {
    error: 'Too many admin requests, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return config.nodeEnv === 'development';
  }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const { isDatabaseConnected } = require('./config/database');
  const { isFirebaseInitialized } = require('./config/firebase');
  
  res.status(200).json({
    success: true,
    message: 'Music LMS API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    services: {
      database: {
        connected: isDatabaseConnected(),
        status: isDatabaseConnected() ? 'connected' : 'disconnected'
      },
      firebase: {
        initialized: isFirebaseInitialized(),
        status: isFirebaseInitialized() ? 'initialized' : 'not configured'
      },
      mux: {
        configured: !!(config.mux.tokenId && config.mux.tokenSecret),
        status: (config.mux.tokenId && config.mux.tokenSecret) ? 'configured' : 'not configured'
      }
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val: any) => val.message);
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired'
    });
    return;
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// Start server with graceful database connection handling
const startServer = async () => {
  try {
    // Try to connect to MongoDB Atlas (non-blocking)
    connectDB().catch((error) => {
      console.log('Database connection will be retried in the background...');
    });
    
    // Start the Express server regardless of database connection status
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
      console.log(`📱 API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
      console.log(`🔗 Database: MongoDB Atlas (connecting...)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
