import { TargetEntity, MappingConfig } from '../types/ImportType';

export interface CreateImportModelDTO {
  name: string;
  description?: string;
  targetEntity: TargetEntity;
  mapping: MappingConfig;
  originSystem?: string;
}

export interface RegisterUploadDTO {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
  userId?: string;
}

export interface StartImportDTO {
  modelId: string;
  fileId: string;
}

export interface AddImportLogDTO {
  rowNumber: number | null;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
  details?: string;
}
