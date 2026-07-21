import React, { useEffect, useState } from 'react';
import { useImport } from '../../hooks/useImport';
import ImportHistoryTable from '../../components/import/ImportHistoryTable';
import ImportLogViewer from '../../components/import/ImportLogViewer';
import ImportAuditTimeline from '../../components/import/ImportAuditTimeline';
import ImportRecoveryPanel from '../../components/import/ImportRecoveryPanel';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import {
  RefreshCw,
  FileSpreadsheet,
  ArrowLeft,
  History,
  ScrollText,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

type DetailTab = 'logs' | 'audit' | 'recovery';

export const HistoricoImportacao: React.FC = () => {
  const {
    imports,
    activeImport,
    loading,
    fetchImports,
    fetchImportDetails,
    getStatusDetails,
    getEntityLabel,
  } = useImport();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('logs');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchImports();
    const query = new URLSearchParams(location.search);
    const id = query.get('id');
    if (id) {
      setSelectedId(id);
      fetchImportDetails(id);
    }
  }, [fetchImports, fetchImportDetails, location.search]);

  const handleOpenDetails = (id: string) => {
    setSelectedId(id);
    setActiveTab('logs');
    navigate(`/importacao-inteligente/historico?id=${id}`);
    fetchImportDetails(id);
  };

  const handleCloseDetails = () => {
    setSelectedId(null);
    navigate('/importacao-inteligente/historico');
  };

  const handleReprocess = async (id: string) => {
    handleOpenDetails(id);
    setActiveTab('recovery');
  };

  const statusInfo = activeImport ? getStatusDetails(activeImport.status) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          to="/importacao-inteligente/dashboard"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold w-fit transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao Painel Geral
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <History className="h-7 w-7 text-primary" />
              Histórico de Importações
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Consulte logs, trilha de auditoria e gerencie recuperação de lotes anteriores.
            </p>
          </div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => fetchImports()}
            disabled={loading}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* History Table */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          <ImportHistoryTable
            imports={imports}
            loading={loading}
            onViewDetails={handleOpenDetails}
            onReprocess={handleReprocess}
          />
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Drawer
        isOpen={!!(selectedId && activeImport)}
        onClose={handleCloseDetails}
        title={`Lote #${activeImport?.id.substring(0, 8).toUpperCase() || '—'}`}
        size="lg"
      >
        {activeImport && statusInfo && (
          <div className="space-y-6">
            {/* File & Meta Summary */}
            <div className="flex items-start gap-4 p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/30">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-sm truncate">
                  {activeImport.file?.fileName || 'Arquivo desconhecido'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeImport.model
                    ? getEntityLabel(activeImport.model.targetEntity)
                    : 'Sem modelo'}
                  {' · '}
                  {new Date(activeImport.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0 ${statusInfo.color}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-card border text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Total
                </span>
                <span className="text-lg font-extrabold text-foreground mt-0.5 block font-mono">
                  {activeImport.totalRows}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
                  Sucesso
                </span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">
                  {activeImport.successRows}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-500/20 text-center">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold block">
                  Erros
                </span>
                <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 block font-mono">
                  {activeImport.errorRows}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-card border text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Taxa
                </span>
                <span className="text-lg font-extrabold text-foreground mt-0.5 block font-mono">
                  {activeImport.totalRows > 0
                    ? `${Math.round((activeImport.successRows / activeImport.totalRows) * 100)}%`
                    : '—'}
                </span>
              </div>
            </div>

            {/* Operator Info */}
            {activeImport.user && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>
                  Operador:{' '}
                  <strong className="text-foreground">
                    {activeImport.user.profile
                      ? `${activeImport.user.profile.firstName} ${activeImport.user.profile.lastName}`
                      : activeImport.user.email}
                  </strong>
                </span>
                <Clock className="h-3.5 w-3.5 ml-3" />
                <span>
                  Iniciado em:{' '}
                  <strong className="text-foreground">
                    {new Date(activeImport.createdAt).toLocaleString('pt-BR')}
                  </strong>
                </span>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-border/50">
              {(
                [
                  {
                    key: 'logs',
                    label: 'Logs de Linhas',
                    icon: <ScrollText className="h-3.5 w-3.5" />,
                  },
                  { key: 'audit', label: 'Auditoria', icon: <History className="h-3.5 w-3.5" /> },
                  {
                    key: 'recovery',
                    label: 'Recuperação',
                    icon: <RotateCcw className="h-3.5 w-3.5" />,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all -mb-px ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {activeTab === 'logs' && <ImportLogViewer logs={activeImport.logs || []} />}

              {activeTab === 'audit' && (
                <ImportAuditTimeline history={activeImport.history || []} />
              )}

              {activeTab === 'recovery' && (
                <ImportRecoveryPanel
                  importProcess={activeImport}
                  onReprocessed={() => {
                    fetchImportDetails(activeImport.id);
                    fetchImports();
                  }}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center border-t border-border/40 pt-4 mt-2">
              <div className="flex gap-2">
                {activeImport.status === 'COMPLETED' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Importação bem-sucedida
                  </span>
                )}
                {activeImport.status === 'FAILED' && (
                  <span className="flex items-center gap-1 text-xs text-rose-600 font-semibold">
                    <XCircle className="h-4 w-4" /> Importação com falha
                  </span>
                )}
                {activeImport.status === 'PAUSED' && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                    <AlertTriangle className="h-4 w-4" /> Importação pausada
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleCloseDetails}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default HistoricoImportacao;
