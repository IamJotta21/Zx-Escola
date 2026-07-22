import React from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Award,
  BarChart2,
  PieChart as PieChartIcon,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';

export interface ChartDataProps {
  monthlyEnrollments?: Array<{ month: string; total: number }>;
  cashflowComparison?: Array<{ month: string; revenues: number; expenses: number }>;
  studentsByStatus?: Record<string, number>;
  classAttendance?: Array<{ name: string; attendancePercent: number }>;
}

export const DashboardCharts: React.FC<ChartDataProps> = ({
  monthlyEnrollments = [
    { month: 'Jan', total: 42 },
    { month: 'Fev', total: 68 },
    { month: 'Mar', total: 95 },
    { month: 'Abr', total: 110 },
    { month: 'Mai', total: 125 },
    { month: 'Jun', total: 140 },
    { month: 'Jul', total: 165 },
  ],
  cashflowComparison = [
    { month: 'Jan', revenues: 45000, expenses: 28000 },
    { month: 'Fev', revenues: 52000, expenses: 31000 },
    { month: 'Mar', revenues: 61000, expenses: 34000 },
    { month: 'Abr', revenues: 58000, expenses: 30000 },
    { month: 'Mai', revenues: 67000, expenses: 36000 },
    { month: 'Jun', revenues: 72000, expenses: 38000 },
  ],
  studentsByStatus = {
    ATIVO: 450,
    LISTA_DE_ESPERA: 35,
    INATIVO: 12,
    FORMADO: 85,
  },
  classAttendance = [
    { name: '1º Ano A', attendancePercent: 94 },
    { name: '2º Ano B', attendancePercent: 89 },
    { name: '3º Ano A', attendancePercent: 96 },
    { name: '4º Ano C', attendancePercent: 91 },
    { name: '5º Ano A', attendancePercent: 98 },
  ],
}) => {
  // Max calculations for bar heights
  const maxEnrollment = Math.max(...monthlyEnrollments.map((d) => d.total), 1);
  const maxCashflow = Math.max(
    ...cashflowComparison.map((d) => Math.max(d.revenues, d.expenses)),
    1
  );

  const totalStudents = Object.values(studentsByStatus).reduce((a, b) => a + b, 0);

  const statusColors: Record<string, string> = {
    ATIVO: 'bg-emerald-500',
    LISTA_DE_ESPERA: 'bg-amber-500',
    INATIVO: 'bg-rose-500',
    FORMADO: 'bg-indigo-500',
  };

  const statusLabels: Record<string, string> = {
    ATIVO: 'Ativos',
    LISTA_DE_ESPERA: 'Em Espera',
    INATIVO: 'Inativos',
    FORMADO: 'Formados',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
      {/* CHART 1: EVOLUÇÃO DE MATRÍCULAS (Bar Chart SVG) */}
      <Card className="stripe-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" /> Evolução do Crescimento de Matrículas
            </CardTitle>
            <CardDescription className="text-xs">
              Histórico de novos alunos matriculados nos últimos meses
            </CardDescription>
          </div>
          <Badge variant="success" className="font-mono text-[10px]">
            +18.5% crescimento
          </Badge>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <div className="h-48 flex items-end justify-between gap-3 px-2">
            {monthlyEnrollments.map((item, idx) => {
              const heightPct = Math.round((item.total / maxEnrollment) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                    {item.total}
                  </div>
                  <div className="w-full bg-secondary/50 rounded-t-lg h-36 flex items-end p-1 overflow-hidden">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-primary/80 to-primary rounded-t-md transition-all duration-500 group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-[11px] font-extrabold text-muted-foreground">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CHART 2: FLUXO FINANCEIRO (RECEITA VS DESPESAS) */}
      <Card className="stripe-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" /> Comparativo de Receitas vs Despesas
            </CardTitle>
            <CardDescription className="text-xs">
              Balanço mensal de arrecadações e custos operacionais
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Receitas
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Despesas
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <div className="h-48 flex items-end justify-between gap-4 px-2">
            {cashflowComparison.map((item, idx) => {
              const revPct = Math.round((item.revenues / maxCashflow) * 100);
              const expPct = Math.round((item.expenses / maxCashflow) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-secondary/30 rounded-t-lg h-36 flex items-end justify-center gap-1 p-1">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${revPct}%` }}
                      className="w-1/2 bg-emerald-500 rounded-t transition-all duration-500"
                      title={`Receita (${item.month}): R$ ${item.revenues.toLocaleString()}`}
                    />
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${expPct}%` }}
                      className="w-1/2 bg-rose-500/80 rounded-t transition-all duration-500"
                      title={`Despesa (${item.month}): R$ ${item.expenses.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[11px] font-extrabold text-muted-foreground">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CHART 3: DISTRIBUIÇÃO DE ALUNOS POR STATUS (Donut Chart representation) */}
      <Card className="stripe-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-indigo-500" /> Distribuição de Alunos por Status
          </CardTitle>
          <CardDescription className="text-xs">
            Proporção de matrículas ativas, pendentes e concluídas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut representation */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted/30"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray="75, 100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-foreground font-mono">{totalStudents}</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Total Alunos</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="space-y-2.5 w-full">
              {Object.entries(studentsByStatus).map(([key, count]) => {
                const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <span className={`h-2.5 w-2.5 rounded-full ${statusColors[key] || 'bg-primary'}`} />
                        {statusLabels[key] || key}
                      </span>
                      <span className="font-bold font-mono text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusColors[key] || 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CHART 4: FREQUÊNCIA MÉDIA POR TURMA */}
      <Card className="stripe-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Índice de Frequência Escolar por Turma
            </CardTitle>
            <CardDescription className="text-xs">
              Percentual médio de presença dos alunos nas aulas
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            Meta Escolar: &gt;90%
          </Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {classAttendance.map((cls, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-foreground">{cls.name}</span>
                <span
                  className={`font-mono ${
                    cls.attendancePercent >= 90 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {cls.attendancePercent}% de presença
                </span>
              </div>
              <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    cls.attendancePercent >= 95
                      ? 'bg-emerald-500'
                      : cls.attendancePercent >= 90
                      ? 'bg-teal-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${cls.attendancePercent}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
