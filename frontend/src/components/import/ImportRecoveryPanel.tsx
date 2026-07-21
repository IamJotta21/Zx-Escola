import React, { useCallback, useEffect, useState } from 'react';
import { BackupFile, ImportProcess } from '../../types/import.type';
import { useImport } from '../../hooks/useImport';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { formatBytes } from '../../utils/import.utils';
import {
  RefreshCw,
  Database,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

interface ImportRecoveryPanelProps {
  importProcess: ImportProcess;
  onReprocessed?: () => void;
}

export const ImportRecoveryPanel: React.FC<ImportRecoveryPanelProps> = ({
  importProcess,
  onReprocessed,
}) => {
  const { reprocessImport, listBackups, restoreBackup } = useImport();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canReprocess = importProcess.status === 'FAILED' || importProcess.status === 'CANCELLED';

  const fetchBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const data = await listBackups();
      setBackups(data);
      if (data.length > 0) setSelectedBackup(data[0].name);
    } catch {
      // Ignore
    } finally {
      setLoadingBackups(false);
    }
  }, [listBackups]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleReprocess = async () => {
    setReprocessing(true);
    setMessage(null);
    try {
      await reprocessImport(importProcess.id);
      setMessage({ type: 'success', text: 'Reprocessamento iniciado com sucesso!' });
      onReprocessed?.();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMessage({
        type: 'error',
        text: e?.response?.data?.message || 'Erro ao iniciar reprocessamento',
      });
    } finally {
      setReprocessing(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    if (
      !window.confirm(
        `Tem certeza? O banco de dados será SUBSTITUÍDO pelo backup:\n${selectedBackup}\n\nEsta ação é irreversível!`
      )
    )
      return;

    setRestoring(true);
    setMessage(null);
    try {
      await restoreBackup(selectedBackup);
      setMessage({
        type: 'success',
        text: `Banco restaurado com sucesso a partir de: ${selectedBackup}`,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setMessage({
        type: 'error',
        text: e?.response?.data?.message || 'Erro ao restaurar backup',
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-5">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <RotateCcw className="h-3.5 w-3.5" />
        Central de Recuperação
      </h4>

      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>
          {message.text}
        </Alert>
      )}

      {/* Reprocess Section */}
      <div className="p-4 rounded-2xl border bg-card space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-bold text-foreground">Reprocessar Importação</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Reinicia o processamento desta importação do início, mantendo os mesmos arquivos e modelo
          de mapeamento já configurados.
        </p>
        {canReprocess ? (
          <Button
            variant="primary"
            size="sm"
            leftIcon={
              reprocessing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )
            }
            disabled={reprocessing}
            onClick={handleReprocess}
          >
            {reprocessing ? 'Iniciando reprocessamento...' : 'Reprocessar Agora'}
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Esta importação não está em estado de falha. Reprocessamento não é necessário.
          </div>
        )}
      </div>

      {/* Restore Backup Section */}
      <div className="p-4 rounded-2xl border bg-card space-y-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-bold text-foreground">Restaurar Backup do Banco</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Substitui o banco de dados atual por uma cópia de segurança criada antes de uma importação
          anterior. Esta operação{' '}
          <strong className="text-rose-500">apaga todos os dados gravados após o backup</strong>.
        </p>

        {loadingBackups ? (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Carregando backups...
          </div>
        ) : backups.length === 0 ? (
          <div className="text-xs text-muted-foreground">Nenhum backup disponível no servidor.</div>
        ) : (
          <div className="space-y-2">
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {backups.map((b) => (
                <label
                  key={b.name}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedBackup === b.name
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-slate-50 dark:hover:bg-slate-900/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="backup"
                    value={b.name}
                    checked={selectedBackup === b.name}
                    onChange={() => setSelectedBackup(b.name)}
                    className="text-primary"
                  />
                  <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatBytes(b.sizeBytes)} — {new Date(b.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/10">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Esta ação substituirá o banco de dados. Certifique-se de que o servidor está parado.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800/40 dark:hover:bg-rose-950/20"
              leftIcon={
                restoring ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )
              }
              disabled={restoring || !selectedBackup}
              onClick={handleRestore}
            >
              {restoring ? 'Restaurando...' : 'Restaurar Backup Selecionado'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportRecoveryPanel;
