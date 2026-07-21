import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// ─── List ──────────────────────────────────────────────────────────────────────

export const listDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, status, studentId, search } = req.query;
    const where: any = {};
    if (type) where.type = type as string;
    if (status) where.status = status as string;
    if (studentId) where.studentId = studentId as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { studentName: { contains: search as string } },
      ];
    }
    const docs = await prisma.schoolDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ status: 'success', data: docs });
  } catch (err) {
    return next(err);
  }
};

export const getDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doc = await prisma.schoolDocument.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ status: 'error', message: 'Documento não encontrado' });
    return res.json({ status: 'success', data: doc });
  } catch (err) {
    return next(err);
  }
};

// ─── Create ────────────────────────────────────────────────────────────────────

export const createDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, title, content, studentId, studentName, issuedBy, status } = req.body;
    if (!type || !title)
      return res.status(400).json({ status: 'error', message: 'type e title são obrigatórios' });

    const doc = await prisma.schoolDocument.create({
      data: {
        type,
        title,
        content: content || null,
        studentId: studentId || null,
        studentName: studentName || null,
        issuedBy: issuedBy || req.user?.email || null,
        status: status || 'RASCUNHO',
      },
    });
    return res.status(201).json({ status: 'success', data: doc });
  } catch (err) {
    return next(err);
  }
};

// ─── Update ────────────────────────────────────────────────────────────────────

export const updateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, content, status, studentId, studentName, issuedBy } = req.body;

    const existing = await prisma.schoolDocument.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ status: 'error', message: 'Documento não encontrado' });

    const doc = await prisma.schoolDocument.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        content: content ?? existing.content,
        status: status ?? existing.status,
        studentId: studentId ?? existing.studentId,
        studentName: studentName ?? existing.studentName,
        issuedBy: issuedBy ?? existing.issuedBy,
      },
    });
    return res.json({ status: 'success', data: doc });
  } catch (err) {
    return next(err);
  }
};

// ─── Delete ────────────────────────────────────────────────────────────────────

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.schoolDocument.delete({ where: { id } });
    return res.json({ status: 'success', message: 'Documento removido' });
  } catch (err) {
    return next(err);
  }
};

// ─── File Upload ───────────────────────────────────────────────────────────────

export const uploadDocumentFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const file = req.file;
    if (!file) return res.status(400).json({ status: 'error', message: 'Nenhum arquivo enviado' });

    const filePath = file.filename;
    const fileName = file.originalname;

    const doc = await prisma.schoolDocument.update({
      where: { id },
      data: { filePath, fileName },
    });
    return res.json({ status: 'success', data: doc });
  } catch (err) {
    return next(err);
  }
};

export default {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadDocumentFile,
};
