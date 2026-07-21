import React from 'react';
import { ImportProcess } from '../../types/import.type';
import { formatBytes } from '../../utils/import.utils';
import { useImport } from '../../hooks/useImport';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { SkeletonTable } from '../ui/Skeleton';
import { Eye, FileSpreadsheet, RefreshCw, User } from 'lucide-react';
import { Button } from '../ui/Button';

interface ImportHistoryTableProps {
  imports: ImportProcess[];
  loading: boolean;
  onViewDetails: (id: string) => void;
  onReprocess?: (id: string) => void;
}

const formatDuration = (createdAt: string, updatedAt: string): string => {
  const diffMs = new Date(updatedAt).getTime() - new Date(createdAt).getTime();
  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
  return `${(diffMs / 60000).toFixed(1)}min`;
};

export const ImportHistoryTable: React.FC<ImportHistoryTableProps> = ({
  imports,
  loading,
  onViewDetails,
  onReprocess,
}) => {
  const { getStatusDetails, getEntityLabel } = useImport();

  if (loading) return <SkeletonTable rows={5} cols={7} />;

  if (imports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-xl bg-card">
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-semibold text-foreground">Nenhuma importação encontrada</p>
        <p className="text-xs text-muted-foreground mt-1">
          Nenhum lote foi registrado no sistema ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Arquivo</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Entidade</TableHead>
            <TableHead>Data / Hora</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead className="text-center">Registros</TableHead>
            <TableHead className="text-center">✔ / ✖</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {imports.map((item) => {
            const statusInfo = getStatusDetails(item.status);
            const canReprocess = item.status === 'FAILED' || item.status === 'CANCELLED';
            const userName = item.user?.profile
              ? `${item.user.profile.firstName} ${item.user.profile.lastName}`
              : item.user?.email || '—';

            return (
              <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                {/* Arquivo */}
                <TableCell>
                  <div className="flex flex-col min-w-0">
                    <span
                      className="font-semibold text-sm text-foreground truncate max-w-[180px]"
                      title={item.file?.fileName}
                    >
                      {item.file?.fileName || 'Sem nome'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.file?.fileSize ? formatBytes(item.file.fileSize) : '—'}
                    </span>
                  </div>
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

                {/* Entidade */}
                <TableCell>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-card text-foreground">
                    {item.model ? getEntityLabel(item.model.targetEntity) : 'Manual'}
                  </span>
                </TableCell>

                {/* Data / Hora */}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  <div>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</div>
                  <div className="text-[10px]">
                    {new Date(item.createdAt).toLocaleTimeString('pt-BR')}
                  </div>
                </TableCell>

                {/* Duração */}
                <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {formatDuration(item.createdAt, item.updatedAt)}
                </TableCell>

                {/* Total de Registros */}
                <TableCell className="text-center font-mono font-bold text-sm">
                  {item.totalRows}
                </TableCell>

                {/* Sucesso / Erros */}
                <TableCell className="text-center font-mono text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {item.successRows}
                  </span>
                  <span className="mx-1 text-muted-foreground">/</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {item.errorRows}
                  </span>
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
                <TableCell>
                  <div className="flex items-center gap-1 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => onViewDetails(item.id)}
                      title="Visualizar detalhes e logs"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    {canReprocess && onReprocess && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        onClick={() => onReprocess(item.id)}
                        title="Reprocessar importação"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
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

export default ImportHistoryTable;
