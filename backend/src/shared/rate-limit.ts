import type { RequestHandler } from 'express';

import { rateLimited } from './errors.js';

type Entry = { count: number; resetAt: number };

export const createRateLimiter = (
  windowMs: number,
  maxAttempts: number,
): RequestHandler => {
  const entries = new Map<string, Entry>();

  return (request, _response, next) => {
    const now = Date.now();
    const key = request.ip || 'unknown';
    const current = entries.get(key);
    const entry =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : current;
    entry.count += 1;
    entries.set(key, entry);

    if (entry.count > maxAttempts) {
      next(rateLimited());
      return;
    }
    next();
  };
};
