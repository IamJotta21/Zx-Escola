import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createAuditLog } from '../utils/audit.utils';

export const DEFAULT_MODULES = {
  dashboard: true,
  financial: true,
  library: true,
  documents: true,
  communication: true,
  teacherPortal: true,
  studentPortal: true,
  parentPortal: true,
  reports: true,
  aiAssistant: true,
  imports: true,
  exports: true,
  migration: true,
  api: true,
  audit: true,
};

/**
 * Seed default plans if none exist
 */
export const ensureDefaultPlans = async () => {
  try {
    const count = await prisma.plan.count();
    if (count === 0) {
      await prisma.plan.createMany({
        data: [
          {
            name: 'Plano Basic',
            description: 'Ideal para pequenas escolas e creches em fase de expansão.',
            monthlyPrice: 199.0,
            yearlyPrice: 1990.0,
            trialDays: 14,
            sortOrder: 1,
            maxStudents: 150,
            maxTeachers: 15,
            maxEmployees: 10,
            maxGuardians: 300,
            maxUsers: 50,
            maxStorageMb: 2048,
            modules: JSON.stringify(DEFAULT_MODULES),
          },
          {
            name: 'Plano Pro',
            description: 'Para escolas de médio porte com gestão acadêmica e financeira avançadas.',
            monthlyPrice: 499.0,
            yearlyPrice: 4990.0,
            trialDays: 14,
            sortOrder: 2,
            maxStudents: 500,
            maxTeachers: 50,
            maxEmployees: 30,
            maxGuardians: 1000,
            maxUsers: 150,
            maxStorageMb: 10240,
            modules: JSON.stringify(DEFAULT_MODULES),
          },
          {
            name: 'Plano Enterprise',
            description: 'Sem limites para grandes redes e grupos educacionais.',
            monthlyPrice: 999.0,
            yearlyPrice: 9990.0,
            trialDays: 30,
            sortOrder: 3,
            maxStudents: null,
            maxTeachers: null,
            maxEmployees: null,
            maxGuardians: null,
            maxUsers: null,
            maxStorageMb: null,
            modules: JSON.stringify(DEFAULT_MODULES),
          },
        ],
      });
    }
  } catch (err) {
    console.error('Erro ao inicializar planos padrão:', err);
  }
};

/**
 * List all Plans
 */
export const listPlans = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDefaultPlans();
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return res.json({ status: 'success', data: plans });
  } catch (err) {
    return next(err);
  }
};

/**
 * Create a new Plan
 */
export const createPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      monthlyPrice,
      yearlyPrice,
      trialDays,
      sortOrder,
      maxStudents,
      maxTeachers,
      maxEmployees,
      maxGuardians,
      maxUsers,
      maxStorageMb,
      modules,
    } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Nome do plano é obrigatório' });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description: description || null,
        monthlyPrice: parseFloat(monthlyPrice || 0),
        yearlyPrice: parseFloat(yearlyPrice || 0),
        trialDays: parseInt(trialDays || 14),
        sortOrder: parseInt(sortOrder || 1),
        maxStudents: maxStudents !== undefined && maxStudents !== null && maxStudents !== '' ? parseInt(maxStudents) : null,
        maxTeachers: maxTeachers !== undefined && maxTeachers !== null && maxTeachers !== '' ? parseInt(maxTeachers) : null,
        maxEmployees: maxEmployees !== undefined && maxEmployees !== null && maxEmployees !== '' ? parseInt(maxEmployees) : null,
        maxGuardians: maxGuardians !== undefined && maxGuardians !== null && maxGuardians !== '' ? parseInt(maxGuardians) : null,
        maxUsers: maxUsers !== undefined && maxUsers !== null && maxUsers !== '' ? parseInt(maxUsers) : null,
        maxStorageMb: maxStorageMb !== undefined && maxStorageMb !== null && maxStorageMb !== '' ? parseInt(maxStorageMb) : null,
        modules: modules ? (typeof modules === 'string' ? modules : JSON.stringify(modules)) : JSON.stringify(DEFAULT_MODULES),
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE_PLAN',
      resource: 'Plan',
      details: `Criado novo plano SaaS: ${plan.name}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ status: 'success', data: plan });
  } catch (err) {
    return next(err);
  }
};

/**
 * Update a Plan
 */
export const updatePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Plano não encontrado' });
    }

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        monthlyPrice: body.monthlyPrice !== undefined ? parseFloat(body.monthlyPrice) : existing.monthlyPrice,
        yearlyPrice: body.yearlyPrice !== undefined ? parseFloat(body.yearlyPrice) : existing.yearlyPrice,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        trialDays: body.trialDays !== undefined ? parseInt(body.trialDays) : existing.trialDays,
        sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder) : existing.sortOrder,
        maxStudents: body.maxStudents !== undefined ? (body.maxStudents === null || body.maxStudents === '' ? null : parseInt(body.maxStudents)) : existing.maxStudents,
        maxTeachers: body.maxTeachers !== undefined ? (body.maxTeachers === null || body.maxTeachers === '' ? null : parseInt(body.maxTeachers)) : existing.maxTeachers,
        maxEmployees: body.maxEmployees !== undefined ? (body.maxEmployees === null || body.maxEmployees === '' ? null : parseInt(body.maxEmployees)) : existing.maxEmployees,
        maxGuardians: body.maxGuardians !== undefined ? (body.maxGuardians === null || body.maxGuardians === '' ? null : parseInt(body.maxGuardians)) : existing.maxGuardians,
        maxUsers: body.maxUsers !== undefined ? (body.maxUsers === null || body.maxUsers === '' ? null : parseInt(body.maxUsers)) : existing.maxUsers,
        maxStorageMb: body.maxStorageMb !== undefined ? (body.maxStorageMb === null || body.maxStorageMb === '' ? null : parseInt(body.maxStorageMb)) : existing.maxStorageMb,
        modules: body.modules !== undefined ? (typeof body.modules === 'string' ? body.modules : JSON.stringify(body.modules)) : existing.modules,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE_PLAN',
      resource: 'Plan',
      details: `Atualizado plano SaaS: ${updated.name}`,
      ipAddress: req.ip,
    });

    return res.json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

/**
 * Duplicate a Plan
 */
export const duplicatePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Plano não encontrado' });
    }

    const cloned = await prisma.plan.create({
      data: {
        name: `${existing.name} (Cópia)`,
        description: existing.description,
        monthlyPrice: existing.monthlyPrice,
        yearlyPrice: existing.yearlyPrice,
        isActive: existing.isActive,
        trialDays: existing.trialDays,
        sortOrder: existing.sortOrder + 1,
        maxStudents: existing.maxStudents,
        maxTeachers: existing.maxTeachers,
        maxEmployees: existing.maxEmployees,
        maxGuardians: existing.maxGuardians,
        maxUsers: existing.maxUsers,
        maxStorageMb: existing.maxStorageMb,
        modules: existing.modules,
      },
    });

    return res.status(201).json({ status: 'success', data: cloned });
  } catch (err) {
    return next(err);
  }
};

/**
 * List Subscriptions & History
 */
export const listSubscriptions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [subscriptions, history] = await Promise.all([
      prisma.subscription.findMany({
        include: {
          tenant: true,
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscriptionHistory.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      status: 'success',
      data: {
        subscriptions,
        history,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Assign / Switch Plan for a Tenant
 */
export const assignSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, planId, status = 'ACTIVE', paymentMethod = 'PIX' } = req.body;

    if (!tenantId || !planId) {
      return res.status(400).json({ status: 'error', message: 'ID da escola e do plano são obrigatórios' });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ status: 'error', message: 'Plano não encontrado' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ status: 'error', message: 'Escola não encontrada' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30-day billing period

    const subscription = await prisma.subscription.create({
      data: {
        tenantId,
        planId,
        price: plan.monthlyPrice,
        status,
        paymentMethod,
        dueDate,
      },
      include: { plan: true, tenant: true },
    });

    // Record Subscription History
    await prisma.subscriptionHistory.create({
      data: {
        tenantId,
        userId: req.user?.id,
        action: 'TROCA_PLANO',
        previousPlan: tenant.plan,
        newPlan: plan.name,
        details: `Plano alterado para ${plan.name} (Valor: R$ ${plan.monthlyPrice})`,
      },
    });

    // Update Tenant active plan name
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: plan.name },
    });

    return res.json({ status: 'success', data: subscription });
  } catch (err) {
    return next(err);
  }
};

export default {
  listPlans,
  createPlan,
  updatePlan,
  duplicatePlan,
  listSubscriptions,
  assignSubscription,
};
