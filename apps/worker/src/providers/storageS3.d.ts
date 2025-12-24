export declare function ensureBucket(): Promise<void>;
export declare function putFile(localPath: string, key: string, contentType?: string): Promise<string>;
export declare function presignedGet(key: string, expirySec?: number): Promise<string>;
//# sourceMappingURL=storageS3.d.ts.map