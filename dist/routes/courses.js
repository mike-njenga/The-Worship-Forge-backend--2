"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const courseController_1 = require("../controllers/courseController");
const auth_1 = __importDefault(require("../middleware/auth"));
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
router.get('/', validation_1.validatePagination, courseController_1.getCourses);
router.get('/instructor/:instructorId', (0, validation_1.validateObjectId)('instructorId'), validation_1.validatePagination, courseController_1.getInstructorCourses);
router.get('/:id', (0, validation_1.validateObjectId)('id'), courseController_1.getCourseById);
router.get('/:id/stats', (0, validation_1.validateObjectId)('id'), auth_1.default, courseController_1.getCourseStats);
router.get('/:id/videos', (0, validation_1.validateObjectId)('id'), courseController_1.getCourseWithVideos);
router.post('/', auth_1.default, validation_1.validateCourseCreation, courseController_1.createCourse);
router.post('/:id/videos', (0, validation_1.validateObjectId)('id'), auth_1.default, [
    (0, express_validator_1.body)('videos')
        .isArray({ min: 1 })
        .withMessage('Videos must be a non-empty array'),
    (0, express_validator_1.body)('videos.*.title')
        .notEmpty()
        .withMessage('Video title is required'),
    (0, express_validator_1.body)('videos.*.videoUrl')
        .notEmpty()
        .withMessage('Video URL is required'),
    (0, express_validator_1.body)('videos.*.thumbnail')
        .notEmpty()
        .withMessage('Video thumbnail is required'),
    (0, express_validator_1.body)('videos.*.duration')
        .isInt({ min: 1 })
        .withMessage('Video duration must be a positive integer')
], courseController_1.addVideosToCourse);
router.put('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, courseController_1.updateCourse);
router.patch('/:id/publish', (0, validation_1.validateObjectId)('id'), auth_1.default, [
    (0, express_validator_1.body)('isPublished')
        .isBoolean()
        .withMessage('isPublished must be a boolean value'),
], courseController_1.toggleCoursePublish);
router.delete('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, courseController_1.deleteCourse);
exports.default = router;
//# sourceMappingURL=courses.js.map