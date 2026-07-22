import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { isValidEmail, isValidCPF, isValidCEP, isValidPhone } from '../utils/validators';

/**
 * List all school tenants with search and filters (ADMIN / DIRETOR)
 */
export const listTenants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, plan, search } = req.query;
    const where: any = {};

    if (status) {
      where.status = status as string;
    }

    if (plan) {
      where.plan = plan as string;
    }

    if (search) {
      const searchStr = (search as string).trim();
      where.OR = [
        { name: { contains: searchStr } },
        { tradeName: { contains: searchStr } },
        { cnpj: { contains: searchStr } },
        { city: { contains: searchStr } },
        { state: { contains: searchStr } },
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            teachers: true,
            classes: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ status: 'success', data: tenants });
  } catch (err) {
    return next(err);
  }
};

/**
 * Get current tenant details with configuration
 */
export const getCurrentTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || 'escola-matriz-default-id';
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            teachers: true,
            classes: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ status: 'error', message: 'Tenant não encontrado' });
    }

    return res.json({ status: 'success', data: tenant });
  } catch (err) {
    return next(err);
  }
};

/**
 * Create a new school tenant with full settings
 */
export const createTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      tradeName,
      cnpj,
      stateRegistration,
      cityRegistration,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      phone,
      whatsapp,
      email,
      website,
      legalName,
      legalCpf,
      legalRole,
      legalEmail,
      legalPhone,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      academicYear,
      gradingSystem,
      minPassingGrade,
      minAttendance,
      periodType,
      currency,
      defaultDueDay,
      defaultInterest,
      defaultFine,
      status = 'ACTIVE',
      plan = 'BASIC',
    } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Nome da escola/tenant é obrigatório' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'E-mail de contato inválido' });
    }

    if (legalEmail && !isValidEmail(legalEmail)) {
      return res.status(400).json({ status: 'error', message: 'E-mail do responsável legal inválido' });
    }

    if (legalCpf && !isValidCPF(legalCpf)) {
      return res.status(400).json({ status: 'error', message: 'CPF do responsável legal inválido' });
    }

    if (cep && !isValidCEP(cep)) {
      return res.status(400).json({ status: 'error', message: 'CEP inválido' });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ status: 'error', message: 'Telefone de contato inválido' });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        tradeName: tradeName || null,
        cnpj: cnpj || null,
        stateRegistration: stateRegistration || null,
        cityRegistration: cityRegistration || null,
        cep: cep || null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        website: website || null,
        legalName: legalName || null,
        legalCpf: legalCpf || null,
        legalRole: legalRole || null,
        legalEmail: legalEmail || null,
        legalPhone: legalPhone || null,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#1e293b',
        academicYear: academicYear || '2026',
        gradingSystem: gradingSystem || 'DECIMAL_0_10',
        minPassingGrade: minPassingGrade ? parseFloat(minPassingGrade) : 6.0,
        minAttendance: minAttendance ? parseFloat(minAttendance) : 75.0,
        periodType: periodType || 'BIMESTRE',
        currency: currency || 'BRL',
        defaultDueDay: defaultDueDay ? parseInt(defaultDueDay) : 10,
        defaultInterest: defaultInterest ? parseFloat(defaultInterest) : 1.0,
        defaultFine: defaultFine ? parseFloat(defaultFine) : 2.0,
        status,
        plan,
      },
    });

    return res.status(201).json({ status: 'success', data: tenant });
  } catch (err) {
    return next(err);
  }
};

/**
 * Update a school tenant
 */
export const updateTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Tenant não encontrado' });
    }

    if (body.email && !isValidEmail(body.email)) {
      return res.status(400).json({ status: 'error', message: 'E-mail de contato inválido' });
    }

    if (body.legalEmail && !isValidEmail(body.legalEmail)) {
      return res.status(400).json({ status: 'error', message: 'E-mail do responsável legal inválido' });
    }

    if (body.legalCpf && !isValidCPF(body.legalCpf)) {
      return res.status(400).json({ status: 'error', message: 'CPF do responsável legal inválido' });
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        tradeName: body.tradeName !== undefined ? body.tradeName : existing.tradeName,
        cnpj: body.cnpj !== undefined ? body.cnpj : existing.cnpj,
        stateRegistration: body.stateRegistration !== undefined ? body.stateRegistration : existing.stateRegistration,
        cityRegistration: body.cityRegistration !== undefined ? body.cityRegistration : existing.cityRegistration,
        cep: body.cep !== undefined ? body.cep : existing.cep,
        street: body.street !== undefined ? body.street : existing.street,
        number: body.number !== undefined ? body.number : existing.number,
        complement: body.complement !== undefined ? body.complement : existing.complement,
        neighborhood: body.neighborhood !== undefined ? body.neighborhood : existing.neighborhood,
        city: body.city !== undefined ? body.city : existing.city,
        state: body.state !== undefined ? body.state : existing.state,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        whatsapp: body.whatsapp !== undefined ? body.whatsapp : existing.whatsapp,
        email: body.email !== undefined ? body.email : existing.email,
        website: body.website !== undefined ? body.website : existing.website,
        legalName: body.legalName !== undefined ? body.legalName : existing.legalName,
        legalCpf: body.legalCpf !== undefined ? body.legalCpf : existing.legalCpf,
        legalRole: body.legalRole !== undefined ? body.legalRole : existing.legalRole,
        legalEmail: body.legalEmail !== undefined ? body.legalEmail : existing.legalEmail,
        legalPhone: body.legalPhone !== undefined ? body.legalPhone : existing.legalPhone,
        logoUrl: body.logoUrl !== undefined ? body.logoUrl : existing.logoUrl,
        faviconUrl: body.faviconUrl !== undefined ? body.faviconUrl : existing.faviconUrl,
        primaryColor: body.primaryColor !== undefined ? body.primaryColor : existing.primaryColor,
        secondaryColor: body.secondaryColor !== undefined ? body.secondaryColor : existing.secondaryColor,
        academicYear: body.academicYear !== undefined ? body.academicYear : existing.academicYear,
        gradingSystem: body.gradingSystem !== undefined ? body.gradingSystem : existing.gradingSystem,
        minPassingGrade: body.minPassingGrade !== undefined ? parseFloat(body.minPassingGrade) : existing.minPassingGrade,
        minAttendance: body.minAttendance !== undefined ? parseFloat(body.minAttendance) : existing.minAttendance,
        periodType: body.periodType !== undefined ? body.periodType : existing.periodType,
        currency: body.currency !== undefined ? body.currency : existing.currency,
        defaultDueDay: body.defaultDueDay !== undefined ? parseInt(body.defaultDueDay) : existing.defaultDueDay,
        defaultInterest: body.defaultInterest !== undefined ? parseFloat(body.defaultInterest) : existing.defaultInterest,
        defaultFine: body.defaultFine !== undefined ? parseFloat(body.defaultFine) : existing.defaultFine,
        status: body.status !== undefined ? body.status : existing.status,
        plan: body.plan !== undefined ? body.plan : existing.plan,
      },
    });

    return res.json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

export default {
  listTenants,
  getCurrentTenant,
  createTenant,
  updateTenant,
};
