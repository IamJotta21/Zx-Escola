import React from 'react';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  File,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { formatBytes } from '../../utils/import.utils';
import { Button } from '../ui/Button';

export interface FileUploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'PENDING' | 'UPLOADING' | 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  uploadDate: Date;
}

interface UploadCardProps {
  files: FileUploadItem[];
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onCancelUpload: (id: string) => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  files,
  onRemove,
  onMoveUp,
  onMoveDown,
  onCancelUpload,
}) => {
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'xlsx':
      case 'xls':
      case 'ods':
      case 'csv':
        return <FileSpreadsheet className="h-8 w-8 text-emerald-500 shrink-0" />;
      case 'json':
        return <FileCode className="h-8 w-8 text-amber-500 shrink-0" />;
      case 'xml':
        return <FileCode className="h-8 w-8 text-blue-500 shrink-0" />;
      case 'zip':
        return <FileArchive className="h-8 w-8 text-purple-500 shrink-0" />;
      case 'txt':
        return <FileText className="h-8 w-8 text-slate-500 shrink-0" />;
      default:
        return <File className="h-8 w-8 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-3">
      {files.map((item, idx) => {
        const isPending = item.status === 'PENDING';
        const isUploading = item.status === 'UPLOADING';
        const isSuccess = item.status === 'SUCCESS';
        const isError = item.status === 'ERROR';

        return (
          <div
            key={item.id}
            className={`
              p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden bg-card
              ${isSuccess ? 'border-emerald-500/20 dark:border-emerald-500/10' : ''}
              ${isError ? 'border-rose-500/20 dark:border-rose-500/10 bg-rose-50/5 dark:bg-rose-950/5' : ''}
              ${isUploading ? 'border-primary/20 bg-primary/5 dark:bg-primary/5' : 'border-border/60 hover:shadow-xs'}
            `}
          >
            {/* Visual indicators */}
            {isSuccess && <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />}
            {isError && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />}
            {isUploading && (
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary animate-pulse" />
            )}

            {/* File info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border">
                {getFileIcon(item.file.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-extrabold text-foreground truncate block max-w-sm"
                    title={item.file.name}
                  >
                    {item.file.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 p-0.5 px-1.5 rounded-sm font-mono">
                    {item.file.name.split('.').pop() || 'file'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                  <span>{formatBytes(item.file.size)}</span>
                  <span>•</span>
                  <span>
                    {item.uploadDate.toLocaleDateString('pt-BR')}{' '}
                    {item.uploadDate.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Progress bar for uploading */}
                {(isUploading || isPending) && (
                  <div className="w-full mt-3 space-y-1">
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                      <span>{item.progress}% enviado</span>
                    </div>
                  </div>
                )}

                {/* Error status info */}
                {isError && item.errorMessage && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 mt-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium">{item.errorMessage}</span>
                  </div>
                )}

                {/* Success status info */}
                {isSuccess && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-semibold">Upload completo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions list */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              {/* Priority Reordering controls */}
              <div className="flex flex-col gap-0.5 mr-2">
                <button
                  type="button"
                  onClick={() => onMoveUp(idx)}
                  disabled={idx === 0 || isUploading}
                  className="p-1 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 text-muted-foreground"
                  title="Mover para cima"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(idx)}
                  disabled={idx === files.length - 1 || isUploading}
                  className="p-1 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 text-muted-foreground"
                  title="Mover para baixo"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>

              {isUploading ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-rose-600 border-rose-500/20 hover:bg-rose-50"
                  onClick={() => onCancelUpload(item.id)}
                  leftIcon={<X className="h-3.5 w-3.5" />}
                >
                  Cancelar
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600"
                  onClick={() => onRemove(item.id)}
                  title="Excluir arquivo"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-600" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UploadCard;
