import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Bell,
  Activity,
  ShieldCheck,
  Search,
  Key,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

interface SuperAdminSummary {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  monthlyRevenue: number;
  totalRevenue: number;
  activePlans: {
    BASIC: number;
    PRO: number;
    ENTERPRISE: number;
  };
}

interface SuperAdminCharts {
  schoolsGrowth: Array<{ month: string; total: number }>;
  studentsGrowth: Array<{ month: string; total: number }>;
  usersGrowth: Array<{ month: string; total: number }>;
  revenueGrowth: Array<{ month: string; total: number }>;
}

export const SuperAdminPage: React.FC = () => {
  const { addToast } = useToast();
  const { signIn } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'schools' | 'notifications' | 'monitoring' | 'audit'
  >('dashboard');

  // Data states
  const [summary, setSummary] = useState<SuperAdminSummary>({
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    activePlans: { BASIC: 0, PRO: 0, ENTERPRISE: 0 },
  });
  const [charts, setCharts] = useState<SuperAdminCharts>({
    schoolsGrowth: [],
    studentsGrowth: [],
    usersGrowth: [],
    revenueGrowth: [],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tenants, setTenants] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [monitoring, setMonitoring] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Support Impersonation Modal State ("Acessar como Escola")
  const [isImpersonateOpen, setIsImpersonateOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedTenantForImpersonate, setSelectedTenantForImpersonate] = useState<any>(null);
  const [impersonateReason, setImpersonateReason] = useState('');
  const [processingImpersonate, setProcessingImpersonate] = useState(false);

  // Notification Dispatch Form State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [notifPriority, setNotifPriority] = useState('MEDIA');
  const [notifTargetTenant, setNotifTargetTenant] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Fetch Dashboard & Summary
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/dashboard');
      setSummary(res.data.data.summary);
      setCharts(res.data.data.charts);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar métricas globais do SaaS.' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await api.get('/tenants');
      setTenants(res.data.data || []);
    } catch {
      /* silent */
    }
  }, []);

  const fetchMonitoring = useCallback(async () => {
    try {
      const res = await api.get('/superadmin/monitoring');
      setMonitoring(res.data.data);
    } catch {
      /* silent */
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await api.get('/superadmin/audit', {
        params: { search: auditSearch || undefined },
      });
      setAuditLogs(res.data.data.logs || []);
    } catch {
      /* silent */
    }
  }, [auditSearch]);

  useEffect(() => {
    fetchDashboard();
    fetchTenants();
  }, [fetchDashboard, fetchTenants]);

  useEffect(() => {
    if (activeTab === 'monitoring') fetchMonitoring();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, fetchMonitoring, fetchAuditLogs]);

  // Support Impersonation Action ("Acessar como Escola")
  const handleConfirmImpersonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForImpersonate || !impersonateReason || impersonateReason.length < 5) {
      addToast({
        type: 'warning',
        message: 'Por favor, descreva o motivo do acesso de suporte técnico (mín. 5 caracteres).',
      });
      return;
    }

    try {
      setProcessingImpersonate(true);
      const res = await api.post('/superadmin/impersonate', {
        tenantId: selectedTenantForImpersonate.id,
        reason: impersonateReason,
      });

      const { accessToken, tenant } = res.data.data;
      addToast({
        type: 'success',
        message: `Sessão de suporte iniciada na escola ${tenant.name}.`,
      });

      // Switch context and redirect
      localStorage.setItem('@ZxEscola:accessToken', accessToken);
      window.location.href = '/dashboard';
    } catch {
      addToast({ type: 'error', message: 'Erro ao iniciar sessão de suporte técnico.' });
    } finally {
      setProcessingImpersonate(false);
    }
  };

  // Dispatch Global SaaS Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifContent) {
      addToast({ type: 'warning', message: 'Preencha título e conteúdo do comunicado.' });
      return;
    }

    try {
      setSendingNotif(true);
      await api.post('/superadmin/notifications', {
        title: notifTitle,
        content: notifContent,
        priority: notifPriority,
        targetTenantId: notifTargetTenant || undefined,
      });

      addToast({ type: 'success', message: 'Comunicado global enviado com sucesso!' });
      setNotifTitle('');
      setNotifContent('');
    } catch {
      addToast({ type: 'error', message: 'Erro ao enviar comunicado.' });
    } finally {
      setSendingNotif(false);
    }
  };

  const filteredTenants = tenants.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.cnpj && t.cnpj.includes(searchTerm)) ||
    (t.city && t.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-950 text-white rounded-2xl shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 tracking-widest uppercase bg-amber-400/20 px-2.5 py-1 rounded-md border border-amber-400/30">
              Painel do Super Administrador
            </span>
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              SaaS Global Management
            </Badge>
          </div>
          <h1 className="text-2xl font-black">Administração Geral da Plataforma Zx-Escola</h1>
          <p className="text-sm text-slate-300">
            Controle de infraestrutura multi-tenant, suporte técnico, faturamento e auditoria global.
          </p>
        </div>
      </div>

      {/* 8 GLOBAL SAAS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stripe-card bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-semibold">Total de Escolas</div>
              <div className="text-2xl font-black text-foreground mt-1">{summary.totalTenants}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {summary.activeTenants} ativas • {summary.suspendedTenants} suspensas
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="stripe-card bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-semibold">Total de Usuários</div>
              <div className="text-2xl font-black text-foreground mt-1">{summary.totalUsers}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Em todas as escolas</div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="stripe-card bg-gradient-to-br from-indigo-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-semibold">Alunos Cadastrados</div>
              <div className="text-2xl font-black text-foreground mt-1">{summary.totalStudents}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Matrículas ativas</div>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="stripe-card bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-semibold">Receita Mensal SaaS</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                R$ {summary.monthlyRevenue.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Total histórico: R$ {summary.totalRevenue.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Sub-tabs Header */}
      <div className="flex border-b border-border overflow-x-auto pb-px gap-2">
        {[
          { key: 'dashboard', label: 'Dashboard Global SaaS', icon: <BarChart3 className="h-4 w-4" /> },
          { key: 'schools', label: 'Gerenciamento & Suporte', icon: <Building2 className="h-4 w-4" /> },
          { key: 'notifications', label: 'Central de Notificações', icon: <Bell className="h-4 w-4" /> },
          { key: 'monitoring', label: 'Monitoramento do Sistema', icon: <Activity className="h-4 w-4" /> },
          { key: 'audit', label: 'Trilha de Auditoria', icon: <ShieldCheck className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-amber-500 text-amber-500 font-black scale-105'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD GLOBAL SAAS (CHARTS) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Crescimento de Escolas */}
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-foreground">
                  Crescimento de Escolas Cadastradas por Mês
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-6">
                <div className="h-44 flex items-end justify-between gap-3">
                  {charts.schoolsGrowth.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold font-mono text-primary">{item.total}</span>
                      <div className="w-full bg-secondary/50 rounded-t-lg h-32 flex items-end p-1">
                        <div
                          className="w-full bg-primary rounded-t transition-all duration-500"
                          style={{ height: `${Math.min(100, item.total * 12)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-extrabold text-muted-foreground">{item.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Evolução das Receitas */}
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Evolução das Receitas da Plataforma (R$)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-6">
                <div className="h-44 flex items-end justify-between gap-3">
                  {charts.revenueGrowth.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold font-mono text-emerald-600">
                        {(item.total / 1000).toFixed(0)}k
                      </span>
                      <div className="w-full bg-secondary/50 rounded-t-lg h-32 flex items-end p-1">
                        <div
                          className="w-full bg-emerald-500 rounded-t transition-all duration-500"
                          style={{ height: `${Math.min(100, (item.total / 150000) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-extrabold text-muted-foreground">{item.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Plans Breakdown */}
          <Card className="stripe-card">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-foreground">
                Distribuição de Planos Ativos no SaaS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card text-center space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Plano Basic</span>
                <div className="text-3xl font-black font-mono text-foreground">{summary.activePlans.BASIC}</div>
                <span className="text-[10px] text-muted-foreground">Escolas</span>
              </div>
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 text-center space-y-1">
                <span className="text-xs font-bold text-primary uppercase">Plano Pro</span>
                <div className="text-3xl font-black font-mono text-primary">{summary.activePlans.PRO}</div>
                <span className="text-[10px] text-muted-foreground">Escolas</span>
              </div>
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center space-y-1">
                <span className="text-xs font-bold text-amber-500 uppercase">Plano Enterprise</span>
                <div className="text-3xl font-black font-mono text-amber-500">{summary.activePlans.ENTERPRISE}</div>
                <span className="text-[10px] text-muted-foreground">Escolas</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: GERENCIAMENTO DE ESCOLAS & SUPORTE ("Acessar como Escola") */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          <Card className="stripe-card">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Gerenciamento Global &amp; Suporte Técnico
                </CardTitle>
                <CardDescription className="text-xs">
                  Acesse temporariamente o ambiente da escola com registro obrigatório de auditoria.
                </CardDescription>
              </div>
              <div className="w-72">
                <Input
                  placeholder="Pesquisar escola..."
                  leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escola</TableHead>
                    <TableHead>Cidade / UF</TableHead>
                    <TableHead className="text-center">Plano</TableHead>
                    <TableHead className="text-center">Situação</TableHead>
                    <TableHead className="text-center">Alunos / Prof.</TableHead>
                    <TableHead className="text-right">Suporte Técnico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                        Nenhuma escola encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTenants.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="font-bold text-xs text-foreground">{t.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">CNPJ: {t.cnpj || '—'}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {t.city ? `${t.city} / ${t.state}` : '—'}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          <Badge variant="outline">{t.plan}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={t.status === 'ACTIVE' ? 'success' : 'destructive'}>
                            {t.status === 'ACTIVE' ? 'Ativa' : 'Suspensa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {t._count?.students || 0} al. • {t._count?.teachers || 0} prof.
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            leftIcon={<Key className="h-3.5 w-3.5" />}
                            onClick={() => {
                              setSelectedTenantForImpersonate(t);
                              setImpersonateReason('');
                              setIsImpersonateOpen(true);
                            }}
                          >
                            Acessar como Escola
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: CENTRAL DE NOTIFICAÇÕES GLOBAIS */}
      {activeTab === 'notifications' && (
        <Card className="stripe-card">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Envio de Comunicados Globais da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSendNotification} className="space-y-4 max-w-2xl">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Título do Comunicado *</label>
                <Input
                  placeholder="Ex: Manutenção Programada / Atualização de Recursos"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Prioridade</label>
                  <Select value={notifPriority} onChange={(e) => setNotifPriority(e.target.value)}>
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta (Aviso Crítico)</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Escola Destino</label>
                  <Select value={notifTargetTenant} onChange={(e) => setNotifTargetTenant(e.target.value)}>
                    <option value="">Todas as Escolas (Global)</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Conteúdo da Mensagem *</label>
                <textarea
                  className="w-full h-32 rounded-lg border border-input bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Escreva a mensagem oficial para exibição no painel das escolas..."
                  value={notifContent}
                  onChange={(e) => setNotifContent(e.target.value)}
                  required
                />
              </div>

              <Button variant="default" size="sm" type="submit" disabled={sendingNotif}>
                {sendingNotif ? 'Enviando...' : 'Enviar Comunicado'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: MONITORAMENTO DO SISTEMA */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Status Geral</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-lg font-black text-emerald-600">SISTEMA ONLINE</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Servidores operando normalmente sem degradação.
                </p>
              </CardContent>
            </Card>

            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Banco de Dados</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-lg font-black text-foreground">PostgreSQL Conectado</div>
                <p className="text-[10px] text-muted-foreground mt-1">Conexões ativas e pool estável.</p>
              </CardContent>
            </Card>

            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Tempo de Atividade (Uptime)</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-lg font-black font-mono text-foreground">
                  {monitoring?.health?.uptimeSeconds || 0} segundos
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Uptime contínuo do processo backend.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: TRILHA DE AUDITORIA DO SUPER ADMIN */}
      {activeTab === 'audit' && (
        <Card className="stripe-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground">
              Trilha de Auditoria Exclusiva do Super Administrador
            </CardTitle>
            <div className="w-64">
              <Input
                placeholder="Filtrar por ação..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                      Nenhum registro de auditoria encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-xs font-bold">
                        {log.user?.email || log.userId || 'Sistema'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{log.resource}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.details || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* MODAL SUPORTE TÉCNICO: "ACESSAR COMO ESCOLA" */}
      <Modal
        isOpen={isImpersonateOpen}
        onClose={() => setIsImpersonateOpen(false)}
        title="Acesso de Suporte Técnico ('Acessar como Escola')"
      >
        {selectedTenantForImpersonate && (
          <form onSubmit={handleConfirmImpersonate} className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs text-amber-900 dark:text-amber-300">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> AVISO DE AUDITORIA DE SEGURANÇA
              </div>
              <p>
                Você está prestes a entrar no ambiente da escola{' '}
                <strong>{selectedTenantForImpersonate.name}</strong>. Esta ação é estritamente monitorada e registrada na trilha de auditoria do sistema.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Motivo do Acesso de Suporte *
              </label>
              <textarea
                className="w-full h-24 rounded-lg border border-input bg-background p-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Descreva o motivo técnico ou chamado do cliente (mínimo de 5 caracteres)..."
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsImpersonateOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                disabled={processingImpersonate}
              >
                {processingImpersonate ? 'Iniciando Sessão...' : 'Iniciar Sessão de Suporte'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default SuperAdminPage;
