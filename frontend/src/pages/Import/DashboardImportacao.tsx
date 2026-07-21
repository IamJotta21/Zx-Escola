import React, { useEffect } from 'react';
import { useImport } from '../../hooks/useImport';
import ImportHistoryTable from '../../components/import/ImportHistoryTable';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Plus,
  BarChart3,
  Settings,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  TrendingUp,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DashboardImportacao: React.FC = () => {
  const { stats, imports, loading, fetchStats, fetchImports } = useImport();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchImports();
  }, [fetchStats, fetchImports]);

  const successRate =
    stats && stats.totalRows > 0 ? Math.round((stats.successRows / stats.totalRows) * 100) : 0;

  const lastImport = imports[0];
  const lastImportDate = lastImport ? new Date(lastImport.createdAt).toLocaleString('pt-BR') : '—';

  const handleReprocess = (id: string) => {
    navigate(`/importacao-inteligente/historico?id=${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Importação Inteligente
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Painel de monitoramento, auditoria e cadastro em lote do ERP Escolar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => {
              fetchStats();
              fetchImports();
            }}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Link to="/importacao-inteligente/nova">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Nova Importação</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-border/60 hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 w-fit">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Lotes Totais
            </span>
            <span className="text-2xl font-extrabold text-foreground leading-none">
              {stats?.totalImports ?? 0}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 w-fit">
              <Activity className="h-4 w-4" />
            </div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Total de Linhas
            </span>
            <span className="text-2xl font-extrabold text-foreground leading-none">
              {(stats?.totalRows ?? 0).toLocaleString('pt-BR')}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 w-fit">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Gravados
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
              {(stats?.successRows ?? 0).toLocaleString('pt-BR')}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 w-fit">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Rejeitados
            </span>
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 leading-none">
              {(stats?.errorRows ?? 0).toLocaleString('pt-BR')}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 w-fit">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Taxa de Sucesso
            </span>
            <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 leading-none">
              {successRate}%
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 w-fit">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Última Importação
            </span>
            <span className="text-xs font-extrabold text-foreground leading-tight mt-0.5">
              {lastImportDate}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle>Registros Processados por Mês</CardTitle>
            <CardDescription>Comparativo de inserções com sucesso vs falhas.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-between">
            <div className="flex items-end justify-between h-48 border-b dark:border-border/40 pb-2 px-4 gap-4 select-none mt-2">
              {[
                { month: 'Jan', success: 85, error: 15 },
                { month: 'Fev', success: 92, error: 8 },
                { month: 'Mar', success: 78, error: 22 },
                { month: 'Abr', success: 95, error: 5 },
                { month: 'Mai', success: 89, error: 11 },
                { month: 'Jun', success: 98, error: 2 },
              ].map((data, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <div className="w-full flex gap-1 items-end h-[85%] justify-center">
                    <div
                      className="w-4 sm:w-5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all"
                      style={{ height: `${data.success}%` }}
                      title={`${data.success}% sucesso`}
                    />
                    <div
                      className="w-4 sm:w-5 bg-gradient-to-t from-rose-500 to-rose-300 rounded-t-sm transition-all"
                      style={{ height: `${data.error}%` }}
                      title={`${data.error}% erros`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {data.month}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-5 justify-center text-xs mt-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full" />
                Sucesso
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 bg-rose-400 rounded-full" />
                Erros
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Status & Quick Actions */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>Lotes por situação e atalhos de navegação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Status breakdown pills */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Concluídos', value: stats?.completed ?? 0, color: 'text-emerald-600' },
                { label: 'Falhou', value: stats?.failed ?? 0, color: 'text-rose-600' },
                { label: 'Em Fila', value: stats?.pending ?? 0, color: 'text-amber-600' },
                { label: 'Pausados', value: stats?.paused ?? 0, color: 'text-orange-500' },
              ].map((s) => (
                <div key={s.label} className="p-2.5 rounded-xl border bg-card text-center">
                  <span className={`text-lg font-extrabold ${s.color}`}>{s.value}</span>
                  <span className="block text-[10px] text-muted-foreground font-bold uppercase mt-0.5">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick nav links */}
            <div className="space-y-2 pt-1">
              {[
                {
                  to: '/importacao-inteligente/historico',
                  icon: <Calendar className="h-4 w-4" />,
                  label: 'Histórico Completo',
                  sub: 'Logs e auditoria',
                  color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/20',
                },
                {
                  to: '/importacao-inteligente/modelos',
                  icon: <BarChart3 className="h-4 w-4" />,
                  label: 'Modelos de Mapeamento',
                  sub: 'Configurar colunas',
                  color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950/20',
                },
                {
                  to: '/importacao-inteligente/configuracoes',
                  icon: <Settings className="h-4 w-4" />,
                  label: 'Configurações',
                  sub: 'Políticas e segurança',
                  color: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
                },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 p-3 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                >
                  <div className={`p-2 rounded-lg shrink-0 ${link.color}`}>{link.icon}</div>
                  <div>
                    <span className="text-xs font-bold block text-foreground">{link.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      {link.sub}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Imports Table */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Importações Recentes
            </CardTitle>
            <CardDescription>
              Os últimos 5 lotes de planilhas processados no servidor.
            </CardDescription>
          </div>
          <Link to="/importacao-inteligente/historico">
            <Button variant="outline" size="sm">
              Ver todos
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <ImportHistoryTable
            imports={imports.slice(0, 5)}
            loading={loading}
            onViewDetails={(id) => navigate(`/importacao-inteligente/historico?id=${id}`)}
            onReprocess={handleReprocess}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardImportacao;
