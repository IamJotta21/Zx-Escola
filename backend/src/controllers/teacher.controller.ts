import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { isValidEmail, isValidPhone } from '../utils/validators';

// 1. Create Teacher (User + Profile + TeacherProfile)
export const createTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, phone, subjects, workload, schedule } = req.body;

    if (!email || !firstName || !lastName) {
      return res
        .status(400)
        .json({ status: 'error', message: 'E-mail, nome e sobrenome são obrigatórios' });
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

    const defaultPassword = await bcrypt.hash('123456', 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: defaultPassword,
          role: 'TEACHER',
          isActive: true,
          profile: {
            create: {
              firstName,
              lastName,
              phone: phone || null,
            },
          },
          teacherProfile: {
            create: {
              subjects: subjects || null,
              workload: workload ? parseInt(workload.toString()) : 20,
              schedule: schedule || null,
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

// 2. Update Teacher
export const updateTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // Teacher's model UUID
    const { email, firstName, lastName, phone, subjects, workload, schedule } = req.body;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) {
      return res.status(404).json({ status: 'error', message: 'Professor não encontrado' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Formato de e-mail inválido' });
    }
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ status: 'error', message: 'Telefone inválido' });
    }

    if (email && email !== teacher.user.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res
          .status(400)
          .json({ status: 'error', message: 'E-mail já cadastrado para outro usuário' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update basic user/profile
      await tx.user.update({
        where: { id: teacher.userId },
        data: {
          email,
          profile: {
            update: {
              firstName,
              lastName,
              phone: phone || null,
            },
          },
        },
      });

      // Update teacher profile details
      const updatedTeacher = await tx.teacher.update({
        where: { id },
        data: {
          subjects: subjects || null,
          workload: workload ? parseInt(workload.toString()) : teacher.workload,
          schedule: schedule || null,
        },
      });

      return updatedTeacher;
    });

    return res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};

// 3. Delete Teacher
export const deleteTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({ where: { id } });
    if (!teacher) {
      return res.status(404).json({ status: 'error', message: 'Professor não encontrado' });
    }

    // Deleting the associated User cascades deletion to Teacher, Profile, etc.
    await prisma.user.delete({
      where: { id: teacher.userId },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Professor excluído com sucesso',
    });
  } catch (error) {
    return next(error);
  }
};

// 4. List Teachers
export const listTeachers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { subjects: { contains: searchStr } },
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

    const [total, teachers] = await prisma.$transaction([
      prisma.teacher.count({ where }),
      prisma.teacher.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          classes: true,
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
        teachers,
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

// 5. Get Teacher Details
export const getTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        classes: {
          include: {
            room: true,
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ status: 'error', message: 'Professor não encontrado' });
    }

    return res.status(200).json({
      status: 'success',
      data: teacher,
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  createTeacher,
  updateTeacher,
  deleteTeacher,
  listTeachers,
  getTeacher,
};
