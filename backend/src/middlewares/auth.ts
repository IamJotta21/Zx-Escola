/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
export type Role =
  'SUPER_ADMIN' | 'ADMIN' | 'DIRETOR' | 'STAFF' | 'TEACHER' | 'FINANCEIRO' | 'GUARDIAN' | 'STUDENT';

export interface UserPayload {
  id: string;
  email: string;
  role: Role;
  tenantId?: string | null;
}

// Extend Request type to include user & tenantId
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      tenantId?: string | null;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Access Denied: No token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
    req.user = decoded;
    // Extract tenantId from JWT payload or fallback to header if present
    req.tenantId = decoded.tenantId || (req.headers['x-tenant-id'] as string) || null;
    return next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
  }
};

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: Insufficient permissions',
      });
    }

    return next();
  };
};
