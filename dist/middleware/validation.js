"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNewPassword = exports.validatePasswordReset = exports.validatePagination = exports.validateObjectId = exports.validateAssignmentCreation = exports.validateVideoCreation = exports.validateCourseCreation = exports.validateUserLogin = exports.validateUserRegistration = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.type === 'field' ? error.path : error.type,
                message: error.msg,
                value: error.type === 'field' ? error.value : undefined
            }))
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.validateUserRegistration = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    (0, express_validator_1.body)('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(['student', 'teacher', 'admin'])
        .withMessage('Role must be student, teacher, or admin'),
    exports.handleValidationErrors
];
exports.validateUserLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required'),
    exports.handleValidationErrors
];
exports.validateCourseCreation = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    (0, express_validator_1.body)('price')
        .isNumeric()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('category')
        .isIn([
        'guitar', 'piano', 'drums', 'vocals', 'bass', 'violin',
        'music-theory', 'composition', 'production', 'other'
    ])
        .withMessage('Invalid category'),
    (0, express_validator_1.body)('level')
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Level must be beginner, intermediate, or advanced'),
    (0, express_validator_1.body)('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    (0, express_validator_1.body)('videos')
        .optional()
        .isArray()
        .withMessage('Videos must be an array'),
    (0, express_validator_1.body)('videos.*.title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Video title must be between 5 and 100 characters'),
    (0, express_validator_1.body)('videos.*.description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Video description cannot exceed 500 characters'),
    (0, express_validator_1.body)('videos.*.videoUrl')
        .optional()
        .isURL()
        .withMessage('Video URL must be a valid URL'),
    (0, express_validator_1.body)('videos.*.thumbnail')
        .optional()
        .isURL()
        .withMessage('Video thumbnail must be a valid URL'),
    (0, express_validator_1.body)('videos.*.duration')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Video duration must be a positive integer'),
    (0, express_validator_1.body)('videos.*.order')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Video order must be a positive integer'),
    (0, express_validator_1.body)('videos.*.isPreview')
        .optional()
        .isBoolean()
        .withMessage('Video isPreview must be a boolean'),
    exports.handleValidationErrors
];
exports.validateVideoCreation = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    (0, express_validator_1.body)('duration')
        .isNumeric()
        .isInt({ min: 1 })
        .withMessage('Duration must be a positive integer (in seconds)'),
    (0, express_validator_1.body)('order')
        .isNumeric()
        .isInt({ min: 1 })
        .withMessage('Order must be a positive integer'),
    (0, express_validator_1.body)('isPreview')
        .optional()
        .isBoolean()
        .withMessage('isPreview must be a boolean'),
    exports.handleValidationErrors
];
exports.validateAssignmentCreation = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    (0, express_validator_1.body)('dueDate')
        .isISO8601()
        .withMessage('Due date must be a valid date'),
    (0, express_validator_1.body)('maxPoints')
        .isNumeric()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Max points must be between 1 and 1000'),
    exports.handleValidationErrors
];
const validateObjectId = (paramName) => [
    (0, express_validator_1.param)(paramName)
        .isMongoId()
        .withMessage(`Invalid ${paramName} ID`),
    exports.handleValidationErrors
];
exports.validateObjectId = validateObjectId;
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('sort')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Sort field must be between 1 and 50 characters'),
    (0, express_validator_1.query)('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order must be asc or desc'),
    exports.handleValidationErrors
];
exports.validatePasswordReset = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    exports.handleValidationErrors
];
exports.validateNewPassword = [
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    (0, express_validator_1.body)('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    }),
    exports.handleValidationErrors
];
//# sourceMappingURL=validation.js.map