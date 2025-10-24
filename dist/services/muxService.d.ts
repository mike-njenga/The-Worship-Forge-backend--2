export declare class MuxService {
    static createDirectUpload(options?: {
        cors_origin?: string;
        new_asset_settings?: {
            playback_policy?: string[];
            mp4_support?: string;
        };
    }): Promise<{
        id: string;
        url: string;
        status: "waiting" | "errored" | "asset_created" | "cancelled" | "timed_out";
        asset_id: string;
    }>;
    static getUpload(uploadId: string): Promise<{
        id: string;
        status: "waiting" | "errored" | "asset_created" | "cancelled" | "timed_out";
        asset_id: string;
        created_at: any;
        updated_at: any;
    }>;
    static getAsset(assetId: string): Promise<{
        id: string;
        status: "preparing" | "ready" | "errored";
        duration: number;
        aspect_ratio: string;
        playback_ids: import("@mux/mux-node/resources/shared").PlaybackID[];
        created_at: any;
        updated_at: any;
    }>;
    static getPlaybackUrl(playbackId: string): Promise<{
        id: string;
        policy: import("@mux/mux-node/resources/shared").PlaybackPolicy;
    }>;
    static deleteAsset(assetId: string): Promise<boolean>;
    static getAssetAnalytics(assetId: string, timeframe?: string): Promise<any>;
    static createSignedPlaybackUrl(playbackId: string, expiration?: number): string;
    static verifyWebhookSignature(payload: string, signature: string): boolean;
}
export default MuxService;
//# sourceMappingURL=muxService.d.ts.map