export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ExportHistory {
  id: string;
  exportId: string;
  status: ExportStatus;
  details?: string;
  createdAt: string;
}

export interface ExportProcess {
  id: string;
  format: string;
  modules: string;
  filterType: string;
  filterParams?: string;
  status: ExportStatus;
  totalRows: number;
  processedRows: number;
  sizeBytes: number;
  filePath?: string;
  fileName?: string;
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
  history?: ExportHistory[];
}
