import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { isValidEmail, isValidPhone } from '../utils/validators';

// 1. Create Employee (User + Profile + EmployeeProfile)
export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, phone, role, department, notes } = req.body;

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'E-mail, nome, sobrenome e cargo no portal são obrigatórios',
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Formato de e-mail inválido' });
    }
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ status: 'error', message: 'Telefone inválido' });
    }

    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ status: 'error', message: 'E-mail já cadastrado' });
    }

    // Role check - must be STAFF, FINANCEIRO or DIRETOR
    if (!['STAFF', 'FINANCEIRO', 'DIRETOR'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cargo no portal inválido para funcionários (STAFF, FINANCEIRO, DIRETOR)',
      });
    }

    const defaultPassword = await bcrypt.hash('123456', 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: defaultPassword,
          role,
          isActive: true,
          profile: {
            create: {
              firstName,
              lastName,
              phone: phone || null,
            },
          },
          employeeProfile: {
            create: {
              department: department || null,
              notes: notes || null,
            },
          },
        },
      });
      return user;
    });

    return res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// 2. Update Employee
export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, role, department, notes } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      return res.status(404).json({ status: 'error', message: 'Funcionário não encontrado' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Formato de e-mail inválido' });
    }
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ status: 'error', message: 'Telefone inválido' });
    }

    if (email && email !== employee.user.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res
          .status(400)
          .json({ status: 'error', message: 'E-mail já cadastrado para outro usuário' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update User
      await tx.user.update({
        where: { id: employee.userId },
        data: {
          email,
          role: role || employee.user.role,
          profile: {
            update: {
              firstName,
              lastName,
              phone: phone || null,
            },
          },
        },
      });

      // Update EmployeeProfile
      const updatedEmployee = await tx.employee.update({
        where: { id },
        data: {
          department: department || null,
          notes: notes || null,
        },
      });

      return updatedEmployee;
    });

    return res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};

// 3. Delete Employee
export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return res.status(404).json({ status: 'error', message: 'Funcionário não encontrado' });
    }

    // Cascade delete via User
    await prisma.user.delete({
      where: { id: employee.userId },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Funcionário excluído com sucesso',
    });
  } catch (error) {
    return next(error);
  }
};

// 4. List Employees
export const listEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { department: { contains: searchStr } },
        {
          user: {
            OR: [
              { email: { contains: searchStr } },
              {
                profile: {
                  OR: [
                    { firstName: { contains: searchStr } },
                    { lastName: { contains: searchStr } },
                  ],
                },
              },
            ],
          },
        },
      ];
    }

    const [total, employees] = await prisma.$transaction([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        employees,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// 5. Get Employee Details
export const getEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ status: 'error', message: 'Funcionário não encontrado' });
    }

    return res.status(200).json({
      status: 'success',
      data: employee,
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listEmployees,
  getEmployee,
};
