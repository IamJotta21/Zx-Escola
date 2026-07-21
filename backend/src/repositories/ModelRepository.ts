import { prisma } from '../config/database';
import { IModelRepository } from '../interfaces/ImportInterface';
import { ImportModel } from '@prisma/client';

export class ModelRepository implements IModelRepository {
  async create(data: {
    name: string;
    description?: string;
    targetEntity: string;
    mapping: string;
    originSystem?: string;
  }): Promise<ImportModel> {
    return prisma.importModel.create({
      data,
    });
  }

  async findById(id: string): Promise<ImportModel | null> {
    return prisma.importModel.findUnique({
      where: { id },
    });
  }

  async listAll(): Promise<ImportModel[]> {
    return prisma.importModel.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string): Promise<ImportModel> {
    return prisma.importModel.delete({
      where: { id },
    });
  }
}
export default ModelRepository;
