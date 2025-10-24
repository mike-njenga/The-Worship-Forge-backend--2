import Mux from '@mux/mux-node';
import { config } from '../config';

// Check if Mux is configured
const isMuxConfigured = config.mux.tokenId && config.mux.tokenSecret;

// Initialize Mux client only if configured
const mux = isMuxConfigured ? new Mux({
  tokenId: config.mux.tokenId,
  tokenSecret: config.mux.tokenSecret,
}) : null;

export class MuxService {
  /**
   * Create a direct upload URL for video uploads
   */
  static async createDirectUpload(options: {
    cors_origin?: string;
    new_asset_settings?: {
      playback_policy?: string[];
      mp4_support?: string;
    };
  } = {}) {
    if (!isMuxConfigured || !mux) {
      throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
    }

    try {
      console.log('Creating Mux direct upload with options:', {
        cors_origin: options.cors_origin || config.frontendUrl,
        new_asset_settings: {
          playback_policy: ['public'] as any,
          ...options.new_asset_settings,
        },
      });

      const upload = await mux.video.uploads.create({
        cors_origin: options.cors_origin || config.frontendUrl,
        new_asset_settings: {
          playback_policy: ['public'] as any,
          ...options.new_asset_settings,
        } as any,
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
    } catch (error) {
      console.error('Error creating Mux direct upload:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.data,
      });
      throw new Error(`Failed to create video upload URL: ${error.message}`);
    }
  }

  /**
   * Get upload details by ID
   */
  static async getUpload(uploadId: string) {
    if (!isMuxConfigured || !mux) {
      throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
    }

    try {
      const upload = await mux.video.uploads.retrieve(uploadId);
      return {
        id: upload.id,
        status: upload.status,
        asset_id: upload.asset_id,
        created_at: (upload as any).created_at,
        updated_at: (upload as any).updated_at,
      };
    } catch (error) {
      console.error('Error fetching Mux upload:', error);
      throw new Error('Failed to fetch video upload');
    }
  }

  /**
   * Get asset details by ID
   */
  static async getAsset(assetId: string) {
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
        created_at: (asset as any).created_at,
        updated_at: (asset as any).updated_at,
      };
    } catch (error) {
      console.error('Error fetching Mux asset:', error);
      throw new Error('Failed to fetch video asset');
    }
  }

  /**
   * Get playback URL for a video
   */
  static async getPlaybackUrl(playbackId: string) {
    if (!isMuxConfigured || !mux) {
      throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
    }

    try {
      const playbackIdData = await mux.video.playbackIds.retrieve(playbackId);
      return {
        id: playbackIdData.id,
        policy: playbackIdData.policy,
      };
    } catch (error) {
      console.error('Error fetching playback URL:', error);
      throw new Error('Failed to fetch playback URL');
    }
  }

  /**
   * Delete an asset
   */
  static async deleteAsset(assetId: string) {
    if (!isMuxConfigured || !mux) {
      throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
    }

    try {
      await mux.video.assets.delete(assetId);
      return true;
    } catch (error) {
      console.error('Error deleting Mux asset:', error);
      throw new Error('Failed to delete video asset');
    }
  }

  /**
   * Get asset analytics
   */
  static async getAssetAnalytics(assetId: string, timeframe: string = '7d') {
    if (!isMuxConfigured || !mux) {
      throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
    }

    try {
      const analytics = await (mux.data as any).overall.get({
        timeframe: [timeframe],
        filters: [`asset_id:${assetId}`],
      });
      return analytics;
    } catch (error) {
      console.error('Error fetching asset analytics:', error);
      throw new Error('Failed to fetch video analytics');
    }
  }

  /**
   * Create a signed playback URL with expiration
   */
  static createSignedPlaybackUrl(playbackId: string, expiration: number = 3600) {
    if (!isMuxConfigured || !mux) {
      throw new Error('Mux is not configured. Please set MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables.');
    }

    try {
      const token = mux.jwt.signPlaybackId(playbackId, {
        keyId: config.mux.tokenId,
        keySecret: config.mux.signingKey,
        expiration: expiration.toString(),
      });
      
      return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
    } catch (error) {
      console.error('Error creating signed playback URL:', error);
      throw new Error('Failed to create signed playback URL');
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!isMuxConfigured || !mux) {
      console.warn('Mux is not configured, skipping webhook signature verification');
      return true; // Allow in development
    }

    try {
      if (!config.mux.webhookSecret) {
        console.warn('Mux webhook secret not configured');
        return true; // Allow in development
      }
      return (mux.webhooks as any).verifyHeader(payload, signature, config.mux.webhookSecret);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

export default MuxService;

