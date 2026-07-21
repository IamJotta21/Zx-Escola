import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Loading';
import exportService from '../../services/export.service';
import api from '../../services/api';
import {
  FileText,
  FileCode,
  Archive,
  Calendar,
  Users,
  User,
  Sliders,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  HardDrive,
  Download,
  Play,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';

interface ExportWizardProps {
  onFinished: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const MODULES_INFO = [
  {
    id: 'ALUNOS',
    label: 'Alunos',
    desc: 'Dados cadastrais, CPF, RG, contatos e filiação.',
    category: 'Acadêmico',
    avgSize: 250,
  },
  {
    id: 'RESPONSAVEIS',
    label: 'Responsáveis',
    desc: 'Contatos, parentesco e vínculo financeiro.',
    category: 'Acadêmico',
    avgSize: 180,
  },
  {
    id: 'PROFESSORES',
    label: 'Professores',
    desc: 'Carga horária, e-mail e disciplinas ministradas.',
    category: 'Acadêmico',
    avgSize: 220,
  },
  {
    id: 'FUNCIONARIOS',
    label: 'Funcionários',
    desc: 'Departamento, cargo e dados básicos.',
    category: 'Acadêmico',
    avgSize: 150,
  },
  {
    id: 'TURMAS',
    label: 'Turmas',
    desc: 'Cadastro de turmas, salas e professores regentes.',
    category: 'Acadêmico',
    avgSize: 120,
  },
  {
    id: 'DISCIPLINAS',
    label: 'Disciplinas',
    desc: 'Listagem de matérias curriculares cadastradas.',
    category: 'Acadêmico',
    avgSize: 80,
  },
  {
    id: 'NOTAS',
    label: 'Notas e Boletins',
    desc: 'Boletins escolares, médias e notas por bimestre.',
    category: 'Pedagógico',
    avgSize: 320,
  },
  {
    id: 'FREQUENCIA',
    label: 'Frequência',
    desc: 'Diários de presença e faltas por aula.',
    category: 'Pedagógico',
    avgSize: 110,
  },
  {
    id: 'FINANCEIRO',
    label: 'Financeiro',
    desc: 'Transações de receita/despesa e mensalidades.',
    category: 'Administrativo',
    avgSize: 290,
  },
  {
    id: 'BIBLIOTECA',
    label: 'Biblioteca',
    desc: 'Livros cadastrados e empréstimos ativos.',
    category: 'Administrativo',
    avgSize: 140,
  },
  {
    id: 'AGENDA',
    label: 'Agenda',
    desc: 'Comunicados, mural de avisos e eventos.',
    category: 'Administrativo',
    avgSize: 190,
  },
  {
    id: 'USUARIOS',
    label: 'Usuários',
    desc: 'Credenciais de login e status de ativação.',
    category: 'Segurança',
    avgSize: 160,
  },
  {
    id: 'PERMISSOES',
    label: 'Permissões',
    desc: 'Perfis de acesso por função (Roles).',
    category: 'Segurança',
    avgSize: 100,
  },
  {
    id: 'DOCUMENTOS',
    label: 'Documentos',
    desc: 'Modelos de declarações e históricos emitidos.',
    category: 'Secretaria',
    avgSize: 450,
  },
  {
    id: 'CONFIGURACOES',
    label: 'Configurações',
    desc: 'Parâmetros e propriedades globais do sistema.',
    category: 'Secretaria',
    avgSize: 90,
  },
];

export const ExportWizard: React.FC<ExportWizardProps> = ({ onFinished }) => {
  const [step, setStep] = useState<Step>(1);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('COMPLETO');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [format, setFormat] = useState<string>('XLSX');

  // API Data
  const [classes, setClasses] = useState<
    Array<{ id: string; name: string; gradeYear: string; schoolYear: string }>
  >([]);
  const [students, setStudents] = useState<
    Array<{
      id: string;
      cpf?: string | null;
      user: { email: string; profile?: { firstName: string; lastName: string } | null };
    }>
  >([]);
  const [loadingData, setLoadingData] = useState(false);

  // Estimation
  const [estRecords, setEstRecords] = useState(0);
  const [estSize, setEstSize] = useState(0);

  // Job Status
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobSpeed, setJobSpeed] = useState(0);
  const [jobEta, setJobEta] = useState(0);
  const [jobStatus, setJobStatus] = useState<string>('PENDING');
  const [finalFileName, setFinalFileName] = useState<string>('');
  const [finalSize, setFinalSize] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch Classes and Students
  useEffect(() => {
    if (filterType === 'TURMA' && classes.length === 0) {
      setLoadingData(true);
      api
        .get('/classes')
        .then((res) => {
          setClasses(res.data.data || []);
          if (res.data.data?.length > 0) setSelectedClass(res.data.data[0].id);
        })
        .catch(() => {})
        .finally(() => setLoadingData(false));
    }
    if (filterType === 'ALUNO' && students.length === 0) {
      setLoadingData(true);
      api
        .get('/students')
        .then((res) => {
          setStudents(res.data.data || []);
          if (res.data.data?.length > 0) setSelectedStudent(res.data.data[0].id);
        })
        .catch(() => {})
        .finally(() => setLoadingData(false));
    }
  }, [filterType, classes.length, students.length]);

  // Recalculate Estimates
  useEffect(() => {
    let records = 0;
    let size = 0;

    selectedModules.forEach((m) => {
      const info = MODULES_INFO.find((info) => info.id === m);
      if (info) {
        // Base multiplier per filter
        let multiplier = 1.0;
        if (filterType === 'ALUNO') multiplier = 0.05;
        if (filterType === 'TURMA') multiplier = 0.15;
        if (filterType === 'PERIODO') multiplier = 0.4;

        const baseRecords = Math.round((Math.random() * 100 + 50) * multiplier);
        records += baseRecords;
        size += baseRecords * info.avgSize;
      }
    });

    setEstRecords(records);
    setEstSize(size);
  }, [selectedModules, filterType]);

  // Toggle selection
  const handleToggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllModules = () => {
    if (selectedModules.length === MODULES_INFO.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(MODULES_INFO.map((m) => m.id));
    }
  };

  const getFormatIcon = (f: string) => {
    switch (f.toUpperCase()) {
      case 'JSON':
      case 'XML':
        return <FileCode className="h-6 w-6 text-indigo-500" />;
      case 'ZIP':
        return <Archive className="h-6 w-6 text-rose-500" />;
      default:
        return <FileText className="h-6 w-6 text-blue-500" />;
    }
  };

  // Start Export process
  const handleStartExport = async () => {
    setErrorMessage('');
    try {
      const payload: {
        format: string;
        modules: string[];
        filterType: string;
        filterParams?: Record<string, unknown>;
      } = {
        format,
        modules: selectedModules,
        filterType,
      };

      if (filterType === 'PERIODO') {
        payload.filterParams = { startDate, endDate };
      } else if (filterType === 'TURMA') {
        payload.filterParams = { classId: selectedClass };
      } else if (filterType === 'ALUNO') {
        payload.filterParams = { studentId: selectedStudent };
      }

      const res = await exportService.startExport(payload);
      setActiveJobId(res.id);
      setJobStatus('PROCESSING');
      setStep(5);
      setJobProgress(0);

      // Start simulation / polling loop
      startPolling(res.id);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(e?.response?.data?.message || 'Falha ao iniciar exportação.');
    }
  };

  const startPolling = (jobId: string) => {
    let progress = 0;
    const startTime = Date.now();

    const interval = setInterval(async () => {
      try {
        const details = await exportService.getExportDetails(jobId);
        setJobStatus(details.status);

        if (details.status === 'COMPLETED') {
          clearInterval(interval);
          setJobProgress(100);
          setFinalFileName(details.fileName || 'export.zip');
          setFinalSize(details.sizeBytes);
          setStep(6);
        } else if (details.status === 'FAILED') {
          clearInterval(interval);
          setErrorMessage('O processamento falhou no servidor.');
          setStep(4);
        } else {
          // Simulate smooth front-end progress bar updates
          const elapsed = (Date.now() - startTime) / 1000;
          progress = Math.min(progress + Math.round(Math.random() * 8 + 4), 95);
          setJobProgress(progress);

          // Calculate speed and eta
          const speed = Math.round((estRecords * (progress / 100)) / (elapsed || 1));
          setJobSpeed(speed);

          const remaining = Math.max(0, Math.round((100 - progress) / (speed || 1)));
          setJobEta(remaining);
        }
      } catch {
        clearInterval(interval);
      }
    }, 1500);
  };

  const handleDownload = async () => {
    if (!activeJobId) return;
    try {
      await exportService.downloadExportFile(activeJobId, finalFileName);
    } catch {
      alert('Falha ao descarregar o arquivo de exportação.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Banner */}
      {step < 5 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-border/40">
          {([1, 2, 3, 4] as const).map((s) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  step === s
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : step > s
                      ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-card text-muted-foreground border'
                }`}
              >
                <span className="h-5 w-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-mono">
                  {s}
                </span>
                <span>
                  {s === 1 ? 'Módulos' : s === 2 ? 'Filtros' : s === 3 ? 'Formato' : 'Confirmação'}
                </span>
              </div>
              {s < 4 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      )}

      {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

      {/* STEP 1: Select Modules */}
      {step === 1 && (
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Selecionar Módulos</h3>
                <p className="text-xs text-muted-foreground">
                  Marque quais módulos cadastrais deseja incluir no arquivo consolidado de
                  exportação.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllModules}
                className="w-fit"
              >
                {selectedModules.length === MODULES_INFO.length
                  ? 'Desmarcar Todos'
                  : 'Selecionar Todos'}
              </Button>
            </div>

            {/* Grid of categories */}
            <div className="grid gap-6 md:grid-cols-2">
              {['Acadêmico', 'Pedagógico', 'Administrativo', 'Segurança', 'Secretaria'].map(
                (category) => {
                  const items = MODULES_INFO.filter((m) => m.category === category);
                  return (
                    <div
                      key={category}
                      className="space-y-3 p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30"
                    >
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {items.map((m) => {
                          const isSelected = selectedModules.includes(m.id);
                          return (
                            <label
                              key={m.id}
                              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/5 shadow-xs'
                                  : 'border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-900/30'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleModule(m.id)}
                                className="rounded text-primary border-input h-4 w-4 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-foreground block">
                                  {m.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 block leading-tight">
                                  {m.desc}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-xs text-muted-foreground font-semibold">
                {selectedModules.length} módulos selecionados
              </span>
              <Button
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => setStep(2)}
                disabled={selectedModules.length === 0}
              >
                Avançar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Filters */}
      {step === 2 && (
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Configurar Filtro de Escopo</h3>
              <p className="text-xs text-muted-foreground">
                Limite a exportação a um grupo específico de registros ou faça um download completo.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Filter selection list */}
              <div className="space-y-2 md:col-span-1 border-r border-border/50 pr-4">
                {[
                  {
                    id: 'COMPLETO',
                    label: 'Exportação Completa',
                    desc: 'Gera o arquivo com toda a base de dados.',
                    icon: <HardDrive className="h-4 w-4" />,
                  },
                  {
                    id: 'PERIODO',
                    label: 'Por Período',
                    desc: 'Filtra com base no intervalo de datas.',
                    icon: <Calendar className="h-4 w-4" />,
                  },
                  {
                    id: 'TURMA',
                    label: 'Por Turma',
                    desc: 'Filtra dados de alunos, frequências e notas por turma.',
                    icon: <Users className="h-4 w-4" />,
                  },
                  {
                    id: 'ALUNO',
                    label: 'Por Aluno',
                    desc: 'Gera dados consolidados de um único estudante.',
                    icon: <User className="h-4 w-4" />,
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      filterType === f.id
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${filterType === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    >
                      {f.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-foreground block">{f.label}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block leading-tight">
                        {f.desc}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Dynamic Parameter Settings Panel */}
              <div className="md:col-span-2 flex flex-col justify-center">
                {filterType === 'COMPLETO' && (
                  <div className="p-6 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-500/20 text-center space-y-2 max-w-md mx-auto">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Totalidade Garantida
                    </h4>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-500 leading-relaxed">
                      Nenhum filtro será aplicado. Os arquivos gerados conterão todo o histórico
                      cadastral acumulado no ERP para os módulos selecionados.
                    </p>
                  </div>
                )}

                {filterType === 'PERIODO' && (
                  <div className="space-y-4 max-w-sm mx-auto w-full">
                    <div className="flex gap-4">
                      <Input
                        type="date"
                        label="Data Inicial"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                      <Input
                        type="date"
                        label="Data Final"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                      Apenas registros cadastrados ou alterados no intervalo selecionado serão
                      exportados.
                    </p>
                  </div>
                )}

                {filterType === 'TURMA' && (
                  <div className="space-y-4 max-w-sm mx-auto w-full">
                    {loadingData ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
                        <Spinner size="sm" /> Carregando turmas...
                      </div>
                    ) : (
                      <Select
                        label="Selecione a Turma Alvo"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        options={classes.map((c) => ({
                          value: c.id,
                          label: `${c.gradeYear}º Ano - ${c.name} (${c.schoolYear})`,
                        }))}
                      />
                    )}
                    <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                      Filtro aplicado exclusivamente a alunos vinculados a essa classe.
                    </p>
                  </div>
                )}

                {filterType === 'ALUNO' && (
                  <div className="space-y-4 max-w-sm mx-auto w-full">
                    {loadingData ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
                        <Spinner size="sm" /> Carregando alunos...
                      </div>
                    ) : (
                      <Select
                        label="Selecione o Aluno"
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        options={students.map((s) => ({
                          value: s.id,
                          label: `${s.user.profile?.firstName || ''} ${s.user.profile?.lastName || ''} (${s.cpf || 'Sem CPF'})`,
                        }))}
                      />
                    )}
                    <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                      Efetua download das notas, frequências, históricos e cadastros vinculados a
                      este único estudante.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <Button
                variant="outline"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => setStep(1)}
              >
                Voltar
              </Button>
              <Button
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => setStep(3)}
                disabled={
                  (filterType === 'PERIODO' && (!startDate || !endDate)) ||
                  (filterType === 'TURMA' && !selectedClass) ||
                  (filterType === 'ALUNO' && !selectedStudent)
                }
              >
                Avançar Formato
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Formats */}
      {step === 3 && (
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Escolher Formato de Saída</h3>
              <p className="text-xs text-muted-foreground">
                Selecione a extensão de arquivo que melhor se adequa ao seu uso ou ferramenta de
                análise.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[
                {
                  id: 'XLSX',
                  label: 'Microsoft Excel (.xlsx)',
                  desc: 'Recomendado para visualização em tabelas, planilhas e relatórios manuais.',
                  tech: 'Planilhas',
                },
                {
                  id: 'ODS',
                  label: 'OpenDocument Spreadsheet (.ods)',
                  desc: 'Formato livre compatível com LibreOffice Calc e planilhas OpenSource.',
                  tech: 'Planilhas',
                },
                {
                  id: 'CSV',
                  label: 'Valores Separados por Vírgula (.csv)',
                  desc: 'Excelente para transferências simples e importação em outros softwares.',
                  tech: 'Dados Planos',
                },
                {
                  id: 'JSON',
                  label: 'JavaScript Object Notation (.json)',
                  desc: 'Ideal para desenvolvedores e integração estruturada de banco de dados.',
                  tech: 'API / Estruturado',
                },
                {
                  id: 'XML',
                  label: 'Extensible Markup Language (.xml)',
                  desc: 'Ótimo para validação tributária, auditoria de dados e integrações legadas.',
                  tech: 'API / Estruturado',
                },
                {
                  id: 'ZIP',
                  label: 'Arquivo Compactado (.zip)',
                  desc: 'Contém arquivos CSV e JSON separados para cada módulo selecionado.',
                  tech: 'Pacote / Compactado',
                },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                    format === f.id
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className="p-2 rounded-lg bg-card border shrink-0">
                      {getFormatIcon(f.id)}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] uppercase font-bold tracking-wider"
                    >
                      {f.tech}
                    </Badge>
                  </div>
                  <span className="text-xs font-bold text-foreground block">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-2 leading-relaxed flex-1">
                    {f.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <Button
                variant="outline"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => setStep(2)}
              >
                Voltar
              </Button>
              <Button rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => setStep(4)}>
                Revisar Exportação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Confirmation */}
      {step === 4 && (
        <Card className="border-border/60">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Confirmar Resumo da Carga</h3>
              <p className="text-xs text-muted-foreground">
                Revise os detalhes abaixo para garantir que o escopo e o formato estão corretos.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                    Definições da Carga
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Tipo de Filtro
                      </span>
                      <span className="font-semibold text-foreground block mt-0.5">
                        {filterType === 'COMPLETO'
                          ? 'Exportação Completa'
                          : filterType === 'PERIODO'
                            ? 'Por Período'
                            : filterType === 'TURMA'
                              ? 'Por Turma'
                              : 'Por Aluno'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Formato
                      </span>
                      <span className="font-semibold text-foreground block mt-0.5">{format}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
                    Estimativas de Carga
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Qtd de Registros
                      </span>
                      <span className="font-extrabold text-foreground block mt-0.5 text-sm font-mono">
                        {estRecords} linhas est.
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Tamanho Est.
                      </span>
                      <span className="font-extrabold text-foreground block mt-0.5 text-sm font-mono">
                        {(estSize / 1024).toFixed(1)} KB est.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modules list preview */}
              <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-900/20 flex flex-col">
                <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-3">
                  Módulos Inclusos
                </h4>
                <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-36 pr-1">
                  {selectedModules.map((m) => {
                    const info = MODULES_INFO.find((item) => item.id === m);
                    return (
                      <Badge key={m} variant="secondary">
                        {info?.label || m}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <Button
                variant="outline"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => setStep(3)}
              >
                Voltar
              </Button>
              <Button leftIcon={<Play className="h-4 w-4" />} onClick={handleStartExport}>
                Iniciar Exportação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Exporting Progress */}
      {step === 5 && (
        <Card className="border-border/60">
          <CardContent className="p-6 text-center space-y-6 max-w-md mx-auto">
            <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                style={{ animationDuration: '1.2s' }}
              />
              <Sliders className="h-8 w-8 text-primary animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Gerando Arquivos</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aguarde enquanto os registros são processados e formatados na estrutura de saída
                selecionada.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-foreground">
                <span>{jobProgress}% Concluído</span>
                <span className="text-[10px] text-muted-foreground">{jobSpeed} reg/s</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden border">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${jobProgress}%` }}
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/40 text-xs font-mono text-left">
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase font-bold">
                  Tempo Estimado
                </span>
                <span className="text-foreground font-bold text-sm flex items-center gap-1 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {jobEta > 0 ? `${jobEta} segundos` : 'Calculando...'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase font-bold">
                  Status do Servidor
                </span>
                <span className="text-foreground font-bold text-sm flex items-center gap-1 mt-0.5">
                  <Badge variant="outline" className="border-blue-500 text-blue-500">
                    {jobStatus === 'PROCESSING' ? 'PROCESSANDO' : 'PENDENTE'}
                  </Badge>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 6: Completion */}
      {step === 6 && (
        <Card className="border-border/60">
          <CardContent className="p-6 text-center space-y-6 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="h-9 w-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Exportação Concluída!</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O arquivo de exportação foi gerado com sucesso e está pronto para download.
              </p>
            </div>

            {/* File Info Card */}
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/40 text-xs font-sans text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-card border shrink-0">
                  {getFormatIcon(format)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground truncate">{finalFileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(finalSize / 1024).toFixed(1)} KB · {estRecords} registros gravados
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                onClick={() => {
                  setSelectedModules([]);
                  setStep(1);
                  setActiveJobId(null);
                }}
              >
                Exportar Novamente
              </Button>
              <Button
                className="flex-1"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleDownload}
              >
                Baixar Arquivo
              </Button>
            </div>

            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={onFinished}
            >
              Visualizar Histórico Completo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExportWizard;
