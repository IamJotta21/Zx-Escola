import { prisma } from '../config/database';
import { IHistoryRepository } from '../interfaces/ImportInterface';
import { ImportHistory } from '@prisma/client';

export class HistoryRepository implements IHistoryRepository {
  async create(importId: string, status: string, details?: string): Promise<ImportHistory> {
    return prisma.importHistory.create({
      data: {
        importId,
        status,
        details,
      },
    });
  }

  async listByImportId(importId: string): Promise<ImportHistory[]> {
    return prisma.importHistory.findMany({
      where: { importId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll(): Promise<ImportHistory[]> {
    return prisma.importHistory.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
export default HistoryRepository;
