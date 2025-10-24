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
const videoSchema = new mongoose_1.Schema({
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    title: {
        type: String,
        required: [true, 'Video title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    videoUrl: {
        type: String,
        required: function () {
            return !this.muxUploadId && !this.muxAssetId;
        }
    },
    muxAssetId: {
        type: String,
        sparse: true,
        index: true
    },
    muxUploadId: {
        type: String,
        sparse: true
    },
    muxPlaybackId: {
        type: String,
        sparse: true
    },
    muxStatus: {
        type: String,
        enum: ['waiting', 'preparing', 'ready', 'errored'],
        default: 'waiting'
    },
    thumbnail: {
        type: String,
        required: function () {
            return !this.muxUploadId && !this.muxAssetId;
        }
    },
    duration: {
        type: Number,
        required: function () {
            return !this.muxUploadId && !this.muxAssetId;
        },
        min: 0
    },
    order: {
        type: Number,
        required: [true, 'Video order is required'],
        min: [1, 'Order must be at least 1']
    },
    isPreview: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
videoSchema.index({ courseId: 1, order: 1 });
videoSchema.index({ courseId: 1 });
videoSchema.index({ isPreview: 1 });
videoSchema.index({ muxStatus: 1 });
videoSchema.virtual('formattedDuration').get(function () {
    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = this.duration % 60;
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});
videoSchema.virtual('playbackUrl').get(function () {
    if (this.muxPlaybackId) {
        return `https://stream.mux.com/${this.muxPlaybackId}.m3u8`;
    }
    return this.videoUrl;
});
videoSchema.virtual('isReady').get(function () {
    return this.muxStatus === 'ready' || !!this.videoUrl;
});
videoSchema.methods.canUserAccess = function (user) {
    if (user.role === 'admin') {
        return true;
    }
    if (!user.hasActiveSubscription()) {
        return false;
    }
    if (this.isPreview) {
        return true;
    }
    return true;
};
exports.default = mongoose_1.default.model('Video', videoSchema);
//# sourceMappingURL=Video.js.map