import { Import, ImportModel, UploadedFile, ImportLog, ImportHistory } from '@prisma/client';

// Repositories Interfaces
export interface IImportRepository {
  create(data: {
    modelId?: string;
    fileId?: string;
    userId?: string;
    status?: string;
  }): Promise<Import>;
  findById(id: string): Promise<Import | null>;
  listAll(): Promise<Import[]>;
  updateStatus(
    id: string,
    status: string,
    stats?: { totalRows?: number; processedRows?: number; successRows?: number; errorRows?: number }
  ): Promise<Import>;
  addLog(
    importId: string,
    rowNumber: number | null,
    status: string,
    message: string,
    details?: string
  ): Promise<ImportLog>;
}

export interface IHistoryRepository {
  create(importId: string, status: string, details?: string): Promise<ImportHistory>;
  listByImportId(importId: string): Promise<ImportHistory[]>;
  listAll(): Promise<ImportHistory[]>;
}

export interface IModelRepository {
  create(data: {
    name: string;
    description?: string;
    targetEntity: string;
    mapping: string;
    originSystem?: string;
  }): Promise<ImportModel>;
  findById(id: string): Promise<ImportModel | null>;
  listAll(): Promise<ImportModel[]>;
  delete(id: string): Promise<ImportModel>;
}

// Services Interfaces
export interface IImportService {
  startImport(modelId: string, fileId: string, userId: string): Promise<Import>;
  getImportDetails(id: string): Promise<Import | null>;
  listImports(): Promise<Import[]>;
  getDashboardStats(): Promise<any>;
}

export interface IUploadService {
  registerUpload(data: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType?: string;
    hash?: string;
    status?: string;
    userId?: string;
  }): Promise<UploadedFile>;
  getUploadedFile(id: string): Promise<UploadedFile | null>;
}

export interface IHistoryService {
  logStateTransition(importId: string, status: string, details?: string): Promise<ImportHistory>;
  getImportHistory(importId: string): Promise<ImportHistory[]>;
  listAllHistory(): Promise<ImportHistory[]>;
}

export interface IFileAnalyzerService {
  analyzeHeaders(
    fileId: string,
    modelId: string
  ): Promise<{
    isValid: boolean;
    rowCount: number;
    missingHeaders: string[];
    matchedHeaders: Record<string, string>;
  }>;
}

export interface IModelMapperService {
  mapRowToEntity(row: Record<string, any>, mapping: Record<string, string>): Record<string, any>;
}
