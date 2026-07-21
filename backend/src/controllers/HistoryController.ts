import { Request, Response, NextFunction } from 'express';
import { HistoryRepository } from '../repositories/HistoryRepository';
import { HistoryService } from '../services/HistoryService';

const historyRepository = new HistoryRepository();
const historyService = new HistoryService(historyRepository);

export const getImportHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { importId } = req.params;
    const history = await historyService.getImportHistory(importId);
    return res.status(200).json({
      status: 'success',
      data: history,
    });
  } catch (error) {
    return next(error);
  }
};

export const listAllHistory = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await historyService.listAllHistory();
    return res.status(200).json({
      status: 'success',
      data: history,
    });
  } catch (error) {
    return next(error);
  }
};
