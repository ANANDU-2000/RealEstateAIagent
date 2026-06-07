import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';

export interface AuthRequest extends Request {
  tenantId?: string;
  plan?: string;
  tenantEmail?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = verifyAccessToken(header.replace('Bearer ', ''));
    req.tenantId = payload.tenant_id;
    req.plan = payload.plan;
    req.tenantEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
