export type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type LogStatus = 'SUCCESS' | 'ERROR' | 'WARNING';

export type TargetEntity = 'STUDENT' | 'TEACHER' | 'GUARDIAN' | 'CLASS' | 'ROOM';

export type MappingConfig = {
  [excelColumn: string]: string;
};

export interface ColumnTypeInfo {
  name: string;
  detectedType: 'EMAIL' | 'PHONE' | 'CPF' | 'DATE' | 'NUMBER' | 'STRING' | 'BOOLEAN';
  sampleValues: string[];
}

export interface InconsistencyInfo {
  rowNumber?: number;
  columnName?: string;
  type: 'ERROR' | 'WARNING';
  message: string;
}

export interface EntityDetectionInfo {
  entityType: string;
  confidence: number;
  matchedFields: string[];
}

export interface FileAnalysisResult {
  fileName: string;
  fileSize: number;
  format: string;
  encoding: string;
  parsingTimeMs: number;
  totalRows: number;
  totalCols: number;
  detectedEntities: EntityDetectionInfo[];
  columns: ColumnTypeInfo[];
  inconsistencies: InconsistencyInfo[];
  duplicateCount: number;
  previewRows: Array<Record<string, any>>;
}

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: Array<Record<string, any>>;
}

export interface ParsedData {
  format: string;
  encoding: string;
  sheets: ParsedSheet[];
  metadata: {
    totalRows: number;
    totalCols: number;
    fileSize: number;
  };
}
