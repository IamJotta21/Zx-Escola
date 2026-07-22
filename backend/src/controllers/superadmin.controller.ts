import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { generateAccessToken } from '../utils/jwt';
import { createAuditLog } from '../utils/audit.utils';

/**
 * Get global SaaS metrics and growth chart data (SUPER_ADMIN only)
 */
export const getSuperAdminDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"

    const [
      tenants,
      totalUsers,
      totalStudents,
      totalTeachers,
      transactions,
      tuitions,
    ] = await Promise.all([
      prisma.tenant.findMany({
        include: {
          _count: { select: { users: true, students: true, teachers: true } },
        },
      }),
      prisma.user.count(),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.transaction.findMany({ where: { type: 'RECEITA' } }),
      prisma.tuition.findMany({ where: { status: 'PAGO' } }),
    ]);

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
    const suspendedTenants = tenants.filter((t) => t.status === 'SUSPENDED').length;

    // Plans breakdown
    const activePlans = {
      BASIC: tenants.filter((t) => t.plan === 'BASIC').length,
      PRO: tenants.filter((t) => t.plan === 'PRO').length,
      ENTERPRISE: tenants.filter((t) => t.plan === 'ENTERPRISE').length,
    };

    // Revenues calculation
    const totalRevenue = transactions.reduce((acc, t) => acc + t.value, 0) +
      tuitions.reduce((acc, t) => acc + t.finalValue, 0);

    const monthlyRevenue = transactions
      .filter((t) => t.date && t.date.startsWith(currentMonthStr))
      .reduce((acc, t) => acc + t.value, 0);

    // Monthly growth charts mock/aggregation data
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];
    const schoolsGrowth = months.map((m, i) => ({ month: m, total: Math.min(totalTenants, (i + 1) * 3) }));
    const studentsGrowth = months.map((m, i) => ({ month: m, total: Math.min(totalStudents, (i + 1) * 120) }));
    const usersGrowth = months.map((m, i) => ({ month: m, total: Math.min(totalUsers, (i + 1) * 150) }));
    const revenueGrowth = months.map((m, i) => ({ month: m, total: Math.min(totalRevenue, (i + 1) * 25000) }));

    return res.json({
      status: 'success',
      data: {
        summary: {
          totalTenants,
          activeTenants,
          suspendedTenants,
          totalUsers,
          totalStudents,
          totalTeachers,
          monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          activePlans,
        },
        charts: {
          schoolsGrowth,
          studentsGrowth,
          usersGrowth,
          revenueGrowth,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Controlled Support Impersonation ("Acessar como Escola")
 */
export const impersonateTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, reason } = req.body;

    if (!tenantId) {
      return res.status(400).json({ status: 'error', message: 'ID da escola (tenantId) é obrigatório' });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Motivo do acesso de suporte é obrigatório (mínimo de 5 caracteres)',
      });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ status: 'error', message: 'Escola/Tenant não encontrada' });
    }

    // Issue temporary token for the impersonated tenant
    const impersonatedPayload = {
      id: req.user?.id || 'super-admin-user',
      email: req.user?.email || 'admin@saas.com',
      role: 'SUPER_ADMIN' as const,
      tenantId: tenant.id,
    };

    const tempToken = generateAccessToken(impersonatedPayload);

    // Audit log impersonation action
    await createAuditLog({
      userId: req.user?.id,
      action: 'IMPERSONATE_TENANT',
      resource: 'Tenant',
      details: `Acesso temporário de suporte à escola ${tenant.name} (${tenant.id}). Motivo: ${reason}`,
      ipAddress: req.ip,
    });

    return res.json({
      status: 'success',
      data: {
        accessToken: tempToken,
        tenant: {
          id: tenant.id,
          name: tenant.name,
        },
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Dispatch Global SaaS Notifications to all or targeted schools
 */
export const sendGlobalNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, priority = 'MEDIA', targetTenantId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ status: 'error', message: 'Título e conteúdo são obrigatórios' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: `[GLOBAL ${priority}] ${title}`,
        content,
        target: targetTenantId ? 'CLASS' : 'ALL',
        senderId: req.user?.id || 'superadmin',
        tenantId: targetTenantId || null,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'SEND_GLOBAL_NOTIFICATION',
      resource: 'Announcement',
      details: `Comunicado global enviado: ${title} (Prioridade: ${priority})`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ status: 'success', data: announcement });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get System Health and Monitoring Stats
 */
export const getSystemMonitoring = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const activeTenants = await prisma.tenant.count({ where: { status: 'ACTIVE' } });
    const totalTenants = await prisma.tenant.count();
    const recentLogins = await prisma.auditLog.findMany({
      where: { action: 'LOGIN' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { include: { profile: true } },
      },
    });

    return res.json({
      status: 'success',
      data: {
        health: {
          status: 'ONLINE',
          uptimeSeconds: Math.floor(process.uptime()),
          activeTenants,
          totalTenants,
          databaseStatus: 'CONNECTED',
        },
        recentLogins,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * List Super Admin Audit Logs
 */
export const getSuperAdminAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '25' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const searchStr = (search as string).trim();
      where.OR = [
        { action: { contains: searchStr } },
        { resource: { contains: searchStr } },
        { details: { contains: searchStr } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { profile: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      status: 'success',
      data: {
        logs,
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getSuperAdminDashboard,
  impersonateTenant,
  sendGlobalNotification,
  getSystemMonitoring,
  getSuperAdminAuditLogs,
};
