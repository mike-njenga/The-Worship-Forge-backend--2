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
const assignmentSchema = new mongoose_1.Schema({
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    title: {
        type: String,
        required: [true, 'Assignment title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Assignment description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    instructions: {
        type: String,
        required: [true, 'Assignment instructions are required'],
        maxlength: [2000, 'Instructions cannot exceed 2000 characters']
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    },
    maxPoints: {
        type: Number,
        required: [true, 'Maximum points is required'],
        min: [1, 'Maximum points must be at least 1'],
        max: [1000, 'Maximum points cannot exceed 1000']
    },
    assignmentType: {
        type: String,
        required: [true, 'Assignment type is required'],
        enum: ['quiz', 'project', 'essay', 'performance', 'recording', 'other']
    },
    attachments: [{
            fileName: String,
            fileUrl: String,
            fileSize: Number,
            fileType: String
        }],
    isPublished: {
        type: Boolean,
        default: false
    },
    allowLateSubmission: {
        type: Boolean,
        default: false
    },
    latePenalty: {
        type: Number,
        default: 0,
        min: [0, 'Late penalty cannot be negative'],
        max: [100, 'Late penalty cannot exceed 100%']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
assignmentSchema.index({ courseId: 1, dueDate: 1 });
assignmentSchema.index({ courseId: 1 });
assignmentSchema.index({ assignmentType: 1 });
assignmentSchema.index({ isPublished: 1 });
assignmentSchema.virtual('daysUntilDue').get(function () {
    const now = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});
assignmentSchema.virtual('status').get(function () {
    const now = new Date();
    const due = new Date(this.dueDate);
    if (now > due) {
        return 'overdue';
    }
    else if (now > new Date(due.getTime() - 24 * 60 * 60 * 1000)) {
        return 'due_soon';
    }
    else {
        return 'upcoming';
    }
});
assignmentSchema.methods.isOverdue = function () {
    return new Date() > new Date(this.dueDate);
};
assignmentSchema.methods.isDueSoon = function () {
    const now = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
};
exports.default = mongoose_1.default.model('Assignment', assignmentSchema);
//# sourceMappingURL=Assignment.js.map