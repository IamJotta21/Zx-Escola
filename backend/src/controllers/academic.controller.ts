import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// ─── Attendance (Frequência) ──────────────────────────────────────────────────

export const saveAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, date, subject = 'Geral', records } = req.body;

    if (!classId || !date || !Array.isArray(records)) {
      return res.status(400).json({
        status: 'error',
        message: 'classId, date e records (array) são obrigatórios',
      });
    }

    const currentClass = await prisma.class.findUnique({
      where: { id: classId },
      include: { students: true },
    });

    if (!currentClass) {
      return res.status(404).json({ status: 'error', message: 'Turma não encontrada' });
    }

    await prisma.$transaction(async (tx) => {
      for (const record of records) {
        const { studentId, status } = record;

        // Upsert attendance
        const existing = await tx.attendance.findFirst({
          where: { classId, studentId, date },
        });

        if (existing) {
          await tx.attendance.update({
            where: { id: existing.id },
            data: { status },
          });
        } else {
          await tx.attendance.create({
            data: { classId, studentId, date, status },
          });
        }

        // Count total absences (FALTAs) for this student in this class
        const totalAbsences = await tx.attendance.count({
          where: { classId, studentId, status: 'FALTA' },
        });

        // Try to update their ReportCard absences
        const rc = await tx.reportCard.findFirst({
          where: { studentId, subject, schoolYear: currentClass.schoolYear },
        });

        if (rc) {
          await tx.reportCard.update({
            where: { id: rc.id },
            data: { absences: totalAbsences },
          });
        } else {
          await tx.reportCard.create({
            data: {
              studentId,
              subject,
              schoolYear: currentClass.schoolYear,
              absences: totalAbsences,
            },
          });
        }
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Frequência registrada com sucesso',
    });
  } catch (error) {
    return next(error);
  }
};

export const getAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, date } = req.query;

    if (!classId) {
      return res.status(400).json({ status: 'error', message: 'classId é obrigatório' });
    }

    const where: any = { classId: classId as string };
    if (date) {
      where.date = date as string;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ status: 'success', data: attendances });
  } catch (error) {
    return next(error);
  }
};

// ─── Class Content (Conteúdo Programático) ──────────────────────────────────────

export const saveContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, date, title, description } = req.body;

    if (!classId || !date || !title) {
      return res.status(400).json({
        status: 'error',
        message: 'classId, date e title são obrigatórios',
      });
    }

    const existing = await prisma.classContent.findFirst({
      where: { classId, date, title },
    });

    let content;
    if (existing) {
      content = await prisma.classContent.update({
        where: { id: existing.id },
        data: { description },
      });
    } else {
      content = await prisma.classContent.create({
        data: { classId, date, title, description },
      });
    }

    return res.status(200).json({ status: 'success', data: content });
  } catch (error) {
    return next(error);
  }
};

export const listContents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.query;

    if (!classId) {
      return res.status(400).json({ status: 'error', message: 'classId é obrigatório' });
    }

    const contents = await prisma.classContent.findMany({
      where: { classId: classId as string },
      orderBy: { date: 'desc' },
    });

    return res.status(200).json({ status: 'success', data: contents });
  } catch (error) {
    return next(error);
  }
};

// ─── Activities and Grades ─────────────────────────────────────────────────────

export const createActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, title, maxGrade, date } = req.body;

    if (!classId || !title || !date) {
      return res.status(400).json({
        status: 'error',
        message: 'classId, title e date são obrigatórios',
      });
    }

    const activity = await prisma.activity.create({
      data: {
        classId,
        title,
        maxGrade: maxGrade ? parseFloat(maxGrade.toString()) : 10.0,
        date,
      },
    });

    return res.status(201).json({ status: 'success', data: activity });
  } catch (error) {
    return next(error);
  }
};

export const deleteActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      return res.status(404).json({ status: 'error', message: 'Atividade não encontrada' });
    }

    await prisma.activity.delete({ where: { id } });

    return res.status(200).json({ status: 'success', message: 'Atividade excluída com sucesso' });
  } catch (error) {
    return next(error);
  }
};

export const listActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.query;

    if (!classId) {
      return res.status(400).json({ status: 'error', message: 'classId é obrigatório' });
    }

    const activities = await prisma.activity.findMany({
      where: { classId: classId as string },
      include: {
        grades: true,
      },
      orderBy: { date: 'desc' },
    });

    return res.status(200).json({ status: 'success', data: activities });
  } catch (error) {
    return next(error);
  }
};

export const saveActivityGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activityId, grades } = req.body;

    if (!activityId || !Array.isArray(grades)) {
      return res.status(400).json({
        status: 'error',
        message: 'activityId e grades (array) são obrigatórios',
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const grade of grades) {
        const { studentId, value } = grade;
        const parsedVal = parseFloat(value.toString());

        const existing = await tx.activityGrade.findFirst({
          where: { activityId, studentId },
        });

        if (existing) {
          await tx.activityGrade.update({
            where: { id: existing.id },
            data: { value: parsedVal },
          });
        } else {
          await tx.activityGrade.create({
            data: { activityId, studentId, value: parsedVal },
          });
        }
      }
    });

    return res.status(200).json({
      status: 'success',
      message: 'Notas da atividade salvas com sucesso',
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Report Cards / Boletins ───────────────────────────────────────────────────

export const saveReportCardAverages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      studentId,
      subject,
      schoolYear,
      bimester1,
      bimester2,
      bimester3,
      bimester4,
      remedialGrade,
    } = req.body;

    if (!studentId || !subject || !schoolYear) {
      return res.status(400).json({
        status: 'error',
        message: 'studentId, subject e schoolYear são obrigatórios',
      });
    }

    const parseScore = (val: any) =>
      val !== undefined && val !== null ? parseFloat(val.toString()) : null;

    const b1 = parseScore(bimester1);
    const b2 = parseScore(bimester2);
    const b3 = parseScore(bimester3);
    const b4 = parseScore(bimester4);
    const rec = parseScore(remedialGrade);

    // Calculate averages & status
    let status = 'CURSANDO';
    let finalAverage: number | null = null;

    const bimesters = [b1, b2, b3, b4];
    const completedBimesters = bimesters.filter((b) => b !== null) as number[];

    if (completedBimesters.length === 4) {
      const annualAverage = completedBimesters.reduce((acc, v) => acc + v, 0) / 4;

      if (annualAverage >= 6.0) {
        status = 'APROVADO';
        finalAverage = parseFloat(annualAverage.toFixed(1));
      } else {
        if (rec !== null) {
          const pósRec = (annualAverage + rec) / 2;
          status = pósRec >= 5.0 ? 'APROVADO' : 'REPROVADO';
          finalAverage = parseFloat(pósRec.toFixed(1));
        } else {
          status = 'EM_RECUPERACAO';
          finalAverage = parseFloat(annualAverage.toFixed(1));
        }
      }
    } else if (completedBimesters.length > 0) {
      // Still in progress, display running average
      const runningAvg =
        completedBimesters.reduce((acc, v) => acc + v, 0) / completedBimesters.length;
      finalAverage = parseFloat(runningAvg.toFixed(1));
      status = 'CURSANDO';
    }

    const existing = await prisma.reportCard.findFirst({
      where: { studentId, subject, schoolYear },
    });

    let rc;
    if (existing) {
      rc = await prisma.reportCard.update({
        where: { id: existing.id },
        data: {
          bimester1: b1,
          bimester2: b2,
          bimester3: b3,
          bimester4: b4,
          remedialGrade: rec,
          finalAverage,
          status,
        },
      });
    } else {
      rc = await prisma.reportCard.create({
        data: {
          studentId,
          subject,
          schoolYear,
          bimester1: b1,
          bimester2: b2,
          bimester3: b3,
          bimester4: b4,
          remedialGrade: rec,
          finalAverage,
          status,
        },
      });
    }

    return res.status(200).json({ status: 'success', data: rc });
  } catch (error) {
    return next(error);
  }
};

export const getReportCards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, classId, schoolYear = '2026' } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let targetStudentIds: string[] = [];

    // 1. Check permissions and target student
    if (userRole === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) {
        return res
          .status(404)
          .json({ status: 'error', message: 'Perfil de estudante não encontrado' });
      }
      targetStudentIds = [student.id];
    } else if (userRole === 'GUARDIAN') {
      const guardian = await prisma.guardian.findUnique({
        where: { userId },
        include: { students: true },
      });
      if (!guardian) {
        return res
          .status(404)
          .json({ status: 'error', message: 'Perfil de responsável não encontrado' });
      }
      targetStudentIds = guardian.students.map((st) => st.studentId);
    } else {
      // Administrative / Teacher access
      if (studentId) {
        targetStudentIds = [studentId as string];
      } else if (classId) {
        const students = await prisma.student.findMany({
          where: { classId: classId as string },
        });
        targetStudentIds = students.map((s) => s.id);
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'studentId ou classId devem ser fornecidos',
        });
      }
    }

    // 2. Fetch report cards
    const reportCards = await prisma.reportCard.findMany({
      where: {
        studentId: { in: targetStudentIds },
        schoolYear: schoolYear as string,
      },
      include: {
        student: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
      orderBy: { subject: 'asc' },
    });

    return res.status(200).json({ status: 'success', data: reportCards });
  } catch (error) {
    return next(error);
  }
};

export default {
  saveAttendance,
  getAttendance,
  saveContent,
  listContents,
  createActivity,
  deleteActivity,
  listActivities,
  saveActivityGrades,
  saveReportCardAverages,
  getReportCards,
};
