export async function retry(fn, options) {
    const retries = options?.retries ?? 3;
    const delayMs = options?.delayMs ?? 500;
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        }
        catch (err) {
            lastError = err;
            if (i < retries - 1) {
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }
    throw lastError;
}
//# sourceMappingURL=retry.js.map