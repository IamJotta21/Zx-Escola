import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface UploadAreaProps {
  onFilesSelect: (files: FileList | File[]) => void;
  acceptedFormats?: string;
  maxSizeMB?: number;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFilesSelect,
  acceptedFormats = '.xml,.json,.csv,.xlsx,.xls,.ods,.zip,.txt',
  maxSizeMB = 20,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(e.target.files);
    }
  };

  const handleAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={handleAreaClick}
      className={`
        border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer select-none relative overflow-hidden group
        ${
          isDragActive
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-border/80 hover:border-primary/50 dark:hover:border-primary/40 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-50 dark:hover:bg-slate-900/25'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedFormats}
        multiple
        className="hidden"
      />

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex flex-col items-center justify-center">
        <div
          className={`
          p-4 rounded-2xl mb-4 shrink-0 transition-all duration-300
          ${
            isDragActive
              ? 'bg-primary/20 text-primary scale-110'
              : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 group-hover:scale-105'
          }
        `}
        >
          <Upload className="h-8 w-8" />
        </div>

        <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
          Arraste e solte seus arquivos de dados aqui
        </h3>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
          Ou clique para procurar arquivos no seu computador. Suporta formatos XLSX, XLS, CSV, XML,
          JSON, ODS, ZIP e TXT.
        </p>

        <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground border-t dark:border-border/40 pt-4 w-full justify-center">
          <span className="flex items-center gap-1.5 text-blue-500 font-medium">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Vários formatos aceitos
          </span>
          <span className="h-3 w-px bg-border/60" />
          <span className="flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            Até {maxSizeMB}MB cada
          </span>
        </div>
      </div>
    </div>
  );
};

export default UploadArea;
