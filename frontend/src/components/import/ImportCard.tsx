import React from 'react';
import { ImportProcess } from '../../types/import.type';
import { formatBytes } from '../../utils/import.utils';
import { useImport } from '../../hooks/useImport';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Calendar, Eye } from 'lucide-react';

interface ImportCardProps {
  item: ImportProcess;
  onViewDetails: (id: string) => void;
}

export const ImportCard: React.FC<ImportCardProps> = ({ item, onViewDetails }) => {
  const { getStatusDetails, getEntityLabel } = useImport();
  const statusInfo = getStatusDetails(item.status);

  return (
    <Card className="border-border/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/30 to-primary group-hover:scale-y-125 transition-transform" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            {item.model ? getEntityLabel(item.model.targetEntity) : 'Lote'}
          </Badge>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        </div>
        <CardTitle className="mt-3 text-base truncate" title={item.file?.fileName}>
          {item.file?.fileName || 'Planilha Sem Nome'}
        </CardTitle>
        <CardDescription className="text-xs flex items-center gap-1 mt-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {new Date(item.createdAt).toLocaleString('pt-BR')}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Registros</span>
            <span className="font-mono font-bold text-foreground">{item.totalRows}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Sucesso</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {item.successRows}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/50 pt-3.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">
          {item.file?.fileSize ? formatBytes(item.file.fileSize) : '0 Bytes'}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-[11px]"
          onClick={() => onViewDetails(item.id)}
          leftIcon={<Eye className="h-3.5 w-3.5" />}
        >
          Analisar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ImportCard;
