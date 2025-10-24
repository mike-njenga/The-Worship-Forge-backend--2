export declare const config: {
    port: string | number;
    nodeEnv: string;
    mongoUri: string;
    firebase: {
        projectId: string;
        privateKeyId: string;
        privateKey: string;
        clientEmail: string;
        clientId: string;
        authUri: string;
        tokenUri: string;
        authProviderX509CertUrl: string;
        clientX509CertUrl: string;
    };
    frontendUrl: string;
    mux: {
        tokenId: string;
        tokenSecret: string;
        signingKey: string;
        webhookSecret: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        enabled: boolean;
    };
    fileUpload: {
        maxFileSize: number;
        allowedFileTypes: string[];
    };
};
export declare const validateConfig: () => void;
export default config;
//# sourceMappingURL=index.d.ts.map