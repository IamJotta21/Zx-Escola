import { prisma } from '../config/database';
import { IUploadService } from '../interfaces/ImportInterface';
import { UploadedFile } from '@prisma/client';

export class UploadService implements IUploadService {
  async registerUpload(data: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType?: string;
    hash?: string;
    status?: string;
    userId?: string;
  }): Promise<UploadedFile> {
    return prisma.uploadedFile.create({
      data,
    });
  }

  async getUploadedFile(id: string): Promise<UploadedFile | null> {
    return prisma.uploadedFile.findUnique({
      where: { id },
    });
  }

  async findByHash(hash: string): Promise<UploadedFile | null> {
    return prisma.uploadedFile.findFirst({
      where: { hash },
    });
  }
}
export default UploadService;
