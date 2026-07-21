import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// ═════════════════════════════════════════════════════════════════════════════
//  GUARDIAN PORTAL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * List all children linked to the authenticated guardian
 */
export const getGuardianChildren = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Find the guardian record linked to this user
    const guardian = await prisma.guardian.findUnique({ where: { userId } });
    if (!guardian) {
      return res
        .status(404)
        .json({ status: 'error', message: 'Perfil de responsável não encontrado.' });
    }

    const links = await prisma.studentGuardian.findMany({
      where: { guardianId: guardian.id },
      include: {
        student: {
          include: {
            user: { include: { profile: true } },
            class: true,
          },
        },
      },
    });

    const children = links.map((l) => ({
      id: l.student.id,
      userId: l.student.userId,
      name: l.student.user.profile
        ? `${l.student.user.profile.firstName} ${l.student.user.profile.lastName}`
        : l.student.user.email,
      className: l.student.class?.name || null,
      classId: l.student.classId,
      status: l.student.status,
      avatarUrl: l.student.user.profile?.avatarUrl || null,
    }));

    return res.json({ status: 'success', data: children });
  } catch (err) {
    return next(err);
  }
};

/**
 * Guardian → Report cards for a specific child
 */
export const getGuardianGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.query;
    if (!studentId)
      return res.status(400).json({ status: 'error', message: 'studentId é obrigatório.' });

    const cards = await prisma.reportCard.findMany({
      where: { studentId: studentId as string },
      orderBy: { subject: 'asc' },
    });

    return res.json({ status: 'success', data: cards });
  } catch (err) {
    return next(err);
  }
};

/**
 * Guardian → Financial info (tuitions) for a specific child
 */
export const getGuardianFinance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.query;
    if (!studentId)
      return res.status(400).json({ status: 'error', message: 'studentId é obrigatório.' });

    const tuitions = await prisma.tuition.findMany({
      where: { studentId: studentId as string },
      orderBy: { dueDate: 'asc' },
    });

    return res.json({ status: 'success', data: tuitions });
  } catch (err) {
    return next(err);
  }
};

/**
 * Guardian → Attendance for a specific child
 */
export const getGuardianAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.query;
    if (!studentId)
      return res.status(400).json({ status: 'error', message: 'studentId é obrigatório.' });

    const records = await prisma.attendance.findMany({
      where: { studentId: studentId as string },
      orderBy: { date: 'desc' },
    });

    const total = records.length;
    const absent = records.filter((r) => r.status === 'FALTA').length;
    const present = total - absent; // Includes PRESENTE, ATRASO, JUSTIFICADA as non-unexcused absence
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return res.json({
      status: 'success',
      data: { records, summary: { total, present, absent, percentage } },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Guardian → Notifications & announcements
 */
export const getGuardianMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const [notifications, announcements] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.announcement.findMany({
        where: { target: { in: ['ALL', 'GUARDIANS'] } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    return res.json({ status: 'success', data: { notifications, announcements } });
  } catch (err) {
    return next(err);
  }
};

/**
 * Guardian → Schedule (contents + activities) for a specific child's class
 */
export const getGuardianSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.query;
    if (!studentId)
      return res.status(400).json({ status: 'error', message: 'studentId é obrigatório.' });

    const student = await prisma.student.findUnique({ where: { id: studentId as string } });
    if (!student?.classId)
      return res.json({ status: 'success', data: { contents: [], activities: [] } });

    const [contents, activities] = await Promise.all([
      prisma.classContent.findMany({
        where: { classId: student.classId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      prisma.activity.findMany({
        where: { classId: student.classId },
        orderBy: { date: 'desc' },
        take: 30,
      }),
    ]);

    return res.json({ status: 'success', data: { contents, activities } });
  } catch (err) {
    return next(err);
  }
};

/**
 * Guardian → School documents for a specific child
 */
export const getGuardianDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.query;
    if (!studentId)
      return res.status(400).json({ status: 'error', message: 'studentId é obrigatório.' });

    const docs = await prisma.schoolDocument.findMany({
      where: { studentId: studentId as string, status: 'EMITIDO' },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ status: 'success', data: docs });
  } catch (err) {
    return next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  STUDENT PORTAL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Student → Own profile, class, basic info
 */
export const getStudentProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: { include: { profile: true } },
        class: true,
      },
    });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Perfil de aluno não encontrado.' });
    }

    return res.json({
      status: 'success',
      data: {
        id: student.id,
        email: student.user.email,
        name: student.user.profile
          ? `${student.user.profile.firstName} ${student.user.profile.lastName}`
          : student.user.email,
        firstName: student.user.profile?.firstName || '',
        lastName: student.user.profile?.lastName || '',
        phone: student.user.profile?.phone || null,
        birthDate: student.user.profile?.birthDate || null,
        avatarUrl: student.user.profile?.avatarUrl || null,
        className: student.class?.name || null,
        classId: student.classId,
        status: student.status,
        gender: student.gender,
        address: student.address,
        city: student.city,
        state: student.state,
        cep: student.cep,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Student → Own report cards
 */
export const getStudentGrades = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student)
      return res.status(404).json({ status: 'error', message: 'Aluno não encontrado.' });

    const cards = await prisma.reportCard.findMany({
      where: { studentId: student.id },
      orderBy: { subject: 'asc' },
    });

    return res.json({ status: 'success', data: cards });
  } catch (err) {
    return next(err);
  }
};

/**
 * Student → Activities in their class with their grades
 */
export const getStudentActivities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student)
      return res.status(404).json({ status: 'error', message: 'Aluno não encontrado.' });

    if (!student.classId) return res.json({ status: 'success', data: [] });

    const activities = await prisma.activity.findMany({
      where: { classId: student.classId },
      include: {
        grades: { where: { studentId: student.id } },
      },
      orderBy: { date: 'desc' },
    });

    const mapped = activities.map((a) => ({
      id: a.id,
      title: a.title,
      date: a.date,
      maxGrade: a.maxGrade,
      myGrade: a.grades[0]?.value ?? null,
    }));

    return res.json({ status: 'success', data: mapped });
  } catch (err) {
    return next(err);
  }
};

/**
 * Student → Calendar (class contents by date)
 */
export const getStudentCalendar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student?.classId) return res.json({ status: 'success', data: [] });

    const contents = await prisma.classContent.findMany({
      where: { classId: student.classId },
      orderBy: { date: 'desc' },
      take: 60,
    });

    return res.json({ status: 'success', data: contents });
  } catch (err) {
    return next(err);
  }
};

/**
 * Student → Materials (same as calendar/contents but grouped differently in frontend)
 */
export const getStudentMaterials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student?.classId) return res.json({ status: 'success', data: [] });

    const contents = await prisma.classContent.findMany({
      where: { classId: student.classId },
      orderBy: { date: 'desc' },
      take: 50,
    });

    return res.json({ status: 'success', data: contents });
  } catch (err) {
    return next(err);
  }
};

/**
 * Student → Announcements (ALL, STUDENTS, or their class)
 */
export const getStudentAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const student = await prisma.student.findUnique({ where: { userId } });

    const whereConditions: any[] = [{ target: 'ALL' }, { target: 'STUDENTS' }];
    if (student?.classId) {
      whereConditions.push({ target: 'CLASS', classId: student.classId });
    }

    const announcements = await prisma.announcement.findMany({
      where: { OR: whereConditions },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return res.json({ status: 'success', data: announcements });
  } catch (err) {
    return next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  TEACHER PORTAL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Helper to get or auto-create a Teacher model profile for the user ID.
 */
async function findOrCreateTeacher(userId: string) {
  let teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      user: { include: { profile: true } },
    },
  });

  if (!teacher) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) return null;

    teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        subjects: 'Geral',
        workload: 20,
      },
      include: {
        user: { include: { profile: true } },
      },
    });
  }

  return teacher;
}

/**
 * Teacher → Own profile details
 */
export const getTeacherProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const teacher = await findOrCreateTeacher(userId);

    if (!teacher) {
      return res.status(404).json({ status: 'error', message: 'Perfil de professor não encontrado.' });
    }

    return res.json({
      status: 'success',
      data: {
        id: teacher.id,
        email: teacher.user.email,
        name: teacher.user.profile
          ? `${teacher.user.profile.firstName} ${teacher.user.profile.lastName}`
          : teacher.user.email,
        firstName: teacher.user.profile?.firstName || '',
        lastName: teacher.user.profile?.lastName || '',
        phone: teacher.user.profile?.phone || null,
        subjects: teacher.subjects,
        workload: teacher.workload,
        schedule: teacher.schedule,
        createdAt: teacher.createdAt,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Teacher → Own classes
 */
export const getTeacherClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const teacher = await findOrCreateTeacher(userId);
    if (!teacher) {
      return res.status(404).json({ status: 'error', message: 'Professor não encontrado.' });
    }

    const classes = await prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        room: true,
        students: {
          include: {
            user: { include: { profile: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const mapped = classes.map((c) => ({
      id: c.id,
      name: c.name,
      gradeYear: c.gradeYear,
      schoolYear: c.schoolYear,
      room: c.room ? { name: c.room.name, capacity: c.room.capacity } : null,
      studentsCount: c.students.length,
      students: c.students.map((st) => ({
        id: st.id,
        name: st.user.profile
          ? `${st.user.profile.firstName} ${st.user.profile.lastName}`
          : st.user.email,
        email: st.user.email,
        status: st.status,
      })),
    }));

    return res.json({ status: 'success', data: mapped });
  } catch (err) {
    return next(err);
  }
};

/**
 * Teacher → Dashboard statistics and recent announcements
 */
export const getTeacherDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const teacher = await findOrCreateTeacher(userId);
    if (!teacher) {
      return res.status(404).json({ status: 'error', message: 'Professor não encontrado.' });
    }

    const classes = await prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: { students: true },
    });

    const classIds = classes.map((c) => c.id);
    const totalClasses = classes.length;

    // Calculate total unique students in all teacher's classes
    const studentIds = new Set<string>();
    classes.forEach((c) => c.students.forEach((s) => studentIds.add(s.id)));
    const totalStudents = studentIds.size;

    const subjectsList = teacher.subjects
      ? teacher.subjects.split(',').map((s) => s.trim())
      : [];
    const totalSubjects = subjectsList.length;

    // Fetch recent announcements for this teacher's classes or ALL/TEACHERS
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { target: 'ALL' },
          { target: 'TEACHERS' },
          { target: 'CLASS', classId: { in: classIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return res.json({
      status: 'success',
      data: {
        stats: {
          totalClasses,
          totalStudents,
          totalSubjects,
          workload: teacher.workload,
          subjects: subjectsList,
        },
        announcements,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Teacher → Announcements relevant to their classes/role
 */
export const getTeacherAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const teacher = await findOrCreateTeacher(userId);
    if (!teacher) {
      return res.status(404).json({ status: 'error', message: 'Professor não encontrado.' });
    }

    const classes = await prisma.class.findMany({
      where: { teacherId: teacher.id },
      select: { id: true },
    });
    const classIds = classes.map((c) => c.id);

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { target: 'ALL' },
          { target: 'TEACHERS' },
          { target: 'CLASS', classId: { in: classIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return res.json({ status: 'success', data: announcements });
  } catch (err) {
    return next(err);
  }
};


