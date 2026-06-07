import { Response, NextFunction } from 'express';
import { verifySaToken } from '../services/sa.service';
import type { AuthRequest } from './auth';

export type SaRequest = AuthRequest & {
  saEmail?: string;
  saId?: string;
};

export function requireSaAuth(req: SaRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Super Admin authentication required' });
    return;
  }

  try {
    const payload = verifySaToken(header.replace('Bearer ', ''));
    req.saEmail = payload.email;
    req.saId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired Super Admin session' });
  }
}
