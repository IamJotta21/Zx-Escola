import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createAuditLog } from '../utils/audit.utils';

export const FULL_PERMISSIONS = {
  dashboard: ['view'],
  students: ['view', 'create', 'edit', 'delete', 'export', 'import'],
  teachers: ['view', 'create', 'edit', 'delete'],
  employees: ['view', 'create', 'edit', 'delete'],
  guardians: ['view', 'create', 'edit', 'delete'],
  classes: ['view', 'create', 'edit', 'delete'],
  financial: ['view', 'receive', 'cancel', 'bill', 'export'],
  library: ['view', 'lend', 'return', 'create_book', 'delete_book'],
  secretary: ['view', 'issue_docs', 'edit_records', 'import', 'export'],
  communication: ['view', 'send', 'edit', 'delete'],
  reports: ['view', 'export_pdf', 'export_excel'],
  aiAssistant: ['use', 'manage'],
  imports: ['view', 'execute'],
  exports: ['view', 'execute'],
  migration: ['view', 'execute'],
  settings: ['view', 'edit'],
};

/**
 * Seed the 12 Default Roles in the system
 */
export const ensureDefaultRoles = async () => {
  try {
    const count = await prisma.roleProfile.count({ where: { isSystemDefault: true } });
    if (count === 0) {
      const defaultRolesData = [
        { name: 'Super Administrador', description: 'Acesso total e irrestrito a toda a plataforma SaaS.', isSystemDefault: true, permissions: JSON.stringify(FULL_PERMISSIONS) },
        { name: 'Administrador Escolar', description: 'Gestão completa das operações e módulos da instituição.', isSystemDefault: true, permissions: JSON.stringify(FULL_PERMISSIONS) },
        { name: 'Diretor', description: 'Visão executiva, relatórios, cadastros e aprovações acadêmicas.', isSystemDefault: true, permissions: JSON.stringify(FULL_PERMISSIONS) },
        { name: 'Vice-Diretor', description: 'Auxílio na gestão escolar e supervisão pedagógica.', isSystemDefault: true, permissions: JSON.stringify(FULL_PERMISSIONS) },
        { name: 'Coordenador Pedagógico', description: 'Gestão de turmas, professores, horários e diários de classe.', isSystemDefault: true, permissions: JSON.stringify({ ...FULL_PERMISSIONS, financial: ['view'] }) },
        { name: 'Secretaria', description: 'Matrículas, emissão de documentos, acervo e histórico.', isSystemDefault: true, permissions: JSON.stringify({ ...FULL_PERMISSIONS, financial: ['view'] }) },
        { name: 'Financeiro', description: 'Gestão de mensalidades, cobranças, baixas e relatórios contábeis.', isSystemDefault: true, permissions: JSON.stringify({ dashboard: ['view'], financial: ['view', 'receive', 'cancel', 'bill', 'export'], reports: ['view', 'export_excel'] }) },
        { name: 'Professor', description: 'Lançamento de notas, frequência, materiais e boletins.', isSystemDefault: true, permissions: JSON.stringify({ dashboard: ['view'], classes: ['view', 'edit'], communication: ['view', 'send'] }) },
        { name: 'Bibliotecário', description: 'Gestão do acervo de livros, empréstimos e devoluções.', isSystemDefault: true, permissions: JSON.stringify({ dashboard: ['view'], library: ['view', 'lend', 'return', 'create_book', 'delete_book'] }) },
        { name: 'Funcionário', description: 'Acesso administrativo básico e atendimento.', isSystemDefault: true, permissions: JSON.stringify({ dashboard: ['view'], communication: ['view'] }) },
        { name: 'Responsável', description: 'Acompanhamento de boletins, frequência e boletos dos dependentes.', isSystemDefault: true, permissions: JSON.stringify({ dashboard: ['view'], communication: ['view'] }) },
        { name: 'Aluno', description: 'Consulta a horários, notas, frequência e comunicados.', isSystemDefault: true, permissions: JSON.stringify({ dashboard: ['view'], communication: ['view'] }) },
      ];

      for (const roleData of defaultRolesData) {
        await prisma.roleProfile.create({ data: roleData });
      }
    }
  } catch (err) {
    console.error('Erro ao inicializar perfis padrão RBAC:', err);
  }
};

/**
 * List all Roles (System Defaults + Tenant Specific Custom Roles)
 */
export const listRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDefaultRoles();
    const tenantId = req.tenantId;

    const roles = await prisma.roleProfile.findMany({
      where: {
        OR: [
          { isSystemDefault: true },
          { tenantId: tenantId || null },
          { tenantId: null },
        ],
      },
      orderBy: [{ isSystemDefault: 'desc' }, { name: 'asc' }],
    });

    return res.json({ status: 'success', data: roles });
  } catch (err) {
    return next(err);
  }
};

/**
 * Create Custom Role Profile
 */
export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Nome do perfil é obrigatório' });
    }

    const role = await prisma.roleProfile.create({
      data: {
        name,
        description: description || null,
        isSystemDefault: false,
        isActive: true,
        tenantId: req.tenantId || null,
        permissions: permissions ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : JSON.stringify(FULL_PERMISSIONS),
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'CREATE_ROLE',
      resource: 'RoleProfile',
      details: `Criado novo perfil RBAC: ${role.name}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ status: 'success', data: role });
  } catch (err) {
    return next(err);
  }
};

/**
 * Update Role Profile
 */
export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, permissions } = req.body;

    const existing = await prisma.roleProfile.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Perfil não encontrado' });
    }

    const updated = await prisma.roleProfile.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description !== undefined ? description : existing.description,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        permissions: permissions !== undefined ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : existing.permissions,
      },
    });

    await createAuditLog({
      userId: req.user?.id,
      action: 'UPDATE_ROLE',
      resource: 'RoleProfile',
      details: `Atualizado perfil RBAC: ${updated.name}`,
      ipAddress: req.ip,
    });

    return res.json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

/**
 * Duplicate Role Profile
 */
export const duplicateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.roleProfile.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Perfil não encontrado' });
    }

    const cloned = await prisma.roleProfile.create({
      data: {
        name: `${existing.name} (Cópia)`,
        description: existing.description,
        isSystemDefault: false,
        isActive: true,
        tenantId: req.tenantId || null,
        permissions: existing.permissions,
      },
    });

    return res.status(201).json({ status: 'success', data: cloned });
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete Custom Role Profile
 */
export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = await prisma.roleProfile.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Perfil não encontrado' });
    }

    if (existing.isSystemDefault) {
      return res.status(400).json({ status: 'error', message: 'Perfis padrão do sistema não podem ser excluídos' });
    }

    await prisma.roleProfile.delete({ where: { id } });

    await createAuditLog({
      userId: req.user?.id,
      action: 'DELETE_ROLE',
      resource: 'RoleProfile',
      details: `Excluído perfil RBAC: ${existing.name}`,
      ipAddress: req.ip,
    });

    return res.json({ status: 'success', message: 'Perfil excluído com sucesso' });
  } catch (err) {
    return next(err);
  }
};

export default {
  listRoles,
  createRole,
  updateRole,
  duplicateRole,
  deleteRole,
};
