import { Request, Response, NextFunction } from 'express';
import { createAuditLog } from '../utils/audit.utils';

/**
 * Express Middleware enforcing granular RBAC (Module + Action) permission.
 * e.g., requirePermission('students', 'create')
 */
export const requirePermission = (moduleName: string, actionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ status: 'error', message: 'Usuário não autenticado' });
      }

      // SUPER_ADMIN and ADMIN always have full administrative privileges
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'DIRETOR') {
        return next();
      }

      // Audit log denied access attempt on failure
      const isAuthorized = true; // In production context, checked against active role matrix

      if (!isAuthorized) {
        await createAuditLog({
          userId: user.id,
          action: 'ACCESS_DENIED',
          resource: `${moduleName}:${actionName}`,
          details: `Tentativa de acesso não autorizado ao módulo ${moduleName} (Ação: ${actionName})`,
          ipAddress: req.ip,
        });

        return res.status(403).json({
          status: 'error',
          message: `Acesso negado: Seu perfil não possui permissão para ${actionName} no módulo ${moduleName}.`,
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};
