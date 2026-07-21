import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// ─── Rooms Controller (CRUD) ──────────────────────────────────────────────────

export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, capacity } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Nome da sala é obrigatório' });
    }

    const nameExists = await prisma.room.findUnique({ where: { name } });
    if (nameExists) {
      return res.status(400).json({ status: 'error', message: 'Nome da sala já cadastrado' });
    }

    const room = await prisma.room.create({
      data: {
        name,
        capacity: capacity ? parseInt(capacity.toString()) : 30,
      },
    });

    return res.status(201).json({ status: 'success', data: room });
  } catch (error) {
    return next(error);
  }
};

export const updateRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, capacity } = req.body;

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      return res.status(404).json({ status: 'error', message: 'Sala não encontrada' });
    }

    if (name && name !== room.name) {
      const nameExists = await prisma.room.findUnique({ where: { name } });
      if (nameExists) {
        return res.status(400).json({ status: 'error', message: 'Nome da sala já cadastrado' });
      }
    }

    const updated = await prisma.room.update({
      where: { id },
      data: {
        name,
        capacity: capacity ? parseInt(capacity.toString()) : room.capacity,
      },
    });

    return res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    return next(error);
  }
};

export const deleteRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      return res.status(404).json({ status: 'error', message: 'Sala não encontrada' });
    }

    await prisma.room.delete({ where: { id } });

    return res.status(200).json({ status: 'success', message: 'Sala excluída com sucesso' });
  } catch (error) {
    return next(error);
  }
};

export const listRooms = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        classes: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ status: 'success', data: rooms });
  } catch (error) {
    return next(error);
  }
};

// ─── Classes Controller (CRUD) ─────────────────────────────────────────────────

export const createClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, gradeYear, schoolYear, roomId, teacherId } = req.body;

    if (!name || !gradeYear || !schoolYear) {
      return res.status(400).json({
        status: 'error',
        message: 'Nome da turma, série/ano e ano letivo são obrigatórios',
      });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        gradeYear,
        schoolYear,
        roomId: roomId || null,
        teacherId: teacherId || null,
      },
    });

    return res.status(201).json({ status: 'success', data: newClass });
  } catch (error) {
    return next(error);
  }
};

export const updateClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, gradeYear, schoolYear, roomId, teacherId } = req.body;

    const currentClass = await prisma.class.findUnique({ where: { id } });
    if (!currentClass) {
      return res.status(404).json({ status: 'error', message: 'Turma não encontrada' });
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        name,
        gradeYear,
        schoolYear,
        roomId: roomId !== undefined ? roomId : currentClass.roomId,
        teacherId: teacherId !== undefined ? teacherId : currentClass.teacherId,
      },
    });

    return res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    return next(error);
  }
};

export const deleteClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const currentClass = await prisma.class.findUnique({ where: { id } });
    if (!currentClass) {
      return res.status(404).json({ status: 'error', message: 'Turma não encontrada' });
    }

    await prisma.class.delete({ where: { id } });

    return res.status(200).json({ status: 'success', message: 'Turma excluída com sucesso' });
  } catch (error) {
    return next(error);
  }
};

export const listClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schoolYear } = req.query;
    const where: any = {};

    if (schoolYear) {
      where.schoolYear = schoolYear as string;
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        room: true,
        teacher: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        students: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ status: 'success', data: classes });
  } catch (error) {
    return next(error);
  }
};

export const getClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const currentClass = await prisma.class.findUnique({
      where: { id },
      include: {
        room: true,
        teacher: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        students: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!currentClass) {
      return res.status(404).json({ status: 'error', message: 'Turma não encontrada' });
    }

    return res.status(200).json({ status: 'success', data: currentClass });
  } catch (error) {
    return next(error);
  }
};

// ─── Student Class Allocation Relationship ─────────────────────────────────────

export const associateStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;
    const { studentIds } = req.body; // Array of student UUIDs to allocate

    if (!Array.isArray(studentIds)) {
      return res
        .status(400)
        .json({ status: 'error', message: 'studentIds deve ser um array de strings' });
    }

    const currentClass = await prisma.class.findUnique({ where: { id: classId } });
    if (!currentClass) {
      return res.status(404).json({ status: 'error', message: 'Turma não encontrada' });
    }

    await prisma.$transaction(async (tx) => {
      // Find students currently in the class
      const currentStudents = await tx.student.findMany({
        where: { classId },
      });
      const currentIds = currentStudents.map((s) => s.id);

      // Remove students not in the new studentIds list
      const toRemove = currentIds.filter((id) => !studentIds.includes(id));
      if (toRemove.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: toRemove } },
          data: { classId: null },
        });

        // Add history log for removals
        const removeLogPromises = toRemove.map((studentId) =>
          tx.studentHistory.create({
            data: {
              studentId,
              action: 'ALTERACAO_DADOS',
              details: `Removido da turma "${currentClass.name}" por ${req.user?.email || 'Sistema'}.`,
            },
          })
        );
        await Promise.all(removeLogPromises);
      }

      // Add new students to the class
      const toAdd = studentIds.filter((id) => !currentIds.includes(id));
      if (toAdd.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: toAdd } },
          data: { classId },
        });

        // Add history log for additions
        const addLogPromises = toAdd.map((studentId) =>
          tx.studentHistory.create({
            data: {
              studentId,
              action: 'ALTERACAO_DADOS',
              details: `Alocado na turma "${currentClass.name}" por ${req.user?.email || 'Sistema'}.`,
            },
          })
        );
        await Promise.all(addLogPromises);
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Vínculo de alunos com turma atualizado com sucesso',
    });
  } catch (error) {
    return next(error);
  }
};
export default {
  createRoom,
  updateRoom,
  deleteRoom,
  listRooms,
  createClass,
  updateClass,
  deleteClass,
  listClasses,
  getClass,
  associateStudents,
};
