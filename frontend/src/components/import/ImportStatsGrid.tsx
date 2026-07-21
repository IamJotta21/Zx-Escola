import React from 'react';
import { ImportDashboardStats } from '../../types/import.type';
import { Card, CardContent } from '../ui/Card';
import { FileSpreadsheet, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface ImportStatsGridProps {
  stats: ImportDashboardStats | null;
  loading: boolean;
}

export const ImportStatsGrid: React.FC<ImportStatsGridProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="mt-4 h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="mt-2 h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Total de Lotes',
      value: stats.totalImports,
      icon: FileSpreadsheet,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20',
      description: 'Lotes de arquivos enviados',
    },
    {
      title: 'Em Fila / Processando',
      value: stats.pending + stats.processing,
      icon: RefreshCw,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20',
      description: 'Aguardando processamento',
    },
    {
      title: 'Registros com Sucesso',
      value: stats.successRows,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
      description: 'Cadastros criados',
    },
    {
      title: 'Falhas / Erros de Linha',
      value: stats.errorRows,
      icon: XCircle,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20',
      description: 'Linhas descartadas ou erradas',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card
            key={idx}
            className="overflow-hidden border-border/60 hover:shadow-md transition-all duration-200"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${item.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">
                  {item.title}
                </span>
                <span className="text-2xl font-extrabold text-foreground mt-0.5 block">
                  {item.value}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                  {item.description}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ImportStatsGrid;
