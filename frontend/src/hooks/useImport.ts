import { useContext } from 'react';
import { ImportContext } from '../contexts/ImportContext';
import api from '../services/api';

export const useImport = () => {
  const context = useContext(ImportContext);
  if (context === undefined) {
    throw new Error('useImport deve ser utilizado dentro de um ImportProvider');
  }

  // ─── Status helpers ─────────────────────────────────────────────────────────
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pendente',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
          dot: 'bg-amber-500',
        };
      case 'PROCESSING':
        return {
          label: 'Processando',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          dot: 'bg-blue-500',
        };
      case 'PAUSED':
        return {
          label: 'Pausado',
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          dot: 'bg-orange-500',
        };
      case 'COMPLETED':
        return {
          label: 'Concluído',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
          dot: 'bg-emerald-500',
        };
      case 'FAILED':
        return {
          label: 'Falhou',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
          dot: 'bg-rose-500',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelado',
          color: 'bg-slate-100 text-slate-700 dark:bg-slate-800/30 dark:text-slate-400',
          dot: 'bg-slate-400',
        };
      default:
        return {
          label: status,
          color: 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400',
          dot: 'bg-slate-400',
        };
    }
  };

  // ─── Entity label helper ────────────────────────────────────────────────────
  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'STUDENT':
        return 'Alunos';
      case 'TEACHER':
        return 'Professores';
      case 'GUARDIAN':
        return 'Responsáveis';
      case 'CLASS':
        return 'Turmas';
      case 'ROOM':
        return 'Salas/Ambientes';
      default:
        return entity;
    }
  };

  // ─── Recovery actions ───────────────────────────────────────────────────────
  const reprocessImport = async (id: string) => {
    const res = await api.post(`/imports/${id}/reprocess`);
    return res.data;
  };

  const listBackups = async () => {
    const res = await api.get('/imports/backups');
    return res.data?.data || [];
  };

  const restoreBackup = async (backupName: string) => {
    const res = await api.post('/imports/backups/restore', { backupName });
    return res.data;
  };

  return {
    ...context,
    getStatusDetails,
    getEntityLabel,
    reprocessImport,
    listBackups,
    restoreBackup,
  };
};

export default useImport;
