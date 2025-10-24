"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const assignmentController_1 = require("../controllers/assignmentController");
const auth_1 = __importDefault(require("../middleware/auth"));
const validation_1 = require("../middleware/validation");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
router.get('/', assignmentController_1.getAllAssignments);
router.get('/course/:courseId', (0, validation_1.validateObjectId)('courseId'), assignmentController_1.getCourseAssignments);
router.get('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, assignmentController_1.getAssignmentById);
router.get('/:id/stats', (0, validation_1.validateObjectId)('id'), auth_1.default, assignmentController_1.getAssignmentStats);
router.post('/', auth_1.default, validation_1.validateAssignmentCreation, assignmentController_1.createAssignment);
router.put('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, assignmentController_1.updateAssignment);
router.patch('/:id/publish', (0, validation_1.validateObjectId)('id'), auth_1.default, [
    (0, express_validator_1.body)('isPublished')
        .isBoolean()
        .withMessage('isPublished must be a boolean value'),
], assignmentController_1.toggleAssignmentPublish);
router.delete('/:id', (0, validation_1.validateObjectId)('id'), auth_1.default, assignmentController_1.deleteAssignment);
exports.default = router;
//# sourceMappingURL=assignments.js.map