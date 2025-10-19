import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
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

// User registration validation
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('role')
    .optional()
    .isIn(['student', 'teacher', 'admin'])
    .withMessage('Role must be student, teacher, or admin'),
  
  handleValidationErrors
];

// User login validation
export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Course creation validation
export const validateCourseCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('price')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('category')
    .isIn([
      'guitar', 'piano', 'drums', 'vocals', 'bass', 'violin',
      'music-theory', 'composition', 'production', 'other'
    ])
    .withMessage('Invalid category'),
  
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  handleValidationErrors
];

// Video creation validation
export const validateVideoCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('duration')
    .isNumeric()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (in seconds)'),
  
  body('order')
    .isNumeric()
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer'),
  
  body('isPreview')
    .optional()
    .isBoolean()
    .withMessage('isPreview must be a boolean'),
  
  handleValidationErrors
];

// Assignment creation validation
export const validateAssignmentCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  
  body('maxPoints')
    .isNumeric()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max points must be between 1 and 1000'),
  
  handleValidationErrors
];

// MongoDB ObjectId validation
export const validateObjectId = (paramName: string) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort field must be between 1 and 50 characters'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  
  handleValidationErrors
];

// Password reset validation
export const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

// New password validation
export const validateNewPassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  handleValidationErrors
];
