import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const getReportsData = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Fetch all raw data required for reports in parallel to optimize DB load
    const [students, classes, teachers, tuitions, transactions, reportCards, attendances] =
      await Promise.all([
        prisma.student.findMany({ include: { user: { include: { profile: true } } } }),
        prisma.class.findMany({ include: { students: true } }),
        prisma.teacher.findMany({
          include: { user: { include: { profile: true } }, classes: true },
        }),
        prisma.tuition.findMany({
          include: { student: { include: { user: { include: { profile: true } } } } },
        }),
        prisma.transaction.findMany(),
        prisma.reportCard.findMany(),
        prisma.attendance.findMany(),
      ]);

    // ─── Financial Aggregations ───────────────────────────────────────────────
    let totalRevenues = 0;
    let totalExpenses = 0;
    const revenuesByCategory: Record<string, number> = {};
    const expensesByCategory: Record<string, number> = {};
    const paymentMethods: Record<string, number> = {};

    transactions.forEach((t) => {
      const val = t.value;
      const method = t.paymentMethod || 'OUTRO';
      if (t.type === 'RECEITA') {
        totalRevenues += val;
        revenuesByCategory[t.category] = (revenuesByCategory[t.category] || 0) + val;
        paymentMethods[method] = (paymentMethods[method] || 0) + val;
      } else {
        totalExpenses += val;
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + val;
      }
    });

    // Cashflow by Date (YYYY-MM)
    const monthlyCashflow: Record<string, { month: string; revenues: number; expenses: number }> =
      {};
    transactions.forEach((t) => {
      const month = t.date.substring(0, 7); // ex: "2026-07"
      if (!monthlyCashflow[month]) {
        monthlyCashflow[month] = { month, revenues: 0, expenses: 0 };
      }
      if (t.type === 'RECEITA') {
        monthlyCashflow[month].revenues += t.value;
      } else {
        monthlyCashflow[month].expenses += t.value;
      }
    });

    const cashflowArray = Object.values(monthlyCashflow).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    // ─── Tuitions Aggregations ────────────────────────────────────────────────
    let tuitionPaidSum = 0;
    let tuitionPaidQty = 0;
    let tuitionPendingSum = 0;
    let tuitionPendingQty = 0;
    let tuitionOverdueSum = 0;
    let tuitionOverdueQty = 0;

    tuitions.forEach((t) => {
      if (t.status === 'PAGO') {
        tuitionPaidSum += t.finalValue;
        tuitionPaidQty++;
      } else if (t.status === 'ATRASADO') {
        tuitionOverdueSum += t.finalValue;
        tuitionOverdueQty++;
      } else {
        tuitionPendingSum += t.finalValue;
        tuitionPendingQty++;
      }
    });

    // ─── Academic & Classes Aggregations ─────────────────────────────────────
    const gradesBySubject: Record<
      string,
      { subject: string; sum: number; count: number; average: number }
    > = {};
    let totalApprovals = 0;
    let totalFailures = 0;
    let totalRemedial = 0;
    let totalCursando = 0;

    reportCards.forEach((rc) => {
      // Status count
      if (rc.status === 'APROVADO') totalApprovals++;
      else if (rc.status === 'REPROVADO') totalFailures++;
      else if (rc.status === 'EM_RECUPERACAO') totalRemedial++;
      else totalCursando++;

      // Subject average
      if (rc.finalAverage !== null) {
        if (!gradesBySubject[rc.subject]) {
          gradesBySubject[rc.subject] = { subject: rc.subject, sum: 0, count: 0, average: 0 };
        }
        gradesBySubject[rc.subject].sum += rc.finalAverage;
        gradesBySubject[rc.subject].count++;
      }
    });

    Object.keys(gradesBySubject).forEach((k) => {
      const s = gradesBySubject[k];
      s.average = s.count > 0 ? parseFloat((s.sum / s.count).toFixed(2)) : 0;
    });

    // Class stats (students count, average attendance %)
    const classStats = classes.map((c) => {
      const classStudents = students.filter((s) => s.classId === c.id);
      const studentIds = classStudents.map((s) => s.id);
      const classAttendances = attendances.filter(
        (a) => a.classId === c.id && studentIds.includes(a.studentId)
      );

      const totalAttendance = classAttendances.length;
      const presentAttendance = classAttendances.filter((a) => a.status === 'PRESENTE').length;
      const attendancePercent =
        totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 100;

      // Class average grade
      const classReportCards = reportCards.filter(
        (rc) => studentIds.includes(rc.studentId) && rc.finalAverage !== null
      );
      const sumGrades = classReportCards.reduce((acc, curr) => acc + (curr.finalAverage || 0), 0);
      const avgGrade =
        classReportCards.length > 0
          ? parseFloat((sumGrades / classReportCards.length).toFixed(2))
          : 0;

      return {
        id: c.id,
        name: c.name,
        studentsCount: classStudents.length,
        attendancePercent,
        avgGrade,
      };
    });

    // ─── Students Aggregations ────────────────────────────────────────────────
    const studentsByStatus: Record<string, number> = {};
    const studentsByGender: Record<string, number> = {};

    students.forEach((s) => {
      const stat = s.status || 'OUTRO';
      studentsByStatus[stat] = (studentsByStatus[stat] || 0) + 1;

      const gen = s.gender || 'NÃO INFORMADO';
      studentsByGender[gen] = (studentsByGender[gen] || 0) + 1;
    });

    // ─── Teachers Aggregations ────────────────────────────────────────────────
    const teacherStats = teachers.map((t) => {
      const name = t.user.profile
        ? `${t.user.profile.firstName} ${t.user.profile.lastName}`
        : t.user.email;
      return {
        id: t.id,
        name,
        workload: t.workload,
        classesCount: t.classes.length,
        subjects: t.subjects ? t.subjects.split(',').map((s) => s.trim()) : [],
      };
    });

    return res.json({
      status: 'success',
      data: {
        financial: {
          totalRevenues,
          totalExpenses,
          balance: totalRevenues - totalExpenses,
          revenuesByCategory,
          expensesByCategory,
          paymentMethods,
          monthlyCashflow: cashflowArray,
        },
        tuitions: {
          paid: { value: tuitionPaidSum, qty: tuitionPaidQty },
          pending: { value: tuitionPendingSum, qty: tuitionPendingQty },
          overdue: { value: tuitionOverdueSum, qty: tuitionOverdueQty },
        },
        academic: {
          gradesBySubject: Object.values(gradesBySubject),
          statusReport: {
            aprovado: totalApprovals,
            reprovado: totalFailures,
            recuperacao: totalRemedial,
            cursando: totalCursando,
          },
        },
        classes: classStats,
        students: {
          total: students.length,
          byStatus: studentsByStatus,
          byGender: studentsByGender,
        },
        teachers: teacherStats,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getSystemLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, search, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (action) {
      where.action = action as string;
    }

    if (search) {
      where.OR = [
        { details: { contains: search as string } },
        { ipAddress: { contains: search as string } },
        {
          user: {
            email: { contains: search as string },
          },
        },
      ];
    }

    const [total, logs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
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

    return res.json({
      status: 'success',
      data: {
        total,
        page: pageNum,
        limit: limitNum,
        logs,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default { getReportsData, getSystemLogs };
