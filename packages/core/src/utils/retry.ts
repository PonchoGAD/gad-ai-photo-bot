export async function retry<T>(
  fn: () => Promise<T>,
  options?: {
    retries?: number;
    delayMs?: number;
  }
): Promise<T> {
  const retries = options?.retries ?? 3;
  const delayMs = options?.delayMs ?? 500;

  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  throw lastError;
}
