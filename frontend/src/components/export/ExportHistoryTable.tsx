import React from 'react';
import { ExportProcess } from '../../types/export.type';
import { formatBytes } from '../../utils/import.utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { SkeletonTable } from '../ui/Skeleton';
import { Download, Trash2, User, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExportHistoryTableProps {
  exports: ExportProcess[];
  loading: boolean;
  onDownload: (id: string, fileName: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
}

const getStatusBadge = (status: string) => {
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
    default:
      return {
        label: status,
        color: 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400',
        dot: 'bg-slate-400',
      };
  }
};

const formatDuration = (createdAt: string, updatedAt: string): string => {
  const diffMs = new Date(updatedAt).getTime() - new Date(createdAt).getTime();
  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
  return `${(diffMs / 60000).toFixed(1)}min`;
};

export const ExportHistoryTable: React.FC<ExportHistoryTableProps> = ({
  exports,
  loading,
  onDownload,
  onDelete,
  onViewDetails,
}) => {
  if (loading) return <SkeletonTable rows={5} cols={8} />;

  if (exports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-xl bg-card">
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-semibold text-foreground">Nenhuma exportação encontrada</p>
        <p className="text-xs text-muted-foreground mt-1">Nenhum arquivo foi exportado ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arquivo</TableHead>
            <TableHead>Módulos</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Data / Hora</TableHead>
            <TableHead>Tempo</TableHead>
            <TableHead className="text-center">Registros</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exports.map((item) => {
            const statusInfo = getStatusBadge(item.status);
            const userName = item.user?.profile
              ? `${item.user.profile.firstName} ${item.user.profile.lastName}`
              : item.user?.email || '—';

            return (
              <TableRow
                key={item.id}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer"
                onClick={() => onViewDetails(item.id)}
              >
                {/* Arquivo */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col min-w-0">
                    <span
                      className="font-semibold text-sm text-foreground truncate max-w-[200px]"
                      title={item.fileName || 'Gerando...'}
                    >
                      {item.fileName || 'Gerando arquivo...'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.sizeBytes ? formatBytes(item.sizeBytes) : '—'}
                    </span>
                  </div>
                </TableCell>

                {/* Módulos */}
                <TableCell>
                  <span
                    className="text-xs text-foreground truncate max-w-[150px] block"
                    title={item.modules}
                  >
                    {item.modules.split(',').join(', ')}
                  </span>
                </TableCell>

                {/* Usuário */}
                <TableCell>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <span
                      className="text-xs text-foreground truncate max-w-[120px]"
                      title={userName}
                    >
                      {userName}
                    </span>
                  </div>
                </TableCell>

                {/* Data / Hora */}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  <div>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</div>
                  <div className="text-[10px]">
                    {new Date(item.createdAt).toLocaleTimeString('pt-BR')}
                  </div>
                </TableCell>

                {/* Tempo */}
                <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {formatDuration(item.createdAt, item.updatedAt)}
                </TableCell>

                {/* Total de Registros */}
                <TableCell className="text-center font-mono font-bold text-sm">
                  {item.totalRows}
                </TableCell>

                {/* Status Badge */}
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusInfo.color}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                    {statusInfo.label}
                  </span>
                </TableCell>

                {/* Ações */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 justify-center">
                    {item.status === 'COMPLETED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20"
                        onClick={() => onDownload(item.id, item.fileName || 'export.zip')}
                        title="Baixar arquivo"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      onClick={() => onDelete(item.id)}
                      title="Excluir registro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExportHistoryTable;
