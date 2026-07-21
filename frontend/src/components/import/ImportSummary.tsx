import React from 'react';
import { CheckCircle2, XCircle, PlayCircle, BarChart3 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ImportSummaryProps {
  successRows: number;
  errorRows: number;
  totalRows: number;
  onRestart: () => void;
  onGoToHistory: () => void;
}

export const ImportSummary: React.FC<ImportSummaryProps> = ({
  successRows,
  errorRows,
  totalRows,
  onRestart,
  onGoToHistory,
}) => {
  const successRate = totalRows > 0 ? ((successRows / totalRows) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 text-center max-w-xl mx-auto py-4">
      {/* Visual Success Indicator Check */}
      <div className="inline-flex p-4 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 mb-2 scale-110">
        <CheckCircle2 className="h-12 w-12" />
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight font-sans">
          Processamento Finalizado!
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
          O lote foi lido e persistido no banco de dados com uma taxa de conversão de{' '}
          <strong>{successRate}%</strong>.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/20 border text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Enviados
          </span>
          <span className="text-xl font-extrabold text-foreground mt-1 block font-mono">
            {totalRows}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-500/10 text-center">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
            Sucessos
          </span>
          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
            {successRows}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/20 dark:bg-rose-950/10 border border-rose-500/10 text-center">
          <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold block">
            Erros
          </span>
          <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 block font-mono">
            {errorRows}
          </span>
        </div>
      </div>

      {errorRows > 0 && (
        <div className="p-4 rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/5 text-left flex gap-3">
          <XCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground block mb-0.5">
              Alguns registros falharam na validação
            </span>
            Foram encontradas {errorRows} linhas com dados incompatíveis (ex: CPFs duplicados ou
            emails com formato inválido). Você pode exportar o relatório de inconsistências para
            corrigir as linhas e reenviá-las.
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4 border-t dark:border-border/40">
        <Button
          variant="outline"
          leftIcon={<PlayCircle className="h-4 w-4" />}
          onClick={onRestart}
          className="w-full sm:w-auto"
        >
          Nova Importação
        </Button>
        <Button
          leftIcon={<BarChart3 className="h-4 w-4" />}
          onClick={onGoToHistory}
          className="w-full sm:w-auto"
        >
          Ver Histórico Lotes
        </Button>
      </div>
    </div>
  );
};

export default ImportSummary;
