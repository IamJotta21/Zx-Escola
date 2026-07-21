import api from './api';
import { ImportModel, ImportProcess, ImportDashboardStats } from '../types/import.type';

export const importService = {
  getStats: async (): Promise<ImportDashboardStats> => {
    const response = await api.get('/imports/stats');
    return response.data.data;
  },

  getModels: async (): Promise<ImportModel[]> => {
    const response = await api.get('/imports/models');
    return response.data.data;
  },

  createModel: async (
    data: Omit<ImportModel, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ImportModel> => {
    const response = await api.post('/imports/models', data);
    return response.data.data;
  },

  getImports: async (): Promise<ImportProcess[]> => {
    const response = await api.get('/imports');
    return response.data.data;
  },

  getImportDetails: async (id: string): Promise<ImportProcess> => {
    const response = await api.get(`/imports/${id}`);
    return response.data.data;
  },

  startImport: async (
    modelId: string,
    fileData?: { fileName: string; filePath: string; fileSize: number; mimeType?: string }
  ): Promise<ImportProcess> => {
    // Boilerplate start import call
    const payload = {
      modelId,
      file: fileData || {
        fileName: 'import_alunos.xlsx',
        filePath: 'uploads/imports/import_alunos.xlsx',
        fileSize: 45600,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    };
    const response = await api.post('/imports/start', payload);
    return response.data.data;
  },
};

export default importService;
