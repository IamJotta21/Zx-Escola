import React, { useState } from 'react';
import { ImportLog } from '../../types/import.type';
import { AlertCircle, CheckCircle, XCircle, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface ImportLogViewerProps {
  logs: ImportLog[];
}

export const ImportLogViewer: React.FC<ImportLogViewerProps> = ({ logs }) => {
  const [filter, setFilter] = useState<'ALL' | 'ERROR' | 'WARNING' | 'SUCCESS'>('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    // Role filter
    if (filter === 'ERROR' && log.status !== 'ERROR') return false;
    if (filter === 'WARNING' && log.status !== 'WARNING') return false;
    if (filter === 'SUCCESS' && log.status !== 'SUCCESS') return false;

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const messageMatch = log.message.toLowerCase().includes(q);
      const rowMatch = log.rowNumber?.toString().includes(q) || false;
      const detailsMatch = log.details?.toLowerCase().includes(q) || false;
      return messageMatch || rowMatch || detailsMatch;
    }

    return true;
  });

  const getLogIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          Relatório de Ocorrências
          <Badge variant="outline" className="font-mono text-[10px]">
            {filteredLogs.length} exibidos
          </Badge>
        </h3>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'ERROR', 'WARNING', 'SUCCESS'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`
                text-[10px] font-bold p-1 px-2.5 rounded-full transition-all border select-none
                ${
                  filter === type
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground border-border hover:bg-slate-50 dark:hover:bg-slate-800'
                }
              `}
            >
              {type === 'ALL'
                ? 'Todos'
                : type === 'ERROR'
                  ? 'Falhas'
                  : type === 'WARNING'
                    ? 'Avisos'
                    : 'Sucessos'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <Input
        placeholder="Buscar ocorrências por linha, mensagem ou coluna..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
      />

      <div className="max-h-[350px] overflow-y-auto rounded-2xl border border-border/80 bg-card divide-y select-text">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-xs leading-relaxed">
            Nenhuma ocorrência encontrada para os filtros aplicados.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 flex items-start gap-3 hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors"
            >
              {getLogIcon(log.status)}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-foreground">
                  <span>{log.rowNumber ? `Linha ${log.rowNumber}` : 'Configuração Geral'}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{log.message}</p>
                {log.details && (
                  <pre className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-[10px] font-mono text-muted-foreground max-w-full overflow-x-auto whitespace-pre-wrap leading-tight border">
                    {log.details}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ImportLogViewer;
