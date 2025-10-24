"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MuxService = void 0;
const mux_node_1 = __importDefault(require("@mux/mux-node"));
const config_1 = require("../config");
const isMuxConfigured = config_1.config.mux.tokenId && config_1.config.mux.tokenSecret;
const mux = isMuxConfigured ? new mux_node_1.default({
    tokenId: config_1.config.mux.tokenId,
    tokenSecret: config_1.config.mux.tokenSecret,
}) : null;
class MuxService {
    static async createDirectUpload(options = {}) {
        if (!isMuxConfigured || !mux) {
            throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
        }
        try {
            console.log('Creating Mux direct upload with options:', {
                cors_origin: options.cors_origin || config_1.config.frontendUrl,
                new_asset_settings: {
                    playback_policy: ['public'],
                    ...options.new_asset_settings,
                },
            });
            const upload = await mux.video.uploads.create({
                cors_origin: options.cors_origin || config_1.config.frontendUrl,
                new_asset_settings: {
                    playback_policy: ['public'],
                    ...options.new_asset_settings,
                },
            });
            console.log('Mux direct upload created successfully:', {
                id: upload.id,
                url: upload.url,
                status: upload.status,
                asset_id: upload.asset_id,
            });
            return {
                id: upload.id,
                url: upload.url,
                status: upload.status,
                asset_id: upload.asset_id,
            };
        }
        catch (error) {
            console.error('Error creating Mux direct upload:', error);
            console.error('Error details:', {
                message: error.message,
                status: error.status,
                response: error.response?.data,
            });
            throw new Error(`Failed to create video upload URL: ${error.message}`);
        }
    }
    static async getUpload(uploadId) {
        if (!isMuxConfigured || !mux) {
            throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
        }
        try {
            const upload = await mux.video.uploads.retrieve(uploadId);
            return {
                id: upload.id,
                status: upload.status,
                asset_id: upload.asset_id,
                created_at: upload.created_at,
                updated_at: upload.updated_at,
            };
        }
        catch (error) {
            console.error('Error fetching Mux upload:', error);
            throw new Error('Failed to fetch video upload');
        }
    }
    static async getAsset(assetId) {
        if (!isMuxConfigured || !mux) {
            throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
        }
        try {
            const asset = await mux.video.assets.retrieve(assetId);
            return {
                id: asset.id,
                status: asset.status,
                duration: asset.duration,
                aspect_ratio: asset.aspect_ratio,
                playback_ids: asset.playback_ids,
                created_at: asset.created_at,
                updated_at: asset.updated_at,
            };
        }
        catch (error) {
            console.error('Error fetching Mux asset:', error);
            throw new Error('Failed to fetch video asset');
        }
    }
    static async getPlaybackUrl(playbackId) {
        if (!isMuxConfigured || !mux) {
            throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
        }
        try {
            const playbackIdData = await mux.video.playbackIds.retrieve(playbackId);
            return {
                id: playbackIdData.id,
                policy: playbackIdData.policy,
            };
        }
        catch (error) {
            console.error('Error fetching playback URL:', error);
            throw new Error('Failed to fetch playback URL');
        }
    }
    static async deleteAsset(assetId) {
        if (!isMuxConfigured || !mux) {
            throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
        }
        try {
            await mux.video.assets.delete(assetId);
            return true;
        }
        catch (error) {
            console.error('Error deleting Mux asset:', error);
            throw new Error('Failed to delete video asset');
        }
    }
    static async getAssetAnalytics(assetId, timeframe = '7d') {
        if (!isMuxConfigured || !mux) {
            throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
        }
        try {
            const analytics = await mux.data.overall.get({
                timeframe: [timeframe],
                filters: [`asset_id:${assetId}`],
            });
            return analytics;
        }
        catch (error) {
            console.error('Error fetching asset analytics:', error);
            throw new Error('Failed to fetch video analytics');
        }
    }
    static createSignedPlaybackUrl(playbackId, expiration = 3600) {
        if (!isMuxConfigured || !mux) {
            throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
        }
        try {
            const token = mux.jwt.signPlaybackId(playbackId, {
                keyId: config_1.config.mux.tokenId,
                keySecret: config_1.config.mux.signingKey,
                expiration: expiration.toString(),
            });
            return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
        }
        catch (error) {
            console.error('Error creating signed playback URL:', error);
            throw new Error('Failed to create signed playback URL');
        }
    }
    static verifyWebhookSignature(payload, signature) {
        if (!isMuxConfigured || !mux) {
            console.warn('Mux is not configured, skipping webhook signature verification');
            return true;
        }
        try {
            if (!config_1.config.mux.webhookSecret) {
                console.warn('Mux webhook secret not configured');
                return true;
            }
            return mux.webhooks.verifyHeader(payload, signature, config_1.config.mux.webhookSecret);
        }
        catch (error) {
            console.error('Error verifying webhook signature:', error);
            return false;
        }
    }
}
exports.MuxService = MuxService;
exports.default = MuxService;
//# sourceMappingURL=muxService.js.map