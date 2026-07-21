import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';

interface FilePreviewProps {
  headers: string[];
  rows: Record<string, string>[];
}

export const FilePreview: React.FC<FilePreviewProps> = ({ headers, rows }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Pré-visualização dos Dados (Primeiras {rows.length} Linhas)
        </h4>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 dark:bg-slate-900/10">
              {headers.map((h, i) => (
                <TableHead
                  key={i}
                  className="font-bold text-foreground text-xs whitespace-nowrap py-3"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIdx) => (
              <TableRow key={rowIdx} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                {headers.map((header, colIdx) => (
                  <TableCell
                    key={colIdx}
                    className="text-xs text-muted-foreground whitespace-nowrap py-2.5"
                  >
                    {row[header] !== undefined ? row[header] : '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FilePreview;
