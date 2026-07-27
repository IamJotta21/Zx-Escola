import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const createModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || null;
    const { name, description, targetEntity, mapping, originSystem } = req.body;

    const model = await prisma.importModel.create({
      data: {
        name,
        description,
        targetEntity,
        mapping: typeof mapping === 'string' ? mapping : JSON.stringify(mapping),
        originSystem,
        userId,
      },
    });

    return res.status(201).json({
      status: 'success',
      data: model,
    });
  } catch (error) {
    return next(error);
  }
};

export const getModelDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const model = await prisma.importModel.findUnique({
      where: { id },
    });

    if (!model) {
      return res.status(404).json({
        status: 'error',
        message: 'Modelo de mapeamento não encontrado',
      });
    }

    // Verify ownership or shared status
    if (req.user?.role !== 'SUPER_ADMIN' && model.userId && model.userId !== req.user?.id && !model.isShared) {
      return res.status(403).json({ status: 'error', message: 'Acesso negado: você não tem permissão para visualizar este modelo' });
    }

    return res.status(200).json({
      status: 'success',
      data: model,
    });
  } catch (error) {
    return next(error);
  }
};

export const listModels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id || '';
    const models = await prisma.importModel.findMany({
      where: {
        OR: [
          { userId },
          { isShared: true },
        ],
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      status: 'success',
      data: models,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.importModel.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Modelo de mapeamento não encontrado' });
    }

    // Only owner or superadmin can delete
    if (req.user?.role !== 'SUPER_ADMIN' && existing.userId !== req.user?.id) {
      return res.status(403).json({ status: 'error', message: 'Acesso negado: você não é proprietário deste modelo' });
    }

    const deleted = await prisma.importModel.delete({
      where: { id },
    });

    return res.status(200).json({
      status: 'success',
      data: deleted,
    });
  } catch (error) {
    return next(error);
  }
};
