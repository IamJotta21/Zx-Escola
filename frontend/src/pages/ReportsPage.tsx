import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  DollarSign,
  Users,
  BookOpen,
  Printer,
  RefreshCw,
  FileText,
  Search,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface FinancialData {
  totalRevenues: number;
  totalExpenses: number;
  balance: number;
  revenuesByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  paymentMethods: Record<string, number>;
  monthlyCashflow: Array<{ month: string; revenues: number; expenses: number }>;
}

interface TuitionsData {
  paid: { value: number; qty: number };
  pending: { value: number; qty: number };
  overdue: { value: number; qty: number };
}

interface AcademicData {
  gradesBySubject: Array<{ subject: string; sum: number; count: number; average: number }>;
  statusReport: {
    aprovado: number;
    reprovado: number;
    recuperacao: number;
    cursando: number;
  };
}

interface ClassStat {
  id: string;
  name: string;
  studentsCount: number;
  attendancePercent: number;
  avgGrade: number;
}

interface StudentsData {
  total: number;
  byStatus: Record<string, number>;
  byGender: Record<string, number>;
}

interface TeacherStat {
  id: string;
  name: string;
  workload: number;
  classesCount: number;
  subjects: string[];
}

interface ReportsPayload {
  financial: FinancialData;
  tuitions: TuitionsData;
  academic: AcademicData;
  classes: ClassStat[];
  students: StudentsData;
  teachers: TeacherStat[];
}

const DEFAULT_REPORTS_DATA: ReportsPayload = {
  financial: {
    totalRevenue: 0,
    totalExpenses: 0,
    netResult: 0,
    defaultRate: 0,
    monthlyCashflow: [],
  },
  tuitions: {
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    collectionRate: 0,
  },
  academic: {
    avgGrade: 0,
    passRate: 0,
    attendanceRate: 0,
    gradesBySubject: [],
  },
  classes: [],
  students: { total: 0, byStatus: {}, byGender: {} },
  teachers: [],
};

export const ReportsPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'financial' | 'academic' | 'students_teachers' | 'logs'
  >('financial');
  const [data, setData] = useState<ReportsPayload>(DEFAULT_REPORTS_DATA);
  const [isLoading, setIsLoading] = useState(false);

  // System logs state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit] = useState(25);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/reports');
      // Merge received data with defaults to guarantee all fields exist
      const received = res.data.data || {};
      setData({
        ...DEFAULT_REPORTS_DATA,
        ...received,
        financial: { ...DEFAULT_REPORTS_DATA.financial, ...(received.financial || {}) },
        academic:  { ...DEFAULT_REPORTS_DATA.academic,  ...(received.academic  || {}) },
        tuitions:  { ...DEFAULT_REPORTS_DATA.tuitions,  ...(received.tuitions  || {}) },
        students:  { ...DEFAULT_REPORTS_DATA.students,  ...(received.students  || {}) },
        classes:   received.classes  || [],
        teachers:  received.teachers || [],
      });
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar dados consolidados de relatórios.' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);


  const fetchLogs = useCallback(
    async (page: number, searchKeyword = '') => {
      try {
        setLogsLoading(true);
        const res = await api.get('/reports/logs', {
          params: {
            page,
            limit: logsLimit,
            search: searchKeyword || undefined,
          },
        });
        setLogs(res.data.data?.logs || []);
        setLogsTotal(res.data.data?.total || 0);
      } catch {
        addToast({ type: 'error', message: 'Erro ao carregar trilha de auditoria.' });
      } finally {
        setLogsLoading(false);
      }
    },
    [logsLimit, addToast]
  );

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs(logsPage, logsSearch);
    }
  }, [activeTab, logsPage, logsSearch, fetchLogs]);

  // ─── Export Functions ────────────────────────────────────────────────────────

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const convertToCSV = (objArray: any[], headers: string[]) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = headers.join(',') + '\r\n';

    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (const index in array[i]) {
        if (line !== '') line += ',';
        // Clean text values to avoid breaks
        const val =
          typeof array[i][index] === 'string'
            ? `"${array[i][index].replace(/"/g, '""')}"`
            : array[i][index];
        line += val;
      }
      str += line + '\r\n';
    }
    return str;
  };

  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = (type: string) => {
    if (!data) return;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let csvData: any[] = [];
    let headers: string[] = [];
    let name = '';

    if (type === 'cashflow') {
      csvData = data.financial.monthlyCashflow.map((c) => ({
        Mes: c.month,
        Receitas: c.revenues.toFixed(2),
        Despesas: c.expenses.toFixed(2),
        Saldo: (c.revenues - c.expenses).toFixed(2),
      }));
      headers = ['Mês', 'Receitas', 'Despesas', 'Saldo'];
      name = 'fluxo_de_caixa.csv';
    } else if (type === 'subjects') {
      csvData = data.academic.gradesBySubject.map((s) => ({
        Disciplina: s.subject,
        TotalAlunos: s.count,
        MediaGeral: s.average.toFixed(2),
      }));
      headers = ['Disciplina', 'Alunos com Nota', 'Média Geral'];
      name = 'desempenho_disciplinas.csv';
    } else if (type === 'classes') {
      csvData = data.classes.map((c) => ({
        Turma: c.name,
        QtdAlunos: c.studentsCount,
        MediaNotas: c.avgGrade.toFixed(2),
        FrequenciaMedia: `${c.attendancePercent}%`,
      }));
      headers = ['Turma', 'Qtd Alunos', 'Média Notas', 'Frequência Média'];
      name = 'relatorio_turmas.csv';
    } else if (type === 'teachers') {
      csvData = data.teachers.map((t) => ({
        Professor: t.name,
        CargaHoraria: t.workload,
        QtdTurmas: t.classesCount,
        Disciplinas: t.subjects.join(' | '),
      }));
      headers = ['Professor', 'Carga Horária (h)', 'Qtd Turmas', 'Disciplinas'];
      name = 'relatorio_professores.csv';
    }

    const csvString = convertToCSV(csvData, headers);
    downloadCSV(csvString, name);
    addToast({ type: 'success', message: 'Relatório CSV exportado.' });
  };

  const handleExportExcel = (type: string) => {
    // Generate pseudo-Excel format using HTML spreadsheet structure
    if (!data) return;
    let htmlTable = '<table><thead><tr>';
    let name = '';

    if (type === 'cashflow') {
      htmlTable +=
        '<th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th></tr></thead><tbody>';
      data.financial.monthlyCashflow.forEach((c) => {
        htmlTable += `<tr><td>${c.month}</td><td>R$ ${c.revenues.toFixed(2)}</td><td>R$ ${c.expenses.toFixed(2)}</td><td>R$ ${(c.revenues - c.expenses).toFixed(2)}</td></tr>`;
      });
      name = 'fluxo_de_caixa.xls';
    } else if (type === 'classes') {
      htmlTable +=
        '<th>Turma</th><th>Qtd Alunos</th><th>Média Notas</th><th>Frequência Média</th></tr></thead><tbody>';
      data.classes.forEach((c) => {
        htmlTable += `<tr><td>${c.name}</td><td>${c.studentsCount}</td><td>${c.avgGrade.toFixed(2)}</td><td>${c.attendancePercent}%</td></tr>`;
      });
      name = 'relatorio_turmas.xls';
    } else if (type === 'teachers') {
      htmlTable +=
        '<th>Professor</th><th>Carga Horária</th><th>Qtd Turmas</th><th>Disciplinas</th></tr></thead><tbody>';
      data.teachers.forEach((t) => {
        htmlTable += `<tr><td>${t.name}</td><td>${t.workload}h</td><td>${t.classesCount}</td><td>${t.subjects.join(', ')}</td></tr>`;
      });
      name = 'relatorio_professores.xls';
    }
    htmlTable += '</tbody></table>';

    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    addToast({ type: 'success', message: 'Relatório Excel exportado.' });
  };

  // ─── SVG Chart Helpers ───────────────────────────────────────────────────────

  const renderAreaChart = (flow: Array<{ month: string; revenues: number; expenses: number }>) => {
    if (flow.length === 0)
      return (
        <div className="text-xs text-muted-foreground text-center py-10">Sem dados históricos</div>
      );
    const maxVal = Math.max(...flow.map((f) => Math.max(f.revenues, f.expenses)), 1000);
    const width = 500;
    const height = 150;
    const padding = 20;

    const pointsRev: string[] = [];
    const pointsExp: string[] = [];

    flow.forEach((f, idx) => {
      const x = padding + (idx * (width - padding * 2)) / (flow.length - 1 || 1);
      const yRev = height - padding - (f.revenues / maxVal) * (height - padding * 2);
      const yExp = height - padding - (f.expenses / maxVal) * (height - padding * 2);

      pointsRev.push(`${x},${yRev}`);
      pointsExp.push(`${x},${yExp}`);
    });

    return (
      <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        {/* Grids */}
        <line
          x1={padding}
          y1={padding}
          x2={width - padding}
          y2={padding}
          stroke="currentColor"
          className="text-border"
          strokeWidth="0.5"
          strokeDasharray="3 3"
        />
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="currentColor"
          className="text-border"
          strokeWidth="0.5"
          strokeDasharray="3 3"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="currentColor"
          className="text-border"
          strokeWidth="1"
        />

        {/* Lines */}
        <polyline
          fill="none"
          stroke="rgb(16, 185, 129)"
          strokeWidth="3"
          points={pointsRev.join(' ')}
        />
        <polyline
          fill="none"
          stroke="rgb(239, 68, 68)"
          strokeWidth="3"
          points={pointsExp.join(' ')}
        />

        {/* Dots */}
        {flow.map((f, idx) => {
          const x = padding + (idx * (width - padding * 2)) / (flow.length - 1 || 1);
          const yRev = height - padding - (f.revenues / maxVal) * (height - padding * 2);
          const yExp = height - padding - (f.expenses / maxVal) * (height - padding * 2);
          return (
            <g key={idx} className="group cursor-pointer">
              <circle cx={x} cy={yRev} r="4" fill="rgb(16, 185, 129)" />
              <circle cx={x} cy={yExp} r="4" fill="rgb(239, 68, 68)" />
              <text
                x={x}
                y={height - 2}
                className="text-[8px] fill-muted-foreground text-center"
                textAnchor="middle"
              >
                {f.month.split('-')[1]}/{f.month.split('-')[0].slice(2)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderDonutChart = (values: number[], labels: string[], colors: string[]) => {
    const total = values.reduce((a, b) => a + b, 0);
    if (total === 0)
      return <div className="text-xs text-muted-foreground text-center py-6">Sem registros</div>;

    let accumulatedAngle = 0;
    const width = 160;
    const height = 160;
    const cx = 80;
    const cy = 80;
    const r = 50;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
        <svg width={width} height={height} className="transform -rotate-90">
          {values.map((val, idx) => {
            if (val === 0) return null;
            const percentage = val / total;
            const angle = percentage * 360;
            const dashArray = percentage * 2 * Math.PI * r;
            const dashOffset = (accumulatedAngle / 360) * 2 * Math.PI * r;
            accumulatedAngle += angle;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={r}
                fill="transparent"
                stroke={colors[idx]}
                strokeWidth="18"
                strokeDasharray={`${dashArray} ${2 * Math.PI * r}`}
                strokeDashoffset={-dashOffset}
                className="transition-all duration-500 hover:opacity-80 cursor-pointer"
              />
            );
          })}
          <circle cx={cx} cy={cy} r="35" className="fill-card" />
        </svg>
        <div className="space-y-1.5 text-xs">
          {labels.map((lbl, idx) => {
            const percentage = ((values[idx] / total) * 100).toFixed(0);
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx] }} />
                <span className="font-semibold text-foreground">{lbl}:</span>
                <span className="text-muted-foreground">
                  {values[idx]} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:space-y-2 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" /> Relatórios & Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dados estruturados de finanças, desempenho de alunos, turmas e professores.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={fetchReports}
          >
            Atualizar
          </Button>
          <Button
            size="sm"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={() => window.print()}
          >
            Imprimir PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border print:hidden">
        {[
          {
            key: 'financial',
            label: 'Financeiro & Fluxo',
            icon: <DollarSign className="h-4 w-4" />,
          },
          { key: 'academic', label: 'Acadêmico & Turmas', icon: <BookOpen className="h-4 w-4" /> },
          {
            key: 'students_teachers',
            label: 'Alunos & Professores',
            icon: <Users className="h-4 w-4" />,
          },
          {
            key: 'logs',
            label: 'Logs do Sistema',
            icon: <FileText className="h-4 w-4" />,
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Data loading spinner */}
      {!data && isLoading && (
        <div className="py-20 text-center text-xs text-muted-foreground">
          Processando e consolidando dados estatísticos...
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* ─── TAB: FINANCIAL ─────────────────────────────────────────────────── */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="stripe-card border-l-4 border-l-emerald-500 bg-emerald-500/5">
                  <CardContent className="p-4 space-y-1.5">
                    <div className="text-[10px] font-bold text-emerald-600 tracking-wider">
                      TOTAL DE RECEITAS
                    </div>
                    <div className="text-xl font-black text-foreground">
                      R$ {data.financial.totalRevenues.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="stripe-card border-l-4 border-l-rose-500 bg-rose-500/5">
                  <CardContent className="p-4 space-y-1.5">
                    <div className="text-[10px] font-bold text-rose-600 tracking-wider">
                      TOTAL DE DESPESAS
                    </div>
                    <div className="text-xl font-black text-foreground">
                      R$ {data.financial.totalExpenses.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="stripe-card border-l-4 border-l-primary bg-primary/5">
                  <CardContent className="p-4 space-y-1.5">
                    <div className="text-[10px] font-bold text-primary tracking-wider">
                      SALDO DE CAIXA
                    </div>
                    <div className="text-xl font-black text-foreground">
                      R$ {data.financial.balance.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="stripe-card border-l-4 border-l-amber-500 bg-amber-500/5">
                  <CardContent className="p-4 space-y-1.5">
                    <div className="text-[10px] font-bold text-amber-600 tracking-wider">
                      INADIMPLÊNCIA TOTAL
                    </div>
                    <div className="text-xl font-black text-foreground">
                      R$ {data.tuitions.overdue.value.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Area Chart: Revenue vs Expenses Monthly flow */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="stripe-card lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Fluxo de Caixa Consolidado (Mensal)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Valores recebidos versus despesas registradas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 h-[180px]">
                    {renderAreaChart(data.financial.monthlyCashflow)}
                  </CardContent>
                </Card>

                {/* Donut: Payment Methods */}
                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Métodos de Recebimento
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Divisão de faturamento real por PIX, Boleto e Cartão.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {renderDonutChart(
                      [
                        data.financial.paymentMethods['PIX'] || 0,
                        data.financial.paymentMethods['BOLETO'] || 0,
                        data.financial.paymentMethods['CARTAO'] || 0,
                      ],
                      ['PIX', 'Boleto Bancário', 'Cartão de Crédito'],
                      ['#10b981', '#f59e0b', '#3b82f6']
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Table details */}
              <Card className="stripe-card">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Demonstrativo de Resultado do Exercício
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Balancete mensal completo.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportCSV('cashflow')}>
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportExcel('cashflow')}
                    >
                      Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período (Mês)</TableHead>
                        <TableHead className="text-right">Receitas Brutal</TableHead>
                        <TableHead className="text-right">Despesas Operacionais</TableHead>
                        <TableHead className="text-right">Resultado Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.financial.monthlyCashflow.map((m, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-foreground font-mono text-xs">
                            {m.month}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 font-mono text-xs">
                            R$ {m.revenues.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-rose-500 font-mono text-xs">
                            R$ {m.expenses.toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-black font-mono text-xs ${m.revenues - m.expenses >= 0 ? 'text-primary' : 'text-rose-600'}`}
                          >
                            R$ {(m.revenues - m.expenses).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── TAB: ACADEMIC ──────────────────────────────────────────────────── */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Academic general subject averages chart */}
                <Card className="stripe-card lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Desempenho por Disciplina (Média Geral)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Média consolidada de notas dos alunos cadastrados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {data.academic.gradesBySubject.length === 0 ? (
                      <p className="text-center py-10 text-muted-foreground text-xs">
                        Sem notas registradas para média.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data.academic.gradesBySubject.map((s, idx) => (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between font-semibold">
                              <span className="text-foreground">{s.subject}</span>
                              <span className="text-muted-foreground font-mono">
                                {s.average.toFixed(1)} / 10
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  s.average >= 7
                                    ? 'bg-emerald-500'
                                    : s.average >= 5
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                }`}
                                style={{ width: `${s.average * 10}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Donut approvals */}
                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Situação Geral de Alunos
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Aprovação, reprovação e recuperação.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {renderDonutChart(
                      [
                        data.academic.statusReport.aprovado,
                        data.academic.statusReport.recuperacao,
                        data.academic.statusReport.reprovado,
                        data.academic.statusReport.cursando,
                      ],
                      ['Aprovados', 'Recuperação', 'Reprovados', 'Cursando'],
                      ['#10b981', '#f59e0b', '#ef4444', '#3b82f6']
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Table classes details */}
              <Card className="stripe-card">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Relatório Detalhado de Turmas
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tamanho, aproveitamento e assiduidade por classe.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportCSV('classes')}>
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportExcel('classes')}
                    >
                      Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome da Turma</TableHead>
                        <TableHead className="text-center">Quantidade de Alunos</TableHead>
                        <TableHead className="text-center">Média Geral de Notas</TableHead>
                        <TableHead className="text-right">Frequência Média</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.classes.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                          <TableCell className="text-center text-xs">
                            {c.studentsCount} alunos
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-xs">
                            {c.avgGrade.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            <span
                              className={
                                c.attendancePercent >= 75
                                  ? 'text-emerald-600 font-semibold'
                                  : 'text-rose-500 font-semibold'
                              }
                            >
                              {c.attendancePercent}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── TAB: STUDENTS & TEACHERS ───────────────────────────────────────── */}
          {activeTab === 'students_teachers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut Student status */}
                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Matrículas por Status
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Distribuição de alunos nas etapas de cadastro.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {renderDonutChart(
                      Object.values(data.students.byStatus),
                      Object.keys(data.students.byStatus),
                      ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']
                    )}
                  </CardContent>
                </Card>

                {/* Donut Student gender */}
                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Distribuição de Gêneros
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Composição de corpo discente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {renderDonutChart(
                      Object.values(data.students.byGender),
                      Object.keys(data.students.byGender),
                      ['#3b82f6', '#ec4899', '#f59e0b', '#6b7280']
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Table teachers details */}
              <Card className="stripe-card">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Relatório e Carga Horária de Docentes
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Resumo operacional de professores.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportCSV('teachers')}>
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportExcel('teachers')}
                    >
                      Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Professor</TableHead>
                        <TableHead className="text-center">Carga Horária Semanal</TableHead>
                        <TableHead className="text-center">Quantidade de Turmas</TableHead>
                        <TableHead className="text-right">Matérias Lecionadas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.teachers.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-semibold text-foreground">{t.name}</TableCell>
                          <TableCell className="text-center font-mono text-xs">
                            {t.workload} horas
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {t.classesCount} turmas
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {t.subjects.join(', ') || 'Sem matéria cadastrada'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <Card className="stripe-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Trilha de Auditoria do Sistema</CardTitle>
                    <CardDescription className="text-xs">
                      Histórico operacional completo de login, logout e modificações críticas no
                      banco de dados.
                    </CardDescription>
                  </div>
                  <div className="w-72 relative">
                    <Input
                      placeholder="Pesquisar..."
                      value={logsSearch}
                      onChange={(e) => {
                        setLogsSearch(e.target.value);
                        setLogsPage(1);
                      }}
                      className="pr-10"
                      leftIcon={<Search className="h-4 w-4" />}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {logsLoading ? (
                    <div className="py-20 text-center text-xs text-muted-foreground">
                      Carregando trilha de auditoria...
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="py-20 text-center text-xs text-muted-foreground">
                      Nenhum registro de auditoria encontrado.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data / Hora</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead className="text-center">Ação</TableHead>
                            <TableHead className="text-center">Endereço IP</TableHead>
                            <TableHead>Detalhes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="whitespace-nowrap text-xs font-mono">
                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell className="font-semibold text-foreground text-xs">
                                {log.user?.email || 'Sistema'}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={
                                    log.action === 'LOGIN'
                                      ? 'success'
                                      : log.action === 'LOGOUT'
                                        ? 'warning'
                                        : 'outline'
                                  }
                                >
                                  {log.action}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-xs font-mono text-muted-foreground">
                                {log.ipAddress || 'N/A'}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {log.details}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="flex justify-end pt-4">
                        <Pagination
                          currentPage={logsPage}
                          totalPages={Math.ceil(logsTotal / logsLimit) || 1}
                          onPageChange={(page) => setLogsPage(page)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
