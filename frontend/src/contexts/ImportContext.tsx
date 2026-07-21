/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback } from 'react';
import { ImportModel, ImportProcess, ImportDashboardStats } from '../types/import.type';
import importService from '../services/import.service';
import { useToast } from './ToastContext';

interface ImportContextType {
  stats: ImportDashboardStats | null;
  models: ImportModel[];
  imports: ImportProcess[];
  activeImport: ImportProcess | null;
  loading: boolean;
  fetchStats: () => Promise<void>;
  fetchModels: () => Promise<void>;
  fetchImports: () => Promise<void>;
  fetchImportDetails: (id: string) => Promise<void>;
  createModel: (data: Omit<ImportModel, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  startImport: (
    modelId: string,
    fileData?: { fileName: string; filePath: string; fileSize: number; mimeType?: string }
  ) => Promise<void>;
}

export const ImportContext = createContext<ImportContextType | undefined>(undefined);

export const ImportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [stats, setStats] = useState<ImportDashboardStats | null>(null);
  const [models, setModels] = useState<ImportModel[]>([]);
  const [imports, setImports] = useState<ImportProcess[]>([]);
  const [activeImport, setActiveImport] = useState<ImportProcess | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await importService.getStats();
      setStats(data);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao carregar estatísticas',
        message: 'Não foi possível carregar os dados do painel de importação.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await importService.getModels();
      setModels(data);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao carregar modelos',
        message: 'Não foi possível buscar os modelos de importação configurados.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchImports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await importService.getImports();
      setImports(data);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao carregar histórico',
        message: 'Não foi possível listar as importações realizadas.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchImportDetails = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const data = await importService.getImportDetails(id);
        setActiveImport(data);
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Erro ao carregar detalhes',
          message: 'Não foi possível carregar as informações do lote de importação.',
        });
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );

  const createModel = useCallback(
    async (data: Omit<ImportModel, 'id' | 'createdAt' | 'updatedAt'>) => {
      setLoading(true);
      try {
        await importService.createModel(data);
        addToast({
          type: 'success',
          title: 'Modelo criado com sucesso',
          message: `O modelo "${data.name}" foi registrado para uso.`,
        });
        await fetchModels();
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Erro ao criar modelo',
          message: 'Ocorreu uma falha ao cadastrar o modelo de importação.',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [addToast, fetchModels]
  );

  const startImport = useCallback(
    async (
      modelId: string,
      fileData?: { fileName: string; filePath: string; fileSize: number; mimeType?: string }
    ) => {
      setLoading(true);
      try {
        const process = await importService.startImport(modelId, fileData);
        addToast({
          type: 'success',
          title: 'Importação iniciada',
          message: 'O arquivo foi recebido e está aguardando processamento.',
        });
        setActiveImport(process);
        await fetchImports();
        await fetchStats();
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Erro ao iniciar importação',
          message: 'Não foi possível inicializar a importação.',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [addToast, fetchImports, fetchStats]
  );

  return (
    <ImportContext.Provider
      value={{
        stats,
        models,
        imports,
        activeImport,
        loading,
        fetchStats,
        fetchModels,
        fetchImports,
        fetchImportDetails,
        createModel,
        startImport,
      }}
    >
      {children}
    </ImportContext.Provider>
  );
};
