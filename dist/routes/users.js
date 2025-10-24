"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = __importDefault(require("../middleware/auth"));
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
router.get('/', auth_1.default, validation_1.validatePagination, userController_1.getUsers);
router.get('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, userController_1.getUserById);
router.get('/:id/courses', (0, validation_1.validateObjectId)('id'), auth_1.default, validation_1.validatePagination, userController_1.getUserCourses);
router.get('/:id/stats', (0, validation_1.validateObjectId)('id'), auth_1.default, userController_1.getUserStats);
router.put('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, [
    (0, express_validator_1.body)('profile.firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('profile.lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('profile.phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please enter a valid phone number'),
    (0, express_validator_1.body)('profile.bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
    (0, express_validator_1.body)('profile.avatar')
        .optional()
        .isURL()
        .withMessage('Avatar must be a valid URL'),
], userController_1.updateUserProfile);
router.patch('/:id/subscription', (0, validation_1.validateObjectId)('id'), auth_1.default, [
    (0, express_validator_1.body)('plan')
        .optional()
        .isIn(['free', 'premium'])
        .withMessage('Plan must be free or premium'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['active', 'inactive', 'trial'])
        .withMessage('Status must be active, inactive, or trial'),
    (0, express_validator_1.body)('subscriptionStartDate')
        .optional()
        .isISO8601()
        .withMessage('Subscription start date must be a valid date'),
    (0, express_validator_1.body)('subscriptionEndDate')
        .optional()
        .isISO8601()
        .withMessage('Subscription end date must be a valid date'),
], userController_1.updateUserSubscription);
router.patch('/:id/password', (0, validation_1.validateObjectId)('id'), auth_1.default, [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
], userController_1.changePassword);
router.delete('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map