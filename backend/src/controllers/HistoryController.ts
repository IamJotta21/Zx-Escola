import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const getImportHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { importId } = req.params;

    // Verify import job exists and belongs to same tenant
    const importJob = await prisma.import.findUnique({
      where: { id: importId },
      include: { user: true },
    });

    if (!importJob) {
      return res.status(404).json({ status: 'error', message: 'Importação não encontrada' });
    }

    if (req.user?.role !== 'SUPER_ADMIN') {
      if (importJob.userId !== req.user?.id && importJob.user?.tenantId !== req.tenantId) {
        return res.status(403).json({ status: 'error', message: 'Acesso negado' });
      }
    }

    const history = await prisma.importHistory.findMany({
      where: { importId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: history,
    });
  } catch (error) {
    return next(error);
  }
};

export const listAllHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenantId || 'escola-matriz-default-id';
    const queryCond: any = {};

    if (req.user?.role !== 'SUPER_ADMIN') {
      queryCond.import = {
        user: {
          tenantId,
        },
      };
    }

    const history = await prisma.importHistory.findMany({
      where: queryCond,
      orderBy: { createdAt: 'desc' },
      include: {
        import: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: history,
    });
  } catch (error) {
    return next(error);
  }
};
