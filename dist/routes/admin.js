"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const auth_1 = __importDefault(require("../middleware/auth"));
const adminAuth_1 = require("../middleware/adminAuth");
const router = express_1.default.Router();
router.use(auth_1.default);
router.use(adminAuth_1.requireAdmin);
router.get('/stats', adminController_1.getSystemStats);
router.get('/users', adminController_1.getAllUsers);
router.patch('/users/:id', adminController_1.updateUserAdmin);
router.get('/courses', adminController_1.getAllCourses);
router.post('/courses', adminController_1.createCourseAdmin);
router.patch('/courses/:id', adminController_1.updateCourseAdmin);
router.get('/videos', adminController_1.getAllVideos);
router.get('/subscriptions', adminController_1.getSubscriptionAnalytics);
router.get('/progress', adminController_1.getProgressAnalytics);
exports.default = router;
//# sourceMappingURL=admin.js.map