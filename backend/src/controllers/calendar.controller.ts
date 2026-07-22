import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * List calendar events with optional filtering by eventType, date range, or target
 */
export const listCalendarEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventType, startDate, endDate, target, classId } = req.query;

    const where: any = {};

    if (eventType) {
      where.eventType = eventType as string;
    }

    if (target) {
      where.target = target as string;
    }

    if (classId) {
      where.classId = classId as string;
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = startDate as string;
      if (endDate) where.startDate.lte = endDate as string;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        class: true,
      },
      orderBy: { startDate: 'asc' },
    });

    return res.json({ status: 'success', data: events });
  } catch (err) {
    return next(err);
  }
};

/**
 * Create a new calendar event (Início das Aulas, Férias, Recesso, Feriado, Evento, Reunião, Prova, Recuperação)
 */
export const createCalendarEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, eventType, startDate, endDate, location, target, classId, notifyUsers } = req.body;

    if (!title || !eventType || !startDate) {
      return res.status(400).json({
        status: 'error',
        message: 'title, eventType e startDate são obrigatórios',
      });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || null,
        eventType,
        startDate,
        endDate: endDate || null,
        location: location || null,
        target: target || 'ALL',
        classId: target === 'CLASS' ? classId : null,
        createdById: req.user?.id || 'system',
      },
      include: {
        class: true,
      },
    });

    // Optionally generate internal notifications for targeted users
    if (notifyUsers) {
      try {
        let recipientUsers: Array<{ id: string }> = [];

        if (target === 'ALL') {
          recipientUsers = await prisma.user.findMany({ select: { id: true } });
        } else if (target === 'STUDENTS') {
          recipientUsers = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true } });
        } else if (target === 'TEACHERS') {
          recipientUsers = await prisma.user.findMany({ where: { role: 'TEACHER' }, select: { id: true } });
        } else if (target === 'GUARDIANS') {
          recipientUsers = await prisma.user.findMany({ where: { role: 'GUARDIAN' }, select: { id: true } });
        } else if (target === 'CLASS' && classId) {
          const cls = await prisma.class.findUnique({
            where: { id: classId },
            include: { students: { select: { userId: true } } },
          });
          if (cls) {
            recipientUsers = cls.students.map((s) => ({ id: s.userId }));
          }
        }

        if (recipientUsers.length > 0) {
          const notificationsData = recipientUsers.map((u) => ({
            userId: u.id,
            title: `Novo Evento: ${title}`,
            content: `Data: ${startDate} - ${description || 'Verifique a agenda escolar para mais detalhes.'}`,
          }));

          await prisma.notification.createMany({ data: notificationsData });
        }
      } catch (notifErr) {
        console.error('Erro ao gerar notificações do evento:', notifErr);
      }
    }

    return res.status(201).json({ status: 'success', data: event });
  } catch (err) {
    return next(err);
  }
};

/**
 * Update a calendar event
 */
export const updateCalendarEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, eventType, startDate, endDate, location, target, classId } = req.body;

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Evento não encontrado' });
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description !== undefined ? description : existing.description,
        eventType: eventType ?? existing.eventType,
        startDate: startDate ?? existing.startDate,
        endDate: endDate !== undefined ? endDate : existing.endDate,
        location: location !== undefined ? location : existing.location,
        target: target ?? existing.target,
        classId: target === 'CLASS' ? classId : (target !== undefined ? null : existing.classId),
      },
      include: {
        class: true,
      },
    });

    return res.json({ status: 'success', data: updated });
  } catch (err) {
    return next(err);
  }
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Evento não encontrado' });
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return res.json({ status: 'success', message: 'Evento excluído com sucesso' });
  } catch (err) {
    return next(err);
  }
};

export default {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};
