import { prisma } from '../config/database';
import { logger } from './logger';

export interface AuditParams {
  userId?: string | null;
  action: string;
  resource: string;
  details?: string | null;
  ipAddress?: string | null;
}

/**
 * Persists an action audit log entry into the database and console logger.
 */
export const createAuditLog = async (params: AuditParams) => {
  try {
    const { userId, action, resource, details, ipAddress } = params;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        resource,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    });

    logger.info(`[AUDIT] ${action} on ${resource}`, undefined, { userId, details });
  } catch (err) {
    logger.error('Erro ao registrar log de auditoria:', err);
  }
};
