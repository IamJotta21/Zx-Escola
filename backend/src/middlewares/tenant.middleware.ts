import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const DEFAULT_TENANT_ID = 'escola-matriz-default-id';
export const DEFAULT_TENANT_NAME = 'Escola Matriz Zx-Escola';

/**
 * Ensures the Default School Tenant exists in the database.
 */
import bcrypt from 'bcryptjs';

export const ensureDefaultTenant = async () => {
  try {
    const existing = await prisma.tenant.findUnique({ where: { id: DEFAULT_TENANT_ID } });
    if (!existing) {
      await prisma.tenant.create({
        data: {
          id: DEFAULT_TENANT_ID,
          name: DEFAULT_TENANT_NAME,
          tradeName: 'Zx-Escola Matriz',
          cnpj: '00.000.000/0001-00',
          status: 'ACTIVE',
          plan: 'ENTERPRISE',
        },
      });
    }

    // Ensure default Super Admin account exists
    const superAdminEmail = 'superadmin@zxescola.com.br';
    const existingAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await prisma.user.create({
        data: {
          email: superAdminEmail,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
          tenantId: DEFAULT_TENANT_ID,
          profile: {
            create: {
              firstName: 'Super',
              lastName: 'Administrador SaaS',
            },
          },
        },
      });
    }
  } catch (err) {
    console.error('Erro ao verificar/criar Tenant/SuperAdmin padrão:', err);
  }
};

/**
 * Middleware that inspects req.tenantId and sets a fallback to DEFAULT_TENANT_ID if omitted.
 */
export const enforceTenant = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.tenantId) {
      if (req.user?.tenantId) {
        req.tenantId = req.user.tenantId;
      } else {
        const headerTenant = req.headers['x-tenant-id'] as string;
        req.tenantId = headerTenant || DEFAULT_TENANT_ID;
      }
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
