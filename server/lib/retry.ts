export interface RetryOpts {
  attempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOpts = {}): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const initial = opts.initialDelayMs ?? 500;
  const max = opts.maxDelayMs ?? 5000;
  const timeoutMs = opts.timeoutMs ?? 10000;

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
      ]);
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1) break;
      const delay = Math.min(initial * Math.pow(2, i), max);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
