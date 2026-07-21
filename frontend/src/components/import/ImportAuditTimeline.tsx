import React from 'react';
import { ImportHistory } from '../../types/import.type';
import { CheckCircle2, XCircle, RefreshCw, Clock, Loader, PauseCircle, Ban } from 'lucide-react';

interface ImportAuditTimelineProps {
  history: ImportHistory[];
}

const getEventIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'FAILED':
      return <XCircle className="h-4 w-4 text-rose-500" />;
    case 'PROCESSING':
      return <RefreshCw className="h-4 w-4 text-blue-500" />;
    case 'PAUSED':
      return <PauseCircle className="h-4 w-4 text-amber-500" />;
    case 'CANCELLED':
      return <Ban className="h-4 w-4 text-slate-500" />;
    case 'PENDING':
      return <Loader className="h-4 w-4 text-amber-400" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getEventColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
      return 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40';
    case 'FAILED':
      return 'border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800/40';
    case 'PROCESSING':
      return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800/40';
    case 'PAUSED':
      return 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40';
    case 'CANCELLED':
      return 'border-slate-200 bg-slate-50 dark:bg-slate-900/40 dark:border-slate-700/40';
    default:
      return 'border-border bg-card';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Agendada na fila';
    case 'PROCESSING':
      return 'Processamento iniciado';
    case 'PAUSED':
      return 'Pausada pelo operador';
    case 'COMPLETED':
      return 'Concluída com sucesso';
    case 'FAILED':
      return 'Falha crítica detectada';
    case 'CANCELLED':
      return 'Cancelada pelo operador';
    default:
      return status;
  }
};

export const ImportAuditTimeline: React.FC<ImportAuditTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
        Nenhum evento de auditoria registrado para esta importação.
      </div>
    );
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        Linha do Tempo de Auditoria
      </h4>
      <div className="relative pl-6">
        {/* Vertical connector line */}
        <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border/60" />

        {sorted.map((event) => (
          <div key={event.id} className="relative mb-3 last:mb-0">
            {/* Timeline dot */}
            <div className="absolute -left-[15px] top-3 h-3 w-3 rounded-full border-2 border-background bg-border" />

            <div className={`p-3 rounded-xl border transition-all ${getEventColor(event.status)}`}>
              <div className="flex items-start gap-2.5">
                {getEventIcon(event.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-foreground">
                      {getStatusLabel(event.status)}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(event.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {event.details && (
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {event.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImportAuditTimeline;
