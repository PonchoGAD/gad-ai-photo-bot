export declare function saveFile(): Promise<boolean>;
export declare function putFile(filePath: string, key: string, contentType?: string): Promise<void>;
export declare function getFileStream(key: string): Promise<void>;
export declare function presign(key: string, expires: number): Promise<string>;
//# sourceMappingURL=index.d.ts.map