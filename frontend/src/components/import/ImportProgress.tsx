import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Loader, Pause, Play, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ImportProgressProps {
  progressPercent: number;
  processedRows: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAUSED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({
  progressPercent,
  processedRows,
  totalRows,
  successCount,
  errorCount,
  status,
  onPause,
  onResume,
  onCancel,
}) => {
  const [speed, setSpeed] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Calculate speed and ETA dynamically
  useEffect(() => {
    if (status === 'PROCESSING') {
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
      if (elapsedSec > 0.5 && processedRows > 0) {
        const currentSpeed = processedRows / elapsedSec;
        setSpeed(Math.round(currentSpeed * 10) / 10);

        const remaining = totalRows - processedRows;
        setEta(currentSpeed > 0 ? Math.ceil(remaining / currentSpeed) : 0);
      }
    } else {
      // Reset timer if not processing
      startTimeRef.current = Date.now();
    }
  }, [processedRows, status, totalRows]);

  const getStatusMessage = () => {
    switch (status) {
      case 'PENDING':
        return 'Aguardando na fila do servidor...';
      case 'PROCESSING':
        return 'Processando e gravando lote no banco...';
      case 'PAUSED':
        return 'Importação pausada pelo operador.';
      case 'CANCELLED':
        return 'Importação cancelada e revertida.';
      case 'COMPLETED':
        return 'Importação concluída com sucesso!';
      case 'FAILED':
        return 'Falha crítica. Transação revertida.';
      default:
        return 'Processando...';
    }
  };

  const getThemeColor = () => {
    switch (status) {
      case 'PENDING':
      case 'PAUSED':
        return 'from-amber-500 to-yellow-400 bg-amber-500/20';
      case 'PROCESSING':
        return 'from-blue-600 to-indigo-500 bg-primary/20';
      case 'COMPLETED':
        return 'from-emerald-600 to-teal-500 bg-emerald-500/20';
      case 'FAILED':
      case 'CANCELLED':
        return 'from-rose-600 to-red-500 bg-rose-500/20';
    }
  };

  return (
    <div className="space-y-5 p-6 rounded-2xl border bg-card border-border/80 shadow-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {status === 'PROCESSING' && (
            <RefreshCw className="h-4.5 w-4.5 text-blue-500 animate-spin" />
          )}
          {status === 'PENDING' && <Loader className="h-4.5 w-4.5 text-amber-500 animate-pulse" />}
          {status === 'PAUSED' && <Pause className="h-4.5 w-4.5 text-amber-500" />}
          {status === 'COMPLETED' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          {(status === 'FAILED' || status === 'CANCELLED') && (
            <XCircle className="h-5 w-5 text-rose-500" />
          )}
          <span className="text-sm font-black text-foreground">{getStatusMessage()}</span>
        </div>

        {status === 'PROCESSING' && speed > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              Velocidade: <strong className="text-foreground">{speed} reg/s</strong>
            </span>
            <span>
              ETA: <strong className="text-foreground">{eta}s</strong>
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${getThemeColor()}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/20 border">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Processados
          </span>
          <span className="text-base font-extrabold text-foreground mt-0.5 block font-mono">
            {processedRows} / {totalRows}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-500/10">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">
            Sucessos
          </span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">
            {successCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/30 dark:bg-rose-950/10 border border-rose-500/10">
          <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold block">
            Erros
          </span>
          <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 block font-mono">
            {errorCount}
          </span>
        </div>
      </div>

      {/* Fila / Queue Control Buttons */}
      {(status === 'PROCESSING' || status === 'PAUSED') && (
        <div className="flex gap-2 justify-end border-t border-border/40 pt-4 mt-2">
          {status === 'PROCESSING' && onPause && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Pause className="h-3.5 w-3.5" />}
              onClick={onPause}
            >
              Pausar Importação
            </Button>
          )}

          {status === 'PAUSED' && onResume && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play className="h-3.5 w-3.5" />}
              onClick={onResume}
            >
              Continuar
            </Button>
          )}

          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              leftIcon={<X className="h-3.5 w-3.5" />}
              onClick={onCancel}
            >
              Cancelar Lote
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportProgress;
