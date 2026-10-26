import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required.'
    });
    return;
  }

  next();
}
