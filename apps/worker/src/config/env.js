export const env = {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
    S3_ENDPOINT: process.env.S3_ENDPOINT ?? "",
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? "",
    S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? "",
    S3_BUCKET: process.env.S3_BUCKET ?? "",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
};
//# sourceMappingURL=env.js.map