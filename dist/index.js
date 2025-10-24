"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config");
require("./config/firebase");
const database_1 = __importDefault(require("./config/database"));
const auth_1 = __importDefault(require("./routes/auth"));
const courses_1 = __importDefault(require("./routes/courses"));
const videos_1 = __importDefault(require("./routes/videos"));
const assignments_1 = __importDefault(require("./routes/assignments"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();
(0, config_1.validateConfig)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.windowMs,
    max: config_1.config.rateLimit.maxRequests,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config_1.config.rateLimit.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return !config_1.config.rateLimit.enabled || (config_1.config.nodeEnv === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'));
    }
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const adminLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: {
        error: 'Too many admin requests, please try again later.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return config_1.config.nodeEnv === 'development';
    }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (config_1.config.nodeEnv === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
app.get('/api/health', (req, res) => {
    const { isDatabaseConnected } = require('./config/database');
    const { isFirebaseInitialized } = require('./config/firebase');
    res.status(200).json({
        success: true,
        message: 'Music LMS API is running',
        timestamp: new Date().toISOString(),
        environment: config_1.config.nodeEnv,
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
                configured: !!(config_1.config.mux.tokenId && config_1.config.mux.tokenSecret),
                status: (config_1.config.mux.tokenId && config_1.config.mux.tokenSecret) ? 'configured' : 'not configured'
            }
        }
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/courses', courses_1.default);
app.use('/api/videos', videos_1.default);
app.use('/api/assignments', assignments_1.default);
app.use('/api/users', users_1.default);
app.use('/api/admin', admin_1.default);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((val) => val.message);
        res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors
        });
        return;
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
        return;
    }
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(config_1.config.nodeEnv === 'development' && { stack: err.stack })
    });
});
const startServer = async () => {
    try {
        (0, database_1.default)().catch((error) => {
            console.log('Database connection will be retried in the background...');
        });
        const PORT = config_1.config.port;
        app.listen(PORT, () => {
            console.log(`🚀 Server running in ${config_1.config.nodeEnv} mode on port ${PORT}`);
            console.log(`📱 API Health Check: http://localhost:${PORT}/api/health`);
            console.log(`🌐 Frontend URL: ${config_1.config.frontendUrl}`);
            console.log(`🔗 Database: MongoDB Atlas (connecting...)`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map