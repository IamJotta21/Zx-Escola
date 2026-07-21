import React, { useEffect, useState, useCallback } from 'react';
import { exportService } from '../../services/export.service';
import { ExportProcess } from '../../types/export.type';
import ExportHistoryTable from '../../components/export/ExportHistoryTable';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../contexts/ToastContext';
import { Spinner } from '../../components/ui/Loading';
import {
  RefreshCw,
  Plus,
  History,
  FileSpreadsheet,
  Download,
  Trash2,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Briefcase,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const formatDuration = (createdAt: string, updatedAt: string): string => {
  const diffMs = new Date(updatedAt).getTime() - new Date(createdAt).getTime();
  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
  return `${(diffMs / 60000).toFixed(1)}min`;
};

export const HistoricoExportacao: React.FC = () => {
  const { addToast } = useToast();
  const [exports, setExports] = useState<ExportProcess[]>([]);
  const [activeExport, setActiveExport] = useState<ExportProcess | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchExports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await exportService.getExports();
      setExports(data);
    } catch {
      addToast({
        type: 'error',
        title: 'Falha ao carregar histórico',
        message: 'Não foi possível carregar as exportações anteriores.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchExports();
  }, [fetchExports]);

  const handleOpenDetails = async (id: string) => {
    setSelectedId(id);
    try {
      const details = await exportService.getExportDetails(id);
      setActiveExport(details);
    } catch {
      addToast({
        type: 'error',
        title: 'Erro ao buscar detalhes',
        message: 'Não foi possível carregar os detalhes do registro.',
      });
    }
  };

  const handleCloseDetails = () => {
    setSelectedId(null);
    setActiveExport(null);
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      await exportService.downloadExportFile(id, fileName);
      addToast({
        type: 'success',
        title: 'Download iniciado',
        message: 'O download do arquivo foi iniciado com sucesso.',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Erro no download',
        message: 'Não foi possível baixar o arquivo do servidor.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        'Tem certeza que deseja remover esta exportação e seu arquivo físico permanentemente?'
      )
    )
      return;
    try {
      await exportService.deleteExport(id);
      addToast({
        type: 'success',
        title: 'Registro removido',
        message: 'A exportação foi excluída com sucesso.',
      });
      fetchExports();
      if (selectedId === id) handleCloseDetails();
    } catch {
      addToast({
        type: 'error',
        title: 'Erro ao excluir',
        message: 'Não foi possível remover a exportação.',
      });
    }
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'FAILED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 font-sans">
            <History className="h-7 w-7 text-primary" />
            Histórico de Exportações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Consulte o status de compactação, baixe arquivos gerados e monitore solicitações
            anteriores.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={fetchExports}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Link to="/exportacao-inteligente/nova">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Nova Exportação</Button>
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <ExportHistoryTable
            exports={exports}
            loading={loading}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onViewDetails={handleOpenDetails}
          />
        </CardContent>
      </Card>

      {/* Details Side Drawer */}
      <Drawer
        isOpen={!!selectedId}
        onClose={handleCloseDetails}
        title={`Detalhamento de Exportação #${selectedId?.substring(0, 8).toUpperCase() || ''}`}
        size="lg"
      >
        {activeExport ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="flex items-start gap-4 p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/30">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-foreground text-sm truncate"
                  title={activeExport.fileName || 'Gerando...'}
                >
                  {activeExport.fileName || 'Gerando arquivo de exportação...'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Formato: <strong className="text-foreground">{activeExport.format}</strong>
                  {' · '}
                  Filtro: <strong className="text-foreground">{activeExport.filterType}</strong>
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0 ${getStatusBadgeClasses(
                  activeExport.status
                )}`}
              >
                {activeExport.status === 'COMPLETED'
                  ? 'Concluído'
                  : activeExport.status === 'PENDING'
                    ? 'Pendente'
                    : activeExport.status === 'PROCESSING'
                      ? 'Processando'
                      : 'Falhou'}
              </span>
            </div>

            {/* General Specs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-card border text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Tamanho
                </span>
                <span className="text-sm font-extrabold text-foreground mt-1 block font-mono">
                  {activeExport.sizeBytes
                    ? `${(activeExport.sizeBytes / 1024).toFixed(1)} KB`
                    : '—'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-card border text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Linhas Totais
                </span>
                <span className="text-sm font-extrabold text-foreground mt-1 block font-mono">
                  {activeExport.totalRows}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-card border text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Tempo de Carga
                </span>
                <span className="text-sm font-extrabold text-foreground mt-1 block font-mono">
                  {formatDuration(activeExport.createdAt, activeExport.updatedAt)}
                </span>
              </div>
            </div>

            {/* Operator and Timestamps */}
            <div className="space-y-2 border-t pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span>
                  Operador:{' '}
                  <strong className="text-foreground">
                    {activeExport.user?.profile
                      ? `${activeExport.user.profile.firstName} ${activeExport.user.profile.lastName}`
                      : activeExport.user?.email || '—'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Iniciado em:{' '}
                  <strong className="text-foreground">
                    {new Date(activeExport.createdAt).toLocaleString('pt-BR')}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5" />
                <span>
                  Módulos:{' '}
                  <strong className="text-foreground select-all">
                    {activeExport.modules.split(',').join(', ')}
                  </strong>
                </span>
              </div>
            </div>

            {/* Timeline History */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Linha do Tempo de Processamento
              </h4>
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-border/60" />
                {activeExport.history
                  ?.slice()
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((evt) => (
                    <div key={evt.id} className="relative mb-3 last:mb-0">
                      <div className="absolute -left-[18px] top-1.5 h-2 w-2 rounded-full bg-border border border-background" />
                      <div className="p-3 rounded-xl border bg-card/60 flex items-start gap-2">
                        {evt.status === 'COMPLETED' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : evt.status === 'FAILED' ? (
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center flex-wrap gap-2 text-[10px]">
                            <strong className="text-foreground">
                              {evt.status === 'PENDING'
                                ? 'AGENDADO'
                                : evt.status === 'PROCESSING'
                                  ? 'GERANDO'
                                  : evt.status === 'COMPLETED'
                                    ? 'CONCLUÍDO'
                                    : 'FALHOU'}
                            </strong>
                            <span>{new Date(evt.createdAt).toLocaleTimeString('pt-BR')}</span>
                          </div>
                          {evt.details && (
                            <p className="text-[10px] text-muted-foreground mt-1">{evt.details}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="flex justify-between items-center border-t pt-4 mt-6">
              <Button
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800/40 dark:hover:bg-rose-950/20"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => handleDelete(activeExport.id)}
              >
                Excluir
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCloseDetails}>
                  Fechar
                </Button>
                {activeExport.status === 'COMPLETED' && (
                  <Button
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() =>
                      handleDownload(activeExport.id, activeExport.fileName || 'export.zip')
                    }
                  >
                    Baixar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Spinner size="md" />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default HistoricoExportacao;
