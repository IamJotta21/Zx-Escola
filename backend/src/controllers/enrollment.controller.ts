import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// 1. Execute Academic Process (Matrícula, Rematrícula, Transferência, Cancelamento, Lista de Espera)
export const executeProcess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      studentId,
      status, // LISTA_DE_ESPERA, MATRICULADO, REMATRICULADO, TRANSFERIDO, CANCELADO
      schoolYear, // e.g. "2026", "2027"
      destinationSchool, // String (Only for TRANSFERIDO)
      reason, // String (Only for CANCELADO / TRANSFERIDO)
      notes, // String (Optional)
    } = req.body;

    if (!studentId || !status || !schoolYear) {
      return res.status(400).json({
        status: 'error',
        message: 'Código do Aluno, Situação Acadêmica e Ano Letivo são obrigatórios',
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Aluno não encontrado' });
    }

    // Set readable action labels for logs
    const statusLabels: Record<string, string> = {
      LISTA_DE_ESPERA: 'Inserção em Lista de Espera',
      MATRICULADO: 'Matrícula Efetivada',
      REMATRICULADO: 'Rematrícula Efetuada',
      TRANSFERIDO: 'Transferência Escolar',
      CANCELADO: 'Cancelamento de Matrícula',
    };

    const processLabel = statusLabels[status] || status;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Student status
      await tx.student.update({
        where: { id: studentId },
        data: {
          status,
          // If cancelling or transferring, we deactivate the system user account
          user: {
            update: {
              isActive: ['MATRICULADO', 'REMATRICULADO', 'LISTA_DE_ESPERA'].includes(status),
            },
          },
        },
      });

      // 2. Create Enrollment process record
      const enrollment = await tx.enrollment.create({
        data: {
          studentId,
          status,
          schoolYear,
          destinationSchool: status === 'TRANSFERIDO' ? destinationSchool : null,
          reason: ['TRANSFERIDO', 'CANCELADO'].includes(status) ? reason : null,
          notes: notes || null,
        },
      });

      // 3. Create Student History entry
      let detailLog = `${processLabel} no ano letivo ${schoolYear} por ${req.user?.email || 'Sistema'}.`;
      if (status === 'TRANSFERIDO' && destinationSchool) {
        detailLog += ` Destino: ${destinationSchool}.`;
      }
      if (reason) {
        detailLog += ` Motivo: ${reason}.`;
      }
      if (notes) {
        detailLog += ` Obs: ${notes}.`;
      }

      await tx.studentHistory.create({
        data: {
          studentId,
          action: status, // Matches enum-style actions
          details: detailLog,
        },
      });

      return enrollment;
    });

    return res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// 2. List Academic Processes History
export const listEnrollments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, schoolYear, studentId, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status as string;
    }
    if (schoolYear) {
      where.schoolYear = schoolYear as string;
    }
    if (studentId) {
      where.studentId = studentId as string;
    }

    const [total, enrollments] = await prisma.$transaction([
      prisma.enrollment.count({ where }),
      prisma.enrollment.findMany({
        where,
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
        enrollments,
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

export default {
  executeProcess,
  listEnrollments,
};
