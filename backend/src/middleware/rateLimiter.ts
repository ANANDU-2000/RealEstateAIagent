import { Request, Response, NextFunction } from 'express';

type RateEntry = { count: number; resetAt: number };

const store = new Map<string, RateEntry>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (entry.count >= MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
    return;
  }

  entry.count += 1;
  next();
}
