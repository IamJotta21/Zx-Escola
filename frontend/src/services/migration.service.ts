import api from './api';
import { ImportModel, ExportModel, ScheduledJob, JobExecution } from '../types/migration.type';

export const migrationService = {
  // ─── Import Models ─────────────────────────────────────────────────────────
  getImportModels: async (): Promise<ImportModel[]> => {
    const response = await api.get('/migration/models/import');
    return response.data.data;
  },

  createImportModel: async (
    data: Omit<ImportModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ImportModel> => {
    const response = await api.post('/migration/models/import', data);
    return response.data.data;
  },

  updateImportModel: async (id: string, data: Partial<ImportModel>): Promise<ImportModel> => {
    const response = await api.put(`/migration/models/import/${id}`, data);
    return response.data.data;
  },

  duplicateImportModel: async (id: string): Promise<ImportModel> => {
    const response = await api.post(`/migration/models/import/${id}/duplicate`);
    return response.data.data;
  },

  deleteImportModel: async (id: string): Promise<void> => {
    await api.delete(`/migration/models/import/${id}`);
  },

  shareImportModel: async (id: string, isShared: boolean): Promise<ImportModel> => {
    const response = await api.post(`/migration/models/import/${id}/share`, { isShared });
    return response.data.data;
  },

  // ─── Export Models ─────────────────────────────────────────────────────────
  getExportModels: async (): Promise<ExportModel[]> => {
    const response = await api.get('/migration/models/export');
    return response.data.data;
  },

  createExportModel: async (
    data: Omit<ExportModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ExportModel> => {
    const response = await api.post('/migration/models/export', data);
    return response.data.data;
  },

  updateExportModel: async (id: string, data: Partial<ExportModel>): Promise<ExportModel> => {
    const response = await api.put(`/migration/models/export/${id}`, data);
    return response.data.data;
  },

  duplicateExportModel: async (id: string): Promise<ExportModel> => {
    const response = await api.post(`/migration/models/export/${id}/duplicate`);
    return response.data.data;
  },

  deleteExportModel: async (id: string): Promise<void> => {
    await api.delete(`/migration/models/export/${id}`);
  },

  shareExportModel: async (id: string, isShared: boolean): Promise<ExportModel> => {
    const response = await api.post(`/migration/models/export/${id}/share`, { isShared });
    return response.data.data;
  },

  // ─── Scheduled Jobs ────────────────────────────────────────────────────────
  getScheduledJobs: async (): Promise<ScheduledJob[]> => {
    const response = await api.get('/migration/schedules');
    return response.data.data;
  },

  createScheduledJob: async (
    data: Omit<ScheduledJob, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>
  ): Promise<ScheduledJob> => {
    const response = await api.post('/migration/schedules', data);
    return response.data.data;
  },

  updateScheduledJob: async (id: string, data: Partial<ScheduledJob>): Promise<ScheduledJob> => {
    const response = await api.put(`/migration/schedules/${id}`, data);
    return response.data.data;
  },

  deleteScheduledJob: async (id: string): Promise<void> => {
    await api.delete(`/migration/schedules/${id}`);
  },

  toggleScheduledJob: async (id: string, isActive: boolean): Promise<ScheduledJob> => {
    const response = await api.post(`/migration/schedules/${id}/toggle`, { isActive });
    return response.data.data;
  },

  runScheduledJobNow: async (id: string): Promise<void> => {
    await api.post(`/migration/schedules/${id}/run`);
  },

  getJobExecutions: async (id: string): Promise<JobExecution[]> => {
    const response = await api.get(`/migration/schedules/${id}/executions`);
    return response.data.data;
  },
};

export default migrationService;
