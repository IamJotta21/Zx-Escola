export interface ImportModel {
  id: string;
  name: string;
  description?: string | null;
  targetEntity: string;
  mapping: string;
  originSystem?: string | null;
  isShared: boolean;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExportModel {
  id: string;
  name: string;
  description?: string | null;
  format: string;
  modules: string;
  filterType: string;
  filterParams?: string | null;
  isShared: boolean;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledJob {
  id: string;
  name: string;
  type: 'IMPORT_DIRECTORY' | 'EXPORT_AUTOMATIC';
  frequency: 'DAILY' | 'WEEKLY_FRIDAY' | 'CRON';
  timeOfDay?: string | null;
  config: string;
  isActive: boolean;
  lastRun?: string | null;
  nextRun?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobExecution {
  id: string;
  jobId: string;
  status: 'SUCCESS' | 'FAILED';
  logs?: string | null;
  runTimeMs: number;
  createdAt: string;
}
