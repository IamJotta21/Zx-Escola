import React from 'react';
import { FileSpreadsheet, X, Check, Database } from 'lucide-react';
import { formatBytes } from '../../utils/import.utils';
import { Button } from '../ui/Button';

interface FileCardProps {
  fileName: string;
  fileSize: number;
  onRemove: () => void;
  rowsCount?: number;
  colsCount?: number;
}

export const FileCard: React.FC<FileCardProps> = ({
  fileName,
  fileSize,
  onRemove,
  rowsCount = 150,
  colsCount = 8,
}) => {
  return (
    <div className="flex flex-col p-4 rounded-2xl border bg-card border-primary/20 hover:shadow-md transition-all duration-200 gap-3 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-2.5 h-full bg-primary" />

      <div className="flex items-center justify-between pl-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span
              className="text-sm font-extrabold text-foreground block truncate"
              title={fileName}
            >
              {fileName}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5 block">
              {formatBytes(fileSize)}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 shrink-0 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          onClick={onRemove}
          title="Excluir arquivo"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-rose-600" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 pl-2 mt-1 border-t dark:border-border/40 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Database className="h-3.5 w-3.5 text-primary/80" />
          <span>
            Registros: <strong className="text-foreground">{rowsCount} linhas</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          <span>
            Colunas: <strong className="text-foreground">{colsCount} identificadas</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
