import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { isValidEmail, isValidPhone } from '../utils/validators';

// 1. Create Guardian
export const createGuardian = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      phone,
      whatsapp,
      address,
      relationship,
      isFinancial,
      studentIds, // Array of student IDs to link
    } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Nome é obrigatório' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Formato de e-mail inválido' });
    }
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ status: 'error', message: 'Telefone inválido' });
    }
    if (whatsapp && !isValidPhone(whatsapp)) {
      return res.status(400).json({ status: 'error', message: 'WhatsApp inválido' });
    }

    if (email) {
      const emailExists = await prisma.guardian.findUnique({ where: { email } });
      if (emailExists) {
        return res
          .status(400)
          .json({ status: 'error', message: 'E-mail do responsável já cadastrado' });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create guardian
      const guardian = await tx.guardian.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          address: address || null,
          relationship: relationship || null,
          isFinancial: isFinancial || false,
        },
      });

      // Link to students if provided
      if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
        const linkPromises = studentIds.map((studentId) =>
          tx.studentGuardian.create({
            data: {
              studentId,
              guardianId: guardian.id,
            },
          })
        );
        await Promise.all(linkPromises);

        // Add history logs to linked students
        const logPromises = studentIds.map((studentId) =>
          tx.studentHistory.create({
            data: {
              studentId,
              action: 'ALTERACAO_DADOS',
              details: `Responsável "${name}" (${relationship || 'Responsável'}) vinculado ao aluno por ${req.user?.email || 'Sistema'}.`,
            },
          })
        );
        await Promise.all(logPromises);
      }

      return guardian;
    });

    return res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// 2. Update Guardian
export const updateGuardian = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      whatsapp,
      address,
      relationship,
      isFinancial,
      studentIds, // Array of new student IDs to link (replaces existing links)
    } = req.body;

    const guardian = await prisma.guardian.findUnique({ where: { id } });
    if (!guardian) {
      return res.status(404).json({ status: 'error', message: 'Responsável não encontrado' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ status: 'error', message: 'Formato de e-mail inválido' });
    }
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ status: 'error', message: 'Telefone inválido' });
    }
    if (whatsapp && !isValidPhone(whatsapp)) {
      return res.status(400).json({ status: 'error', message: 'WhatsApp inválido' });
    }

    if (email && email !== guardian.email) {
      const emailExists = await prisma.guardian.findUnique({ where: { email } });
      if (emailExists) {
        return res
          .status(400)
          .json({ status: 'error', message: 'E-mail do responsável já cadastrado' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update guardian details
      const updatedGuardian = await tx.guardian.update({
        where: { id },
        data: {
          name,
          email: email || null,
          phone: phone || null,
          whatsapp: whatsapp || null,
          address: address || null,
          relationship: relationship || null,
          isFinancial: isFinancial !== undefined ? isFinancial : guardian.isFinancial,
        },
      });

      // Update student associations if provided
      if (studentIds && Array.isArray(studentIds)) {
        // Find existing linked student IDs
        const existingLinks = await tx.studentGuardian.findMany({
          where: { guardianId: id },
        });
        const existingStudentIds = existingLinks.map((l) => l.studentId);

        // Delete removed links
        const toDelete = existingStudentIds.filter((sid) => !studentIds.includes(sid));
        if (toDelete.length > 0) {
          await tx.studentGuardian.deleteMany({
            where: {
              guardianId: id,
              studentId: { in: toDelete },
            },
          });

          // Log history of removal
          const logDeletes = toDelete.map((studentId) =>
            tx.studentHistory.create({
              data: {
                studentId,
                action: 'ALTERACAO_DADOS',
                details: `Vínculo com responsável "${name}" removido por ${req.user?.email || 'Sistema'}.`,
              },
            })
          );
          await Promise.all(logDeletes);
        }

        // Add new links
        const toAdd = studentIds.filter((sid) => !existingStudentIds.includes(sid));
        if (toAdd.length > 0) {
          const addPromises = toAdd.map((studentId) =>
            tx.studentGuardian.create({
              data: {
                studentId,
                guardianId: id,
              },
            })
          );
          await Promise.all(addPromises);

          // Log history of addition
          const logAdds = toAdd.map((studentId) =>
            tx.studentHistory.create({
              data: {
                studentId,
                action: 'ALTERACAO_DADOS',
                details: `Responsável "${name}" (${relationship || 'Responsável'}) vinculado ao aluno por ${req.user?.email || 'Sistema'}.`,
              },
            })
          );
          await Promise.all(logAdds);
        }
      }

      return updatedGuardian;
    });

    return res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};

// 3. Delete Guardian
export const deleteGuardian = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const guardian = await prisma.guardian.findUnique({
      where: { id },
    });

    if (!guardian) {
      return res.status(404).json({ status: 'error', message: 'Responsável não encontrado' });
    }

    // Delete guardian (cascades to StudentGuardian and optionally cleans User link if SetNull)
    await prisma.guardian.delete({
      where: { id },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Responsável excluído com sucesso',
    });
  } catch (error) {
    return next(error);
  }
};

// 4. List Guardians with filters and pagination
export const listGuardians = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, relationship, isFinancial, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const searchStr = search as string;
      where.OR = [
        { name: { contains: searchStr } },
        { email: { contains: searchStr } },
        { phone: { contains: searchStr } },
        { whatsapp: { contains: searchStr } },
      ];
    }

    if (relationship) {
      where.relationship = relationship as string;
    }

    if (isFinancial !== undefined) {
      where.isFinancial = isFinancial === 'true';
    }

    const [total, guardians] = await prisma.$transaction([
      prisma.guardian.count({ where }),
      prisma.guardian.findMany({
        where,
        include: {
          students: {
            include: {
              student: {
                include: {
                  user: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
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
        guardians,
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

// 5. Get Guardian Details
export const getGuardian = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const guardian = await prisma.guardian.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            student: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      return res.status(404).json({ status: 'error', message: 'Responsável não encontrado' });
    }

    return res.status(200).json({
      status: 'success',
      data: guardian,
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  createGuardian,
  updateGuardian,
  deleteGuardian,
  listGuardians,
  getGuardian,
};
