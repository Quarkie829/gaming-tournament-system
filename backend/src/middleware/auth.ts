import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.'
    });
    return;
  }

  const secret = process.env.JWT_SECRET || 'super_secret_gaming_tournament_jwt_key_2026_secure';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      res.status(403).json({
        success: false,
        message: 'Invalid or expired authentication token.'
      });
      return;
    }

    req.user = decoded as AuthTokenPayload;
    next();
  });
}

export function optionalAuthenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  const secret = process.env.JWT_SECRET || 'super_secret_gaming_tournament_jwt_key_2026_secure';

  jwt.verify(token, secret, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded as AuthTokenPayload;
    }
    next();
  });
}
