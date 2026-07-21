export type ImportStatus =
  'PENDING' | 'PROCESSING' | 'PAUSED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';

export type LogStatus = 'SUCCESS' | 'ERROR' | 'WARNING';

export type TargetEntity = 'STUDENT' | 'TEACHER' | 'GUARDIAN' | 'CLASS' | 'ROOM';

export interface ImportModel {
  id: string;
  name: string;
  description?: string;
  targetEntity: TargetEntity;
  mapping: Record<string, string>;
  originSystem?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
  createdAt: string;
}

export interface ImportLog {
  id: string;
  importId: string;
  rowNumber?: number;
  status: LogStatus;
  message: string;
  details?: string;
  createdAt: string;
}

export interface ImportHistory {
  id: string;
  importId: string;
  status: ImportStatus;
  details?: string;
  createdAt: string;
}

export interface ImportProcess {
  id: string;
  modelId?: string;
  model?: ImportModel;
  fileId?: string;
  file?: UploadedFile;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  userId?: string;
  user?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  logs?: ImportLog[];
  history?: ImportHistory[];
}

export interface ImportDashboardStats {
  totalImports: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  paused: number;
  cancelled: number;
  totalRows: number;
  successRows: number;
  errorRows: number;
}

export interface BackupFile {
  name: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
}
