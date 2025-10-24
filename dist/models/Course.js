"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const courseSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Course description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    thumbnail: {
        type: String,
        required: [true, 'Course thumbnail is required']
    },
    instructor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Instructor is required']
    },
    videos: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Video'
        }],
    assignments: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Assignment'
        }],
    price: {
        type: Number,
        required: [true, 'Course price is required'],
        min: [0, 'Price cannot be negative']
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        required: [true, 'Course category is required'],
        enum: [
            'guitar',
            'piano',
            'drums',
            'vocals',
            'bass',
            'violin',
            'music-theory',
            'composition',
            'production',
            'other'
        ]
    },
    level: {
        type: String,
        required: [true, 'Course level is required'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    tags: [{
            type: String,
            trim: true,
            maxlength: [30, 'Tag cannot exceed 30 characters']
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ price: 1 });
courseSchema.virtual('totalVideos').get(function () {
    return this.videos ? this.videos.length : 0;
});
courseSchema.virtual('totalAssignments').get(function () {
    return this.assignments ? this.assignments.length : 0;
});
courseSchema.virtual('estimatedDuration').get(function () {
    return 0;
});
courseSchema.methods.canUserAccess = function (user) {
    if (user.role === 'admin' || user._id.toString() === this.instructor.toString()) {
        return true;
    }
    if (!user.hasActiveSubscription()) {
        return false;
    }
    return true;
};
exports.default = mongoose_1.default.model('Course', courseSchema);
//# sourceMappingURL=Course.js.map