import api from './api';
import { ExportProcess } from '../types/export.type';

export const exportService = {
  getExports: async (): Promise<ExportProcess[]> => {
    const response = await api.get('/exports');
    return response.data.data;
  },

  getExportDetails: async (id: string): Promise<ExportProcess> => {
    const response = await api.get(`/exports/${id}`);
    return response.data.data;
  },

  startExport: async (payload: {
    format: string;
    modules: string[];
    filterType: string;
    filterParams?: Record<string, unknown>;
  }): Promise<ExportProcess> => {
    const response = await api.post('/exports/start', payload);
    return response.data.data;
  },

  deleteExport: async (id: string): Promise<void> => {
    await api.delete(`/exports/${id}`);
  },

  downloadExportFile: async (id: string, fileName: string): Promise<void> => {
    const response = await api.get(`/exports/${id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default exportService;
