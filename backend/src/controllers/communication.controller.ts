import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// ─── Direct Messaging (Disparo de Mensagens) ──────────────────────────────────

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { recipientRole, classId, channels, subject, body } = req.body;
    const senderId = req.user?.id || 'system';

    if (!recipientRole || !Array.isArray(channels) || !body) {
      return res.status(400).json({
        status: 'error',
        message: 'recipientRole, channels (array) e body são obrigatórios',
      });
    }

    // 1. Resolve recipients users
    let targetUsers: { id: string; email: string; role: string }[] = [];
    let recipientName = recipientRole;

    if (recipientRole === 'TODOS') {
      targetUsers = await prisma.user.findMany({
        select: { id: true, email: true, role: true },
      });
      recipientName = 'Todos os Usuários';
    } else if (recipientRole === 'ALUNOS') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, email: true, role: true },
      });
      recipientName = 'Todos os Alunos';
    } else if (recipientRole === 'PROFESSORES') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'TEACHER' },
        select: { id: true, email: true, role: true },
      });
      recipientName = 'Todos os Professores';
    } else if (recipientRole === 'PAIS') {
      targetUsers = await prisma.user.findMany({
        where: { role: 'GUARDIAN' },
        select: { id: true, email: true, role: true },
      });
      recipientName = 'Todos os Responsáveis';
    } else if (recipientRole === 'TURMA' && classId) {
      const cls = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          students: {
            include: { user: true },
          },
        },
      });

      if (!cls) {
        return res.status(404).json({ status: 'error', message: 'Turma não encontrada' });
      }

      targetUsers = cls.students.map((s) => ({
        id: s.userId,
        email: s.user.email,
        role: s.user.role,
      }));
      recipientName = `Turma: ${cls.name}`;
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Nenhum destinatário encontrado com esses critérios',
      });
    }

    // 2. Perform message dispatch simulations inside transaction
    await prisma.$transaction(async (tx) => {
      // Dispatch internal system notifications
      if (channels.includes('NOTIFICATION')) {
        const notificationsData = targetUsers.map((u) => ({
          userId: u.id,
          title: subject || 'Novo Comunicado',
          content: body,
        }));

        await tx.notification.createMany({ data: notificationsData });
      }

      // Log dispatch history logs (simulated channels)
      for (const chan of channels) {
        await tx.messageLog.create({
          data: {
            senderId,
            recipientRole,
            recipientName: `${recipientName} (${targetUsers.length} rec.)`,
            channel: chan,
            subject: subject || null,
            body,
            status: 'ENVIADO',
          },
        });
      }
    });

    return res.status(200).json({
      status: 'success',
      message: `Mensagem enviada com sucesso para ${targetUsers.length} destinatário(s)`,
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Public Announcements (Mural de Avisos) ────────────────────────────────────

export const createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, target, classId } = req.body;
    const senderId = req.user?.id || 'system';

    if (!title || !content || !target) {
      return res.status(400).json({
        status: 'error',
        message: 'title, content e target são obrigatórios',
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        target,
        classId: target === 'CLASS' ? classId : null,
        senderId,
      },
    });

    return res.status(201).json({ status: 'success', data: announcement });
  } catch (error) {
    return next(error);
  }
};

export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return res.status(404).json({ status: 'error', message: 'Aviso não encontrado' });
    }

    await prisma.announcement.delete({ where: { id } });

    return res.status(200).json({ status: 'success', message: 'Aviso excluído com sucesso' });
  } catch (error) {
    return next(error);
  }
};

export const listAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const where: any = {};

    // Segment announcements by user role permissions
    if (userRole === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      const studentClassId = student?.classId || 'unassigned';

      where.OR = [
        { target: 'ALL' },
        { target: 'STUDENTS' },
        { AND: [{ target: 'CLASS' }, { classId: studentClassId }] },
      ];
    } else if (userRole === 'GUARDIAN') {
      const guardian = await prisma.guardian.findUnique({
        where: { userId },
        include: {
          students: {
            include: {
              student: true,
            },
          },
        },
      });
      const childrenClasses =
        guardian?.students.map((s) => s.student.classId).filter(Boolean) || [];

      where.OR = [
        { target: 'ALL' },
        { target: 'GUARDIANS' },
        { AND: [{ target: 'CLASS' }, { classId: { in: childrenClasses as string[] } }] },
      ];
    } else if (userRole === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
        include: { classes: true },
      });
      const teacherClassIds = teacher?.classes.map((c) => c.id) || [];

      where.OR = [
        { target: 'ALL' },
        { target: 'TEACHERS' },
        { AND: [{ target: 'CLASS' }, { classId: { in: teacherClassIds } }] },
      ];
    }

    // ADMIN and DIRETOR will get all notices (where is empty query)

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        class: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ status: 'success', data: announcements });
  } catch (error) {
    return next(error);
  }
};

// ─── Logs & Inbox ─────────────────────────────────────────────────────────────

export const listMessageLogs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.messageLog.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    return next(error);
  }
};

export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ status: 'success', data: notifications });
  } catch (error) {
    return next(error);
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notificação não encontrada' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    return next(error);
  }
};

export default {
  sendMessage,
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  listMessageLogs,
  getUserNotifications,
  markNotificationRead,
};
