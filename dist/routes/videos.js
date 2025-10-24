"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoController_1 = require("../controllers/videoController");
const auth_1 = __importDefault(require("../middleware/auth"));
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
router.get('/course/:courseId', (0, validation_1.validateObjectId)('courseId'), videoController_1.getCourseVideos);
router.get('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, videoController_1.getVideoById);
router.get('/:id/stats', (0, validation_1.validateObjectId)('id'), auth_1.default, videoController_1.getVideoStats);
router.post('/', auth_1.default, validation_1.validateVideoCreation, videoController_1.createVideo);
router.put('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, videoController_1.updateVideo);
router.patch('/reorder', auth_1.default, [
    (0, express_validator_1.body)('courseId')
        .isMongoId()
        .withMessage('Invalid course ID'),
    (0, express_validator_1.body)('videoOrders')
        .isArray()
        .withMessage('videoOrders must be an array'),
    (0, express_validator_1.body)('videoOrders.*.videoId')
        .isMongoId()
        .withMessage('Invalid video ID'),
    (0, express_validator_1.body)('videoOrders.*.order')
        .isInt({ min: 1 })
        .withMessage('Order must be a positive integer')
], videoController_1.reorderVideos);
router.delete('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, videoController_1.deleteVideo);
router.post('/upload-url', [
    (0, express_validator_1.body)('courseId')
        .isMongoId()
        .withMessage('Invalid course ID'),
    (0, express_validator_1.body)('title')
        .notEmpty()
        .withMessage('Video title is required'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .withMessage('Description must be a string'),
    (0, express_validator_1.body)('order')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Order must be a positive integer'),
    (0, express_validator_1.body)('isPreview')
        .optional()
        .isBoolean()
        .withMessage('isPreview must be a boolean')
], videoController_1.createUploadUrl);
router.post('/webhook', videoController_1.handleMuxWebhook);
router.get('/:id/status', (0, validation_1.validateObjectId)('id'), auth_1.default, videoController_1.getVideoStatus);
router.post('/:id/sync-mux', (0, validation_1.validateObjectId)('id'), auth_1.default, videoController_1.syncVideoWithMux);
exports.default = router;
//# sourceMappingURL=videos.js.map