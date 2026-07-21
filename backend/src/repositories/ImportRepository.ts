import { prisma } from '../config/database';
import { IImportRepository } from '../interfaces/ImportInterface';
import { Import, ImportLog } from '@prisma/client';

export class ImportRepository implements IImportRepository {
  async create(data: {
    modelId?: string;
    fileId?: string;
    userId?: string;
    status?: string;
  }): Promise<Import> {
    return prisma.import.create({
      data,
      include: {
        model: true,
        file: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Import | null> {
    return prisma.import.findUnique({
      where: { id },
      include: {
        model: true,
        file: true,
        logs: {
          orderBy: { rowNumber: 'asc' },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  async listAll(): Promise<Import[]> {
    return prisma.import.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        model: true,
        file: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    stats?: { totalRows?: number; processedRows?: number; successRows?: number; errorRows?: number }
  ): Promise<Import> {
    return prisma.import.update({
      where: { id },
      data: {
        status,
        ...(stats || {}),
      },
      include: {
        model: true,
        file: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  }

  async addLog(
    importId: string,
    rowNumber: number | null,
    status: string,
    message: string,
    details?: string
  ): Promise<ImportLog> {
    return prisma.importLog.create({
      data: {
        importId,
        rowNumber,
        status,
        message,
        details,
      },
    });
  }
}
export default ImportRepository;
