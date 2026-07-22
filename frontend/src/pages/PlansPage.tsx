import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Edit3,
  Copy,
  CheckCircle2,
  XCircle,
  Sliders,
  DollarSign,
  Users,
  Shield,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Clock,
  History,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
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

export interface PlanItem {
  id: string;
  name: string;
  description?: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
  trialDays: number;
  sortOrder: number;

  maxStudents?: number | null;
  maxTeachers?: number | null;
  maxEmployees?: number | null;
  maxGuardians?: number | null;
  maxUsers?: number | null;
  maxStorageMb?: number | null;

  modules?: string | null;
  createdAt: string;
}

export interface SubscriptionItem {
  id: string;
  tenantId: string;
  tenant: { id: string; name: string };
  planId: string;
  plan: { id: string; name: string; monthlyPrice: number };
  price: number;
  startDate: string;
  dueDate: string;
  autoRenew: boolean;
  status: string; // TRIAL, ACTIVE, SUSPENDED, CANCELLED, EXPIRED
}

export const PlansPage: React.FC = () => {
  const { addToast } = useToast();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subHistory, setSubHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');

  // Plan Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalTab, setModalTab] = useState<'details' | 'limits' | 'modules'>('details');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formMonthlyPrice, setFormMonthlyPrice] = useState('199');
  const [formYearlyPrice, setFormYearlyPrice] = useState('1990');
  const [formTrialDays, setFormTrialDays] = useState('14');
  const [formSortOrder, setFormSortOrder] = useState('1');

  // Limits
  const [limitStudents, setLimitStudents] = useState<string>('150');
  const [limitTeachers, setLimitTeachers] = useState<string>('15');
  const [limitEmployees, setLimitEmployees] = useState<string>('10');
  const [limitGuardians, setLimitGuardians] = useState<string>('300');
  const [limitUsers, setLimitUsers] = useState<string>('50');
  const [limitStorage, setLimitStorage] = useState<string>('2048');

  // Modules Toggles
  const [modulesState, setModulesState] = useState<Record<string, boolean>>({
    dashboard: true,
    financial: true,
    library: true,
    documents: true,
    communication: true,
    teacherPortal: true,
    studentPortal: true,
    parentPortal: true,
    reports: true,
    aiAssistant: true,
    imports: true,
    exports: true,
    migration: true,
    api: true,
    audit: true,
  });

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans');
      setPlans(res.data.data || []);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar planos SaaS.' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await api.get('/plans/subscriptions');
      setSubscriptions(res.data.data.subscriptions || []);
      setSubHistory(res.data.data.history || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
  }, [fetchPlans, fetchSubscriptions]);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormName('');
    setFormDesc('');
    setFormMonthlyPrice('199');
    setFormYearlyPrice('1990');
    setFormTrialDays('14');
    setFormSortOrder('1');

    setLimitStudents('150');
    setLimitTeachers('15');
    setLimitEmployees('10');
    setLimitGuardians('300');
    setLimitUsers('50');
    setLimitStorage('2048');

    setModulesState({
      dashboard: true,
      financial: true,
      library: true,
      documents: true,
      communication: true,
      teacherPortal: true,
      studentPortal: true,
      parentPortal: true,
      reports: true,
      aiAssistant: true,
      imports: true,
      exports: true,
      migration: true,
      api: true,
      audit: true,
    });

    setModalTab('details');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: PlanItem) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormDesc(plan.description || '');
    setFormMonthlyPrice(plan.monthlyPrice.toString());
    setFormYearlyPrice(plan.yearlyPrice.toString());
    setFormTrialDays(plan.trialDays.toString());
    setFormSortOrder(plan.sortOrder.toString());

    setLimitStudents(plan.maxStudents !== null && plan.maxStudents !== undefined ? plan.maxStudents.toString() : '');
    setLimitTeachers(plan.maxTeachers !== null && plan.maxTeachers !== undefined ? plan.maxTeachers.toString() : '');
    setLimitEmployees(plan.maxEmployees !== null && plan.maxEmployees !== undefined ? plan.maxEmployees.toString() : '');
    setLimitGuardians(plan.maxGuardians !== null && plan.maxGuardians !== undefined ? plan.maxGuardians.toString() : '');
    setLimitUsers(plan.maxUsers !== null && plan.maxUsers !== undefined ? plan.maxUsers.toString() : '');
    setLimitStorage(plan.maxStorageMb !== null && plan.maxStorageMb !== undefined ? plan.maxStorageMb.toString() : '');

    if (plan.modules) {
      try {
        setModulesState(JSON.parse(plan.modules));
      } catch {
        /* fallback */
      }
    }

    setModalTab('details');
    setIsModalOpen(true);
  };

  const handleDuplicate = async (plan: PlanItem) => {
    try {
      await api.post(`/plans/${plan.id}/duplicate`);
      addToast({ type: 'success', message: `Plano ${plan.name} duplicado com sucesso!` });
      fetchPlans();
    } catch {
      addToast({ type: 'error', message: 'Erro ao duplicar plano.' });
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      addToast({ type: 'warning', message: 'O nome do plano é obrigatório.' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formName,
        description: formDesc || null,
        monthlyPrice: parseFloat(formMonthlyPrice),
        yearlyPrice: parseFloat(formYearlyPrice),
        trialDays: parseInt(formTrialDays),
        sortOrder: parseInt(formSortOrder),
        maxStudents: limitStudents ? parseInt(limitStudents) : null,
        maxTeachers: limitTeachers ? parseInt(limitTeachers) : null,
        maxEmployees: limitEmployees ? parseInt(limitEmployees) : null,
        maxGuardians: limitGuardians ? parseInt(limitGuardians) : null,
        maxUsers: limitUsers ? parseInt(limitUsers) : null,
        maxStorageMb: limitStorage ? parseInt(limitStorage) : null,
        modules: modulesState,
      };

      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, payload);
        addToast({ type: 'success', message: 'Plano atualizado com sucesso!' });
      } else {
        await api.post('/plans', payload);
        addToast({ type: 'success', message: 'Novo plano criado com sucesso!' });
      }

      setIsModalOpen(false);
      fetchPlans();
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar configurações do plano.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (moduleKey: string) => {
    setModulesState((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/20 px-2.5 py-1 rounded-md border border-primary/30">
              Gestão Comercial SaaS
            </span>
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {plans.length} Plano(s) Ativo(s)
            </Badge>
          </div>
          <h1 className="text-2xl font-black">Planos, Assinaturas &amp; Licenciamento</h1>
          <p className="text-sm text-slate-300">
            Configure regras de precificação, limites operacionais e liberações de módulos do sistema.
          </p>
        </div>

        <Button
          variant="default"
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleOpenCreate}
          className="shadow-md font-bold"
        >
          Criar Novo Plano
        </Button>
      </div>

      {/* Sub-tabs Header */}
      <div className="flex border-b border-border overflow-x-auto pb-px gap-2">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'plans'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="h-4 w-4" /> Catálogo de Planos
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'subscriptions'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="h-4 w-4" /> Assinaturas das Escolas ({subscriptions.length})
        </button>
      </div>

      {/* TAB 1: CATÁLOGO DE PLANOS */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="stripe-card relative overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-black text-foreground">{plan.name}</CardTitle>
                    <Badge variant={plan.isActive ? 'success' : 'destructive'}>
                      {plan.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs min-h-[36px]">
                    {plan.description || 'Sem descrição.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  {/* Pricing Display */}
                  <div className="p-3 bg-secondary/30 rounded-xl flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">Mensal: </span>
                      <span className="text-xl font-black text-primary">R$ {plan.monthlyPrice.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground">Anual: </span>
                      <span className="text-xs font-bold text-foreground">R$ {plan.yearlyPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Operational Limits */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Limites de Utilização:</span>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div>
                        Alunos:{' '}
                        <strong className="text-foreground">
                          {plan.maxStudents ? plan.maxStudents : 'Ilimitado'}
                        </strong>
                      </div>
                      <div>
                        Professores:{' '}
                        <strong className="text-foreground">
                          {plan.maxTeachers ? plan.maxTeachers : 'Ilimitado'}
                        </strong>
                      </div>
                      <div>
                        Usuários:{' '}
                        <strong className="text-foreground">
                          {plan.maxUsers ? plan.maxUsers : 'Ilimitado'}
                        </strong>
                      </div>
                      <div>
                        Espaço:{' '}
                        <strong className="text-foreground">
                          {plan.maxStorageMb ? `${plan.maxStorageMb} MB` : 'Ilimitado'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Trial Days */}
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-amber-500" /> Período de Teste:{' '}
                    <strong className="text-foreground">{plan.trialDays} dias grátis</strong>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 border-t border-border bg-secondary/10 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(plan)}>
                  <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(plan)} title="Duplicar plano">
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: ASSINATURAS DAS ESCOLAS */}
      {activeTab === 'subscriptions' && (
        <Card className="stripe-card">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">
              Assinaturas e Licenças em Vigor no SaaS ({subscriptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escola / Tenant</TableHead>
                  <TableHead>Plano Contratado</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-center">Renovação</TableHead>
                  <TableHead className="text-center">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                      Nenhuma assinatura registrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-bold text-xs">{sub.tenant?.name || sub.tenantId}</TableCell>
                      <TableCell className="text-xs font-semibold">{sub.plan?.name || 'Standard'}</TableCell>
                      <TableCell className="font-mono text-xs text-emerald-600 font-bold">
                        R$ {sub.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {new Date(sub.dueDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {sub.autoRenew ? 'Automática' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            sub.status === 'ACTIVE' || sub.status === 'TRIAL'
                              ? 'success'
                              : 'destructive'
                          }
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* PLAN CONFIGURATION MODAL (3 TABS) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? `Editar Plano: ${editingPlan.name}` : 'Criar Novo Plano SaaS'}
      >
        <div className="flex border-b border-border overflow-x-auto pb-px mb-4 gap-1">
          <button
            type="button"
            onClick={() => setModalTab('details')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              modalTab === 'details' ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground'
            }`}
          >
            1. Dados &amp; Valores
          </button>
          <button
            type="button"
            onClick={() => setModalTab('limits')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              modalTab === 'limits' ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground'
            }`}
          >
            2. Limites de Uso
          </button>
          <button
            type="button"
            onClick={() => setModalTab('modules')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              modalTab === 'modules' ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground'
            }`}
          >
            3. Liberação de Módulos
          </button>
        </div>

        <form onSubmit={handleSavePlan} className="space-y-4">
          {/* TAB 1: DADOS & VALORES */}
          {modalTab === 'details' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Nome do Plano *</label>
                <Input placeholder="Ex: Plano Plus" value={formName} onChange={(e) => setFormName(e.target.value)} required />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Descrição</label>
                <Input placeholder="Ex: Indicado para escolas até 300 alunos" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Valor Mensal (R$)</label>
                  <Input type="number" step="0.01" value={formMonthlyPrice} onChange={(e) => setFormMonthlyPrice(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Valor Anual (R$)</label>
                  <Input type="number" step="0.01" value={formYearlyPrice} onChange={(e) => setFormYearlyPrice(e.target.value)} required />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Período de Teste (Dias Grátis)</label>
                  <Input type="number" value={formTrialDays} onChange={(e) => setFormTrialDays(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Ordem de Exibição</label>
                  <Input type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIMITES DE USO */}
          {modalTab === 'limits' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-muted-foreground">
                Deixe o campo em branco ou 0 para considerar o limite como <strong>ILIMITADO</strong>.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Máx. Alunos</label>
                  <Input placeholder="Vazio = Ilimitado" type="number" value={limitStudents} onChange={(e) => setLimitStudents(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Máx. Professores</label>
                  <Input placeholder="Vazio = Ilimitado" type="number" value={limitTeachers} onChange={(e) => setLimitTeachers(e.target.value)} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Máx. Funcionários</label>
                  <Input placeholder="Vazio = Ilimitado" type="number" value={limitEmployees} onChange={(e) => setLimitEmployees(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Máx. Responsáveis</label>
                  <Input placeholder="Vazio = Ilimitado" type="number" value={limitGuardians} onChange={(e) => setLimitGuardians(e.target.value)} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Máx. Usuários Totais</label>
                  <Input placeholder="Vazio = Ilimitado" type="number" value={limitUsers} onChange={(e) => setLimitUsers(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Máx. Armazenamento (MB)</label>
                  <Input placeholder="Ex: 5120 para 5GB" type="number" value={limitStorage} onChange={(e) => setLimitStorage(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIBERAÇÃO DE MÓDULOS (TOGGLES) */}
          {modalTab === 'modules' && (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 animate-in fade-in duration-200">
              <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">
                Interruptores de Funcionalidades (Liga / Desliga):
              </span>
              {[
                { key: 'dashboard', label: 'Dashboard Analítico' },
                { key: 'financial', label: 'Gestão Financeira & Mensalidades' },
                { key: 'library', label: 'Biblioteca Digital' },
                { key: 'documents', label: 'Secretaria & Documentos Oficiais' },
                { key: 'communication', label: 'Comunicação & Avisos' },
                { key: 'teacherPortal', label: 'Portal do Professor' },
                { key: 'studentPortal', label: 'Portal do Aluno' },
                { key: 'parentPortal', label: 'Portal dos Pais / Responsáveis' },
                { key: 'reports', label: 'Relatórios & Exportações' },
                { key: 'aiAssistant', label: 'Assistente com Inteligência Artificial' },
                { key: 'imports', label: 'Importação Inteligente de Dados' },
                { key: 'exports', label: 'Exportação Completa' },
                { key: 'migration', label: 'Central de Migração' },
                { key: 'api', label: 'Acesso via API Externa' },
                { key: 'audit', label: 'Logs de Auditoria Detalhados' },
              ].map((m) => (
                <div key={m.key} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors">
                  <span className="text-xs font-bold text-foreground">{m.label}</span>
                  <button
                    type="button"
                    onClick={() => toggleModule(m.key)}
                    className="flex items-center gap-1 focus:outline-none"
                  >
                    {modulesState[m.key] ? (
                      <Badge variant="success" className="cursor-pointer">Liberado</Badge>
                    ) : (
                      <Badge variant="destructive" className="cursor-pointer">Bloqueado</Badge>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" size="sm" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlansPage;
