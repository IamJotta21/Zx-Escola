import React, { useState, useEffect, useRef } from 'react';
import { useImport } from '../../hooks/useImport';
import UploadArea from './UploadArea';
import UploadCard, { FileUploadItem } from './UploadCard';
import FileCard from './FileCard';
import FilePreview from './FilePreview';
import ImportProgress from './ImportProgress';
import ImportSummary from './ImportSummary';
import { getEntityFields, suggestMapping } from '../../utils/import.utils';
import { TargetEntity } from '../../types/import.type';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { Input } from '../ui/Input';
import api from '../../services/api';
import {
  Play,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
  FolderOpen,
  Settings2,
  Search,
  Database,
  AlertCircle,
  AlertTriangle,
  Check,
  Clock,
  User,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

const previewHeaders = [
  'NomeAluno',
  'Sobrenome',
  'Email',
  'CPFAluno',
  'Telefone',
  'BirthDate',
  'Sexo',
  'Serie',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawRows: Array<Record<string, any>> = [
  {
    NomeAluno: 'Carlos',
    Sobrenome: 'Eduardo',
    Email: 'carlos.eduardo@escola.com',
    CPFAluno: '123.456.789-00',
    Telefone: '(11) 98765-4321',
    BirthDate: '15/04/2012',
    Sexo: 'Masculino',
    Serie: '6º Ano',
  },
  {
    NomeAluno: 'Juliana',
    Sobrenome: 'Rodrigues',
    Email: 'juliana.rodrigues@escola.com',
    CPFAluno: '234.567.890-11',
    Telefone: '(11) 97654-3210',
    BirthDate: '22/09/2011',
    Sexo: 'Feminino',
    Serie: '7º Ano',
  },
  {
    NomeAluno: 'Ricardo',
    Sobrenome: 'Oliveira',
    Email: 'ricardo.oliveira@escola',
    CPFAluno: '345.678.901-22',
    Telefone: '(11) 96543-2109',
    BirthDate: '10/01/2012',
    Sexo: 'Masculino',
    Serie: '6º Ano',
  },
  {
    NomeAluno: '',
    Sobrenome: 'Ferreira',
    Email: 'ana.ferreira@escola.com',
    CPFAluno: '456.789.012-33',
    Telefone: '(11) 95432-1098',
    BirthDate: '18/11/2012',
    Sexo: 'Feminino',
    Serie: '5º Ano',
  },
  {
    NomeAluno: 'Pedro',
    Sobrenome: 'Almeida',
    Email: 'carlos.eduardo@escola.com',
    CPFAluno: '123.456.789-00',
    Telefone: '(11) 94321-0987',
    BirthDate: '04/05/2012',
    Sexo: 'Masculino',
    Serie: '6º Ano',
  },
  {
    NomeAluno: 'Maria',
    Sobrenome: 'Carmo',
    Email: 'maria.carmo@escola.com',
    CPFAluno: '567.890.123-44',
    Telefone: '(11) 93210-9876',
    BirthDate: '12/12/2011',
    Sexo: 'Feminino',
    Serie: '7º Ano',
  },
];

interface ImportWizardProps {
  onFinished: () => void;
}

interface RowValidationResult {
  rowIdx: number;
  status: 'VALID' | 'WARNING' | 'ERROR';
  messages: string[];
  isDuplicate: boolean;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ onFinished }) => {
  const { getEntityLabel, fetchModels } = useImport();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedEntity, setSelectedEntity] = useState<TargetEntity>('STUDENT');

  // File states (Multiple Files Upload)
  const [uploadFiles, setUploadFiles] = useState<FileUploadItem[]>([]);
  const [isUploadingInProgress, setIsUploadingInProgress] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<{
    name: string;
    size: number;
  } | null>(null);

  // Mappings state
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Model Saving state
  const [saveAsModel, setSaveAsModel] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelDesc, setModelDesc] = useState('');
  const [modelOrigin, setModelOrigin] = useState('');
  const [isSavingModel, setIsSavingModel] = useState(false);

  // Mapped & Editable rows in Step 4
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editableRows, setEditableRows] = useState<Array<Record<string, any>>>([]);
  const [validationResults, setValidationResults] = useState<RowValidationResult[]>([]);

  // Step 4 Filtering
  const [filterType, setFilterType] = useState<'ALL' | 'VALID' | 'ERROR' | 'WARNING' | 'DUPLICATE'>(
    'ALL'
  );

  // Simulation states for Step 5 (Importing Queue controls)
  const [importProgress, setImportProgress] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const totalRowsSimulated = 150;
  const [successRows, setSuccessRows] = useState(148);
  const [errorRows, setErrorRows] = useState(2);
  const [importStatus, setImportStatus] = useState<
    'PENDING' | 'PROCESSING' | 'PAUSED' | 'CANCELLED' | 'COMPLETED' | 'FAILED'
  >('PENDING');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const intervalRef = useRef<any>(null);

  const stepsList = [
    { id: 1, label: 'Selecionar Arquivos', desc: 'Envio de planilhas' },
    { id: 2, label: 'Analisar Arquivo', desc: 'Verificação da estrutura' },
    { id: 3, label: 'Mapear Campos', desc: 'Vincular Excel → Banco' },
    { id: 4, label: 'Validar Dados', desc: 'Inconsistências e erros' },
    { id: 5, label: 'Importar', desc: 'Escrever no banco' },
    { id: 6, label: 'Concluído', desc: 'Resultado final' },
  ];

  // Pre-fill suggested mappings when selectedEntity changes
  useEffect(() => {
    const fields = getEntityFields(selectedEntity);
    const initialMap: Record<string, string> = {};
    previewHeaders.forEach((header) => {
      const match = suggestMapping(header, fields);
      if (match.matchedField) {
        initialMap[header] = match.matchedField;
      }
    });
    setColumnMappings(initialMap);
  }, [selectedEntity]);

  // Initialize editable mapped data when stepping into Step 4
  useEffect(() => {
    if (currentStep === 4) {
      const mapped = rawRows.map((rawRow, rowIdx) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rowObj: Record<string, any> = { _originalRowIdx: rowIdx };
        // Map excel columns to ERP fields
        getEntityFields(selectedEntity).forEach((field) => {
          const excelHeader = Object.keys(columnMappings).find(
            (k) => columnMappings[k] === field.field
          );
          rowObj[field.field] = excelHeader ? rawRow[excelHeader] : '';
        });
        return rowObj;
      });
      setEditableRows(mapped);
    }
  }, [currentStep, columnMappings, selectedEntity]);

  // Perform validations whenever editableRows changes
  useEffect(() => {
    if (currentStep === 4) {
      runValidation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableRows]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const runValidation = () => {
    const fields = getEntityFields(selectedEntity);
    const results: RowValidationResult[] = editableRows.map((row, rowIdx) => {
      const messages: string[] = [];
      let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';

      // 1. Validate Required fields
      for (const field of fields) {
        if (field.required && (!row[field.field] || String(row[field.field]).trim() === '')) {
          status = 'ERROR';
          messages.push(`Campo obrigatório ausente: "${field.label}"`);
        }
      }

      // 2. Validate email format
      if (row.email && String(row.email).trim() !== '') {
        const emailStr = String(row.email).trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
          if (status !== 'ERROR') status = 'WARNING';
          messages.push(`Formato de e-mail inválido: "${emailStr}"`);
        }
      }

      // 3. Validate CPF numeric format
      if (row.cpf && String(row.cpf).trim() !== '') {
        const cpfDigits = String(row.cpf).replace(/\D/g, '');
        if (cpfDigits.length !== 11) {
          if (status !== 'ERROR') status = 'WARNING';
          messages.push(`CPF deve conter 11 dígitos numéricos.`);
        }
      }

      // 4. Duplicate checks within preview list
      let isDuplicate = false;
      editableRows.forEach((otherRow, otherIdx) => {
        if (otherIdx !== rowIdx) {
          const emailMatch =
            row.email &&
            otherRow.email &&
            String(row.email).trim() === String(otherRow.email).trim();
          const cpfMatch =
            row.cpf &&
            otherRow.cpf &&
            String(row.cpf).replace(/\D/g, '') === String(otherRow.cpf).replace(/\D/g, '');
          if (emailMatch || cpfMatch) {
            isDuplicate = true;
          }
        }
      });

      if (isDuplicate) {
        if (status !== 'ERROR') status = 'WARNING';
        messages.push(`Registro duplicado (e-mail ou CPF já encontrado na planilha).`);
      }

      return {
        rowIdx,
        status,
        messages,
        isDuplicate,
      };
    });

    setValidationResults(results);

    // Auto update simulated counts based on actual validation results
    const errors = results.filter((r) => r.status === 'ERROR').length;
    setErrorRows(errors);
    setSuccessRows(totalRowsSimulated - errors);
  };

  const handleUpdateCell = (rowIdx: number, field: string, value: string) => {
    setEditableRows((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [field]: value };
      return next;
    });
  };

  const handleFilesSelect = (files: FileList | File[]) => {
    const acceptedExtensions = ['.xml', '.json', '.csv', '.xlsx', '.xls', '.ods', '.zip', '.txt'];
    const maxSize = 20 * 1024 * 1024; // 20MB
    const cleanFilenameRegex = /[^a-zA-Z0-9_\-\s.]/;

    const newItems: FileUploadItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      let status: 'PENDING' | 'ERROR' = 'PENDING';
      let errorMessage = '';

      if (!acceptedExtensions.includes(ext)) {
        status = 'ERROR';
        errorMessage = `Extensão ${ext} não permitida.`;
      } else if (file.size > maxSize) {
        status = 'ERROR';
        errorMessage = 'Tamanho máximo excedido (limite 20MB).';
      } else if (file.size === 0) {
        status = 'ERROR';
        errorMessage = 'Arquivo vazio (0 Bytes).';
      } else if (uploadFiles.some((f) => f.file.name === file.name && f.file.size === file.size)) {
        status = 'ERROR';
        errorMessage = 'Arquivo duplicado na fila.';
      } else if (cleanFilenameRegex.test(file.name)) {
        status = 'ERROR';
        errorMessage = 'Nome inválido. Não use caracteres especiais.';
      }

      newItems.push({
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status,
        errorMessage: errorMessage || undefined,
        uploadDate: new Date(),
      });
    }

    setUploadFiles((prev) => [...prev, ...newItems]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCancelUpload = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setUploadFiles((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === uploadFiles.length - 1) return;
    setUploadFiles((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const handleClearAll = () => {
    setUploadFiles([]);
  };

  const handleUploadAllAndContinue = async () => {
    const pendingFiles = uploadFiles.filter((f) => f.status === 'PENDING');

    if (pendingFiles.length === 0) {
      const successFiles = uploadFiles.filter((f) => f.status === 'SUCCESS');
      if (successFiles.length > 0) {
        setSelectedFileForPreview({
          name: successFiles[0].file.name,
          size: successFiles[0].file.size,
        });
        setCurrentStep(2);
      }
      return;
    }

    setIsUploadingInProgress(true);

    for (const item of pendingFiles) {
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'UPLOADING', progress: 0 } : f))
      );

      const formData = new FormData();
      formData.append('file', item.file);

      try {
        await api.post('/imports/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percent = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 40;
            setUploadFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, progress: percent } : f))
            );
          },
        });

        setUploadFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'SUCCESS', progress: 100 } : f))
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        const errMsg =
          err.response?.data?.message || 'Falha na comunicação com o servidor de uploads.';
        setUploadFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'ERROR', errorMessage: errMsg } : f))
        );
      }
    }

    setIsUploadingInProgress(false);

    setUploadFiles((currentList) => {
      const successful = currentList.filter((f) => f.status === 'SUCCESS');
      if (successful.length > 0) {
        setSelectedFileForPreview({
          name: successful[0].file.name,
          size: successful[0].file.size,
        });
        setCurrentStep(2);
      }
      return currentList;
    });
  };

  const handleSaveModelAndAdvance = async () => {
    if (saveAsModel) {
      if (!modelName.trim()) return;
      setIsSavingModel(true);
      try {
        await api.post('/imports/models', {
          name: modelName,
          description: modelDesc || undefined,
          targetEntity: selectedEntity,
          mapping: columnMappings,
          originSystem: modelOrigin || undefined,
        });
        fetchModels();
      } catch (err) {
        // Ignored
      } finally {
        setIsSavingModel(false);
      }
    }
    setCurrentStep(4);
  };

  // Background import queue simulator
  const handleStartImport = () => {
    setCurrentStep(5);
    setImportStatus('PROCESSING');
    startProcessingLoop(0);
  };

  const startProcessingLoop = (resumeFromPercent: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let progress = resumeFromPercent;
    intervalRef.current = setInterval(() => {
      progress += 10;
      setImportProgress(progress);
      setProcessedRows(Math.floor((progress / 100) * totalRowsSimulated));

      if (progress >= 100) {
        clearInterval(intervalRef.current);
        setImportStatus('COMPLETED');
        setCurrentStep(6);
      }
    }, 700);
  };

  const handlePauseImport = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setImportStatus('PAUSED');
  };

  const handleResumeImport = () => {
    setImportStatus('PROCESSING');
    startProcessingLoop(importProgress);
  };

  const handleCancelImport = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setImportProgress(0);
    setProcessedRows(0);
    setImportStatus('CANCELLED');

    // Go back to Step 1 after a short delay
    setTimeout(() => {
      setSelectedFileForPreview(null);
      setUploadFiles([]);
      setCurrentStep(1);
    }, 1500);
  };

  // Filter columns based on search (Step 3)
  const filteredHeaders = previewHeaders.filter((header) =>
    header.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 90)
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-500/20';
    if (confidence >= 70)
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-500/20';
    return 'bg-slate-50 text-slate-500 dark:bg-slate-900/60 border-slate-500/10';
  };

  // Apply row filters in validation table (Step 4)
  const filteredRows = editableRows.filter((_row, idx) => {
    const valResult = validationResults[idx];
    if (!valResult) return true;

    switch (filterType) {
      case 'ERROR':
        return valResult.status === 'ERROR';
      case 'WARNING':
        return valResult.status === 'WARNING';
      case 'DUPLICATE':
        return valResult.isDuplicate;
      case 'VALID':
        return valResult.status === 'VALID' && !valResult.isDuplicate;
      default:
        return true;
    }
  });

  // Count metrics for final stats dashboard preview
  const countErrors = validationResults.filter((r) => r.status === 'ERROR').length;
  const countWarnings = validationResults.filter((r) => r.status === 'WARNING').length;
  const countValid = validationResults.filter((r) => r.status === 'VALID' && !r.isDuplicate).length;
  const countDuplicates = validationResults.filter((r) => r.isDuplicate).length;

  return (
    <div className="space-y-6">
      {/* Stepper Wizard Header */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center justify-between min-w-[700px]">
          {stepsList.map((s, idx) => {
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className={`
                    h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                    ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                        : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                    }
                  `}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : s.id}
                  </div>
                  <div className="flex flex-col text-left">
                    <span
                      className={`text-xs font-bold ${isActive ? 'text-foreground font-black' : isCompleted ? 'text-emerald-500' : 'text-muted-foreground'}`}
                    >
                      {s.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                      {s.desc}
                    </span>
                  </div>
                </div>
                {idx < stepsList.length - 1 && (
                  <div
                    className={`
                    h-0.5 flex-1 min-w-[30px] mx-2 rounded transition-all duration-300
                    ${currentStep > s.id ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'}
                  `}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Steps Content switch */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>{stepsList[currentStep - 1].label}</CardTitle>
          <CardDescription>
            {currentStep === 1 &&
              `Carregue planilhas para cadastrar ${getEntityLabel(selectedEntity)}s em lote no ERP.`}
            {currentStep === 2 &&
              'Confirme as dimensões identificadas e visualize uma amostra dos registros.'}
            {currentStep === 3 &&
              'Relacione as colunas da planilha aos respectivos atributos cadastrais.'}
            {currentStep === 4 &&
              'Amostra comparativa e edição inline antes da importação definitiva.'}
            {currentStep === 5 &&
              'Gravando registros no banco de dados e enviando credenciais de acesso.'}
            {currentStep === 6 && 'Lotes importados e cadastros realizados.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 min-h-[300px]">
          {/* STEP 1: Selecionar Arquivos */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Select
                label="Tipo de Entidade para Importação"
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value as TargetEntity)}
                options={[
                  { value: 'STUDENT', label: 'Alunos (Cadastro Acadêmico)' },
                  { value: 'TEACHER', label: 'Professores (Cadastro Docente)' },
                  { value: 'GUARDIAN', label: 'Responsáveis (Familiar / Financeiro)' },
                  { value: 'CLASS', label: 'Turmas (Séries / Salas)' },
                  { value: 'ROOM', label: 'Salas de Aula (Capacidades)' },
                ]}
              />

              <UploadArea onFilesSelect={handleFilesSelect} />

              {uploadFiles.length > 0 && (
                <div className="space-y-3 border-t dark:border-border/40 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <FolderOpen className="h-4 w-4" />
                      Fila de Upload ({uploadFiles.length} arquivos)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      disabled={isUploadingInProgress}
                      className="text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-8"
                    >
                      Limpar Fila
                    </Button>
                  </div>

                  <UploadCard
                    files={uploadFiles}
                    onRemove={handleRemoveFile}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onCancelUpload={handleCancelUpload}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Analisar Arquivo */}
          {currentStep === 2 && selectedFileForPreview && (
            <div className="space-y-6">
              <FileCard
                fileName={selectedFileForPreview.name}
                fileSize={selectedFileForPreview.size}
                onRemove={() => {
                  setSelectedFileForPreview(null);
                  setCurrentStep(1);
                }}
              />

              <FilePreview headers={previewHeaders} rows={rawRows} />
            </div>
          )}

          {/* STEP 3: Mapear Campos */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Alert variant="info">
                Vinculamos colunas com títulos parecidos automaticamente. Verifique se os campos
                abaixo estão mapeados corretamente.
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-primary" />
                  Mapeando Planilha para {getEntityLabel(selectedEntity)}
                </span>

                <Input
                  placeholder="Buscar campo do excel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-3.5 w-3.5" />}
                  className="max-w-xs"
                />
              </div>

              {/* Mappings Table list */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-4 font-bold text-xs text-muted-foreground border-b pb-2 px-2 uppercase tracking-wider">
                  <div className="col-span-5">Coluna na Planilha</div>
                  <div className="col-span-2 text-center">Confiança</div>
                  <div className="col-span-5">Campo Correspondente no ERP</div>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {filteredHeaders.map((header) => {
                    const match = suggestMapping(header, getEntityFields(selectedEntity));
                    const mappedField = columnMappings[header] || '';

                    return (
                      <div
                        key={header}
                        className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl border border-border/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/5 transition-all"
                      >
                        <div className="col-span-5">
                          <span
                            className="text-xs font-extrabold text-foreground font-mono block truncate"
                            title={header}
                          >
                            {header}
                          </span>
                          <span className="text-[9px] text-muted-foreground mt-0.5 block">
                            Ex: {rawRows[0][header as keyof (typeof rawRows)[0]]}
                          </span>
                        </div>

                        <div className="col-span-2 text-center">
                          {mappedField === match.matchedField && match.confidence > 0 ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border ${getConfidenceBadgeColor(match.confidence)}`}
                            >
                              {match.confidence}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border bg-slate-50 text-slate-500 dark:bg-slate-900/60 border-slate-500/10">
                              Manual
                            </span>
                          )}
                        </div>

                        <div className="col-span-5">
                          <Select
                            value={mappedField}
                            onChange={(e) => {
                              const val = e.target.value;
                              setColumnMappings((prev) => ({
                                ...prev,
                                [header]: val,
                              }));
                            }}
                            options={[
                              { value: '', label: 'Não importar este campo' },
                              ...getEntityFields(selectedEntity).map((f) => ({
                                value: f.field,
                                label: `${f.label} ${f.required ? '*' : ''}`,
                              })),
                            ]}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Model Saving Section */}
              <div className="border-t dark:border-border/40 pt-4 mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveModelCheck"
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={saveAsModel}
                    onChange={(e) => setSaveAsModel(e.target.checked)}
                  />
                  <label
                    htmlFor="saveModelCheck"
                    className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1"
                  >
                    <Settings2 className="h-3.5 w-3.5 text-primary" />
                    Salvar estas configurações de mapeamento como modelo reutilizável
                  </label>
                </div>

                {saveAsModel && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-dashed bg-slate-50/30 dark:bg-slate-900/10 animate-fadeIn">
                    <Input
                      label="Nome do Modelo"
                      placeholder="Ex: Planilha de Alunos - SGE"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      required
                    />
                    <Input
                      label="Descrição (Opcional)"
                      placeholder="Origem ou finalidade do layout"
                      value={modelDesc}
                      onChange={(e) => setModelDesc(e.target.value)}
                    />
                    <Input
                      label="Sistema de Origem (Opcional)"
                      placeholder="Ex: Q-Acadêmico, Giz, Excel"
                      value={modelOrigin}
                      onChange={(e) => setModelOrigin(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Validar Dados */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Intelligent Summary Panel */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Total Geral
                  </span>
                  <p className="text-xl font-extrabold text-foreground mt-1">
                    {totalRowsSimulated} linhas
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Válidos
                  </span>
                  <p className="text-xl font-extrabold mt-1">{countValid} registros</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Erros
                  </span>
                  <p className="text-xl font-extrabold mt-1">{countErrors} críticos</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Avisos
                  </span>
                  <p className="text-xl font-extrabold mt-1">{countWarnings} alertas</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Duplicados
                  </span>
                  <p className="text-xl font-extrabold mt-1">{countDuplicates} repetidos</p>
                </div>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b pb-4">
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={filterType === 'ALL' ? 'primary' : 'ghost'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setFilterType('ALL')}
                  >
                    Todos ({validationResults.length})
                  </Button>
                  <Button
                    variant={filterType === 'VALID' ? 'primary' : 'ghost'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setFilterType('VALID')}
                  >
                    Válidos ({countValid})
                  </Button>
                  <Button
                    variant={filterType === 'ERROR' ? 'primary' : 'ghost'}
                    size="sm"
                    className="text-xs text-rose-500 hover:text-rose-600"
                    onClick={() => setFilterType('ERROR')}
                  >
                    Erros ({countErrors})
                  </Button>
                  <Button
                    variant={filterType === 'WARNING' ? 'primary' : 'ghost'}
                    size="sm"
                    className="text-xs text-amber-500 hover:text-amber-600"
                    onClick={() => setFilterType('WARNING')}
                  >
                    Avisos ({countWarnings})
                  </Button>
                  <Button
                    variant={filterType === 'DUPLICATE' ? 'primary' : 'ghost'}
                    size="sm"
                    className="text-xs text-purple-500 hover:text-purple-600"
                    onClick={() => setFilterType('DUPLICATE')}
                  >
                    Duplicados ({countDuplicates})
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={runValidation}
                >
                  Validar Novamente
                </Button>
              </div>

              {/* Editable Preview Table */}
              <div className="overflow-x-auto border border-border/60 rounded-2xl bg-card">
                <table className="min-w-full divide-y divide-border/60">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-muted-foreground uppercase">
                    <tr>
                      <th className="p-3 text-left w-12">#</th>
                      <th className="p-3 text-left w-1/3">Dados Convertidos (Editável)</th>
                      <th className="p-3 text-left w-1/3">Dados Originais na Planilha</th>
                      <th className="p-3 text-left">Resultado Final / Inconsistência</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/50 text-xs">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Nenhum registro encontrado correspondente ao filtro selecionado.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const originalIdx = row._originalRowIdx;
                        const originalRow = rawRows[originalIdx];
                        const valResult = validationResults.find((r) => r.rowIdx === originalIdx);

                        return (
                          <tr
                            key={originalIdx}
                            className="hover:bg-slate-50/30 dark:hover:bg-slate-900/5 transition-all"
                          >
                            <td className="p-3 font-bold text-muted-foreground">
                              {originalIdx + 1}
                            </td>

                            <td className="p-3 space-y-2">
                              {getEntityFields(selectedEntity).map((field) => {
                                const excelHeader = Object.keys(columnMappings).find(
                                  (k) => columnMappings[k] === field.field
                                );
                                if (!excelHeader) return null;

                                return (
                                  <div key={field.field} className="flex items-center gap-2">
                                    <span className="w-24 shrink-0 font-semibold text-[10px] text-muted-foreground uppercase truncate">
                                      {field.label}:
                                    </span>
                                    <input
                                      type="text"
                                      value={row[field.field] || ''}
                                      onChange={(e) =>
                                        handleUpdateCell(originalIdx, field.field, e.target.value)
                                      }
                                      className="flex-1 p-1 px-2 border border-border/80 rounded bg-background text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                    />
                                  </div>
                                );
                              })}
                            </td>

                            <td className="p-3 text-muted-foreground max-h-[120px] overflow-y-auto block space-y-1 bg-slate-50/20">
                              {Object.keys(columnMappings).map((excelKey) => (
                                <div key={excelKey} className="truncate">
                                  <span className="font-bold text-[9px] uppercase font-mono">
                                    {excelKey}:
                                  </span>{' '}
                                  {originalRow[excelKey]}
                                </div>
                              ))}
                            </td>

                            <td className="p-3">
                              {valResult ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    {valResult.status === 'ERROR' && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500">
                                        <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                                        Inconsistente
                                      </span>
                                    )}
                                    {valResult.status === 'WARNING' && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                        Revisar
                                      </span>
                                    )}
                                    {valResult.status === 'VALID' && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        Válido
                                      </span>
                                    )}
                                  </div>

                                  {valResult.messages.map((msg, idx) => (
                                    <p
                                      key={idx}
                                      className="text-[10px] text-muted-foreground leading-normal italic pl-5"
                                    >
                                      - {msg}
                                    </p>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">
                                  Não avaliado
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Log Audit Info Panel */}
              <div className="p-4 rounded-2xl border border-dashed bg-slate-50/20 space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Logs de Validação Temporária
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>
                      Processado em:{' '}
                      <strong className="text-foreground">
                        {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>
                      Operador: <strong className="text-foreground">Administrador ERP</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                    <span>
                      Duração Média: <strong className="text-foreground">12ms</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Importar (Progress with Pause/Resume/Cancel hooks) */}
          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto py-8">
              <ImportProgress
                progressPercent={importProgress}
                processedRows={processedRows}
                totalRows={totalRowsSimulated}
                successCount={successRows}
                errorCount={errorRows}
                status={importStatus}
                onPause={handlePauseImport}
                onResume={handleResumeImport}
                onCancel={handleCancelImport}
              />
            </div>
          )}

          {/* STEP 6: Concluído */}
          {currentStep === 6 && (
            <ImportSummary
              successRows={successRows}
              errorRows={errorRows}
              totalRows={totalRowsSimulated}
              onRestart={() => {
                setSelectedFileForPreview(null);
                setUploadFiles([]);
                setImportProgress(0);
                setProcessedRows(0);
                setCurrentStep(1);
              }}
              onGoToHistory={onFinished}
            />
          )}
        </CardContent>

        {/* Wizard Footer controls */}
        {currentStep < 5 && (
          <CardFooter className="flex justify-between border-t border-border/50 pt-6">
            <Button
              variant="outline"
              leftIcon={<ChevronLeft className="h-4 w-4" />}
              disabled={currentStep === 1 || isUploadingInProgress}
              onClick={() => setCurrentStep((prev) => prev - 1)}
            >
              Voltar
            </Button>

            <div className="flex gap-2">
              {currentStep === 4 && (
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Editar Mapeamento
                </Button>
              )}

              {currentStep === 1 && uploadFiles.length > 0 && (
                <Button
                  variant="outline"
                  leftIcon={<X className="h-4 w-4" />}
                  disabled={isUploadingInProgress}
                  onClick={onFinished}
                >
                  Cancelar
                </Button>
              )}

              {currentStep === 4 ? (
                <Button rightIcon={<Play className="h-4 w-4" />} onClick={handleStartImport}>
                  Confirmar e Gravar Lote
                </Button>
              ) : currentStep === 1 ? (
                <Button
                  rightIcon={
                    isUploadingInProgress ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )
                  }
                  disabled={
                    uploadFiles.length === 0 ||
                    isUploadingInProgress ||
                    uploadFiles.every((f) => f.status === 'ERROR')
                  }
                  onClick={handleUploadAllAndContinue}
                >
                  {isUploadingInProgress ? 'Carregando arquivos...' : 'Continuar e Enviar'}
                </Button>
              ) : currentStep === 3 ? (
                <Button
                  rightIcon={
                    isSavingModel ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )
                  }
                  disabled={isSavingModel || (saveAsModel && !modelName.trim())}
                  onClick={handleSaveModelAndAdvance}
                >
                  {isSavingModel ? 'Salvando modelo...' : 'Avançar'}
                </Button>
              ) : (
                <Button
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                  disabled={currentStep === 2 && !selectedFileForPreview}
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                >
                  Avançar
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ImportWizard;
