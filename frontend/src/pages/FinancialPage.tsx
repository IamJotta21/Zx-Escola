import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  RefreshCw,
  Printer,
  FileText,
  CreditCard,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Users,
  Calendar,
  ShieldCheck,
  Edit3,
  Copy,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
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
import { DocumentViewerModal, DocumentData } from '../components/portal/DocumentViewerModal';

interface ClassShort {
  id: string;
  name: string;
}

interface StudentListItem {
  id: string;
  cpf?: string | null;
  class?: ClassShort | null;
  user: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

interface TuitionItem {
  id: string;
  description: string;
  dueDate: string;
  value: number;
  discount: number;
  scholarshipPercent: number;
  fine: number;
  interest: number;
  finalValue: number;
  status: string; // PENDENTE, PAGO, ATRASADO
  paymentMethod: string | null;
  paymentDate: string | null;
  student?: StudentListItem;
}

interface TransactionItem {
  id: string;
  type: string; // RECEITA, DESPESA
  category: string;
  description: string;
  value: number;
  date: string;
  paymentMethod: string | null;
}

interface FinancialSummary {
  totalRevenues: number;
  totalExpenses: number;
  balance: number;
  monthRevenue: number;
  defaultRate: number;
  paidCount: number;
  paidSum: number;
  pendingCount: number;
  pendingSum: number;
  overdueCount: number;
  overdueSum: number;
  totalTuitionsCount: number;
}

export const FinancialPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tuition' | 'cashflow' | 'reports'>(
    'dashboard'
  );
  const [reportSubTab, setReportSubTab] = useState<'paid' | 'pending' | 'overdue'>('paid');

  // Summary and Stats Data
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenues: 0,
    totalExpenses: 0,
    balance: 0,
    monthRevenue: 0,
    defaultRate: 0,
    paidCount: 0,
    paidSum: 0,
    pendingCount: 0,
    pendingSum: 0,
    overdueCount: 0,
    overdueSum: 0,
    totalTuitionsCount: 0,
  });

  const [overdueList, setOverdueList] = useState<TuitionItem[]>([]);
  const [paidList, setPaidList] = useState<TuitionItem[]>([]);
  const [pendingList, setPendingList] = useState<TuitionItem[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [classes, setClasses] = useState<ClassShort[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [tuitions, setTuitions] = useState<TuitionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Multi-criteria filter states for Tuitions List
  const [filterSearch, setFilterSearch] = useState('');
  const [filterClassId, setFilterClassId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // ── 1. Installments Modal State ─────────────────────────────────────────────
  const [selectedStudentForInstallments, setSelectedStudentForInstallments] =
    useState<StudentListItem | null>(null);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
  const [instValue, setInstValue] = useState('500.00');
  const [instDiscount, setInstDiscount] = useState('0.00');
  const [instScholarship, setInstScholarship] = useState('0');
  const [instMonths, setInstMonths] = useState('12');
  const [generatingInstallments, setGeneratingInstallments] = useState(false);

  // ── 2. Payment Confirmation Modal State ────────────────────────────────────
  const [payingTuitionItem, setPayingTuitionItem] = useState<TuitionItem | null>(null);
  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false);
  const [payMethod, setPayMethod] = useState('PIX');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [processingPayment, setProcessingPayment] = useState(false);

  // ── 3. Edit Tuition Modal State ──────────────────────────────────────────────
  const [editingTuitionItem, setEditingTuitionItem] = useState<TuitionItem | null>(null);
  const [isEditTuitionOpen, setIsEditTuitionOpen] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [editScholarship, setEditScholarship] = useState('');
  const [savingEditTuition, setSavingEditTuition] = useState(false);

  // ── 4. Cash Flow Transaction Modal State ─────────────────────────────────────
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transType, setTransType] = useState<'RECEITA' | 'DESPESA'>('RECEITA');
  const [transCategory, setTransCategory] = useState('Outros');
  const [transDesc, setTransDesc] = useState('');
  const [transVal, setTransVal] = useState('');
  const [transDate, setTransDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transMethod, setTransMethod] = useState('PIX');
  const [savingTransaction, setSavingTransaction] = useState(false);

  // Document Viewer Modal State
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [selectedDocData, setSelectedDocData] = useState<DocumentData | null>(null);

  // ── Fetch Operations ────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/financial/summary');
      setSummary(data.summary || {
        totalRevenues: 0,
        totalExpenses: 0,
        balance: 0,
        monthRevenue: 0,
        defaultRate: 0,
        paidCount: 0,
        paidSum: 0,
        pendingCount: 0,
        pendingSum: 0,
        overdueCount: 0,
        overdueSum: 0,
        totalTuitionsCount: 0,
      });
      setOverdueList(data.overdueList || []);
      setPaidList(data.paidList || []);
      setPendingList(data.pendingList || []);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar estatísticas financeiras.' });
    }
  }, [addToast]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/students', { params: { limit: '300' } });
      setStudents(res.data.data.students || []);
    } catch {
      /* silent */
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.data || []);
    } catch {
      /* silent */
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await api.get('/financial/transactions');
      setTransactions(res.data.data || []);
    } catch {
      /* silent */
    }
  }, []);

  const fetchTuitions = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterSearch) params.search = filterSearch;
      if (filterClassId) params.classId = filterClassId;
      if (filterStatus) params.status = filterStatus;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;

      const res = await api.get('/financial/tuitions', { params });
      setTuitions(res.data.data || []);
    } catch {
      addToast({ type: 'error', message: 'Erro ao filtrar mensalidades.' });
    } finally {
      setLoading(false);
    }
  }, [filterSearch, filterClassId, filterStatus, filterStartDate, filterEndDate, addToast]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(),
      fetchStudents(),
      fetchClasses(),
      fetchTransactions(),
      fetchTuitions(),
    ]);
    setLoading(false);
  }, [fetchSummary, fetchStudents, fetchClasses, fetchTransactions, fetchTuitions]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refetch tuitions when filters change
  useEffect(() => {
    fetchTuitions();
  }, [filterSearch, filterClassId, filterStatus, filterStartDate, filterEndDate]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleGenerateInstallments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForInstallments) return;

    try {
      setGeneratingInstallments(true);
      await api.post('/financial/installments', {
        studentId: selectedStudentForInstallments.id,
        value: parseFloat(instValue),
        discount: parseFloat(instDiscount),
        scholarshipPercent: parseFloat(instScholarship),
        months: parseInt(instMonths),
      });

      addToast({ type: 'success', message: 'Mensalidades geradas com sucesso!' });
      setIsInstallmentsModalOpen(false);
      fetchAllData();
    } catch {
      addToast({ type: 'error', message: 'Erro ao gerar mensalidades.' });
    } finally {
      setGeneratingInstallments(false);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingTuitionItem) return;

    try {
      setProcessingPayment(true);
      await api.post(`/financial/pay/${payingTuitionItem.id}`, {
        paymentMethod: payMethod,
        paymentDate: payDate,
      });

      addToast({ type: 'success', message: 'Pagamento confirmado e registrado no caixa!' });
      setIsPayConfirmOpen(false);
      setPayingTuitionItem(null);
      fetchAllData();
    } catch {
      addToast({ type: 'error', message: 'Erro ao processar pagamento.' });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleOpenEditTuition = (item: TuitionItem) => {
    setEditingTuitionItem(item);
    setEditDesc(item.description);
    setEditDueDate(item.dueDate);
    setEditValue(item.value.toString());
    setEditDiscount(item.discount.toString());
    setEditScholarship(item.scholarshipPercent.toString());
    setIsEditTuitionOpen(true);
  };

  const handleSaveEditTuition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTuitionItem) return;

    try {
      setSavingEditTuition(true);
      await api.put(`/financial/tuitions/${editingTuitionItem.id}`, {
        description: editDesc,
        dueDate: editDueDate,
        value: parseFloat(editValue),
        discount: parseFloat(editDiscount),
        scholarshipPercent: parseFloat(editScholarship),
      });

      addToast({ type: 'success', message: 'Parcela atualizada com sucesso!' });
      setIsEditTuitionOpen(false);
      fetchAllData();
    } catch {
      addToast({ type: 'error', message: 'Erro ao editar parcela.' });
    } finally {
      setSavingEditTuition(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transDesc || !transVal) return;

    try {
      setSavingTransaction(true);
      await api.post('/financial/transactions', {
        type: transType,
        category: transCategory,
        description: transDesc,
        value: parseFloat(transVal),
        date: transDate,
        paymentMethod: transMethod,
      });

      addToast({ type: 'success', message: 'Lançamento registrado com sucesso!' });
      setIsTransactionModalOpen(false);
      setTransDesc('');
      setTransVal('');
      fetchAllData();
    } catch {
      addToast({ type: 'error', message: 'Erro ao criar lançamento de caixa.' });
    } finally {
      setSavingTransaction(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Deseja excluir este lançamento de caixa?')) return;
    try {
      await api.delete(`/financial/transactions/${id}`);
      addToast({ type: 'success', message: 'Lançamento excluído.' });
      fetchAllData();
    } catch {
      addToast({ type: 'error', message: 'Erro ao excluir lançamento.' });
    }
  };

  const handleOpenReceiptViewer = (item: TuitionItem) => {
    const studentName = item.student?.user.profile
      ? `${item.student.user.profile.firstName} ${item.student.user.profile.lastName}`
      : item.student?.user.email || 'Aluno';

    setSelectedDocData({
      title: `Comprovante de Quitação - ${item.description}`,
      type: 'COMPROVANTE',
      studentName,
      studentId: item.student?.id || item.id,
      className: item.student?.class?.name || null,
      tuitionInfo: {
        description: item.description,
        value: item.finalValue,
        paymentDate: item.paymentDate,
        paymentMethod: item.paymentMethod,
        status: item.status,
      },
    });
    setViewerModalOpen(true);
  };

  const getStudentName = (st?: StudentListItem) => {
    if (!st) return 'Aluno não identificado';
    return st.user?.profile
      ? `${st.user.profile.firstName} ${st.user.profile.lastName}`
      : st.user?.email;
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (status === 'PAGO') return <Badge variant="success">Pago</Badge>;
    if (status === 'ATRASADO' || dueDate < todayStr)
      return <Badge variant="destructive">Vencido</Badge>;
    return <Badge variant="warning">Pendente</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/20 px-2.5 py-1 rounded-md border border-primary/30">
              Gestão Financeira Escolar
            </span>
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              Ano Letivo {new Date().getFullYear()}
            </Badge>
          </div>
          <h1 className="text-2xl font-black">Controle Financeiro, Caixa e Inadimplência</h1>
          <p className="text-sm text-slate-300">
            Acompanhe a receita do mês, índice de inadimplência, mensalidades e fluxo de caixa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-white hover:bg-slate-800"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsTransactionModalOpen(true)}
          >
            Lançamento Caixa
          </Button>
          <Button
            variant="default"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              if (students.length > 0) setSelectedStudentForInstallments(students[0]);
              setIsInstallmentsModalOpen(true);
            }}
          >
            Gerar Mensalidades
          </Button>
        </div>
      </div>

      {/* 4 DASHBOARD PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Receita do Mês */}
        <Card className="stripe-card bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Receita do Mês
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                R$ {summary.monthRevenue.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Total arrecadado no mês vigente
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Taxa de Inadimplência */}
        <Card className="stripe-card bg-gradient-to-br from-rose-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> Inadimplência
              </div>
              <div className="text-2xl font-black text-rose-500 mt-1">
                {summary.defaultRate}%
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {summary.overdueCount} parcela(s) • R$ {summary.overdueSum.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
              <TrendingDown className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Mensalidades Pagas */}
        <Card className="stripe-card bg-gradient-to-br from-indigo-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" /> Mensalidades Pagas
              </div>
              <div className="text-2xl font-black text-foreground mt-1">
                {summary.paidCount}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Soma: R$ {summary.paidSum.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Mensalidades Pendentes */}
        <Card className="stripe-card bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" /> Mensalidades Pendentes
              </div>
              <div className="text-2xl font-black text-foreground mt-1">
                {summary.pendingCount}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                A vencer: R$ {summary.pendingSum.toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Tabs Header */}
      <div className="flex border-b border-border overflow-x-auto pb-px gap-2">
        {[
          { key: 'dashboard', label: 'Painel Geral', icon: <PieChart className="h-4 w-4" /> },
          { key: 'tuition', label: 'Mensalidades & Filtros', icon: <DollarSign className="h-4 w-4" /> },
          { key: 'cashflow', label: 'Fluxo de Caixa', icon: <TrendingUp className="h-4 w-4" /> },
          { key: 'reports', label: 'Relatórios Financeiros', icon: <FileText className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-primary font-black scale-105'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PAINEL GERAL (DASHBOARD) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Financial Balance Summary */}
            <Card className="stripe-card">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-foreground">
                  Resumo de Caixa Acadêmico
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Total de Receitas</span>
                  <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                    + R$ {summary.totalRevenues.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300">Total de Despesas</span>
                  <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                    - R$ {summary.totalExpenses.toFixed(2)}
                  </span>
                </div>

                <div className="pt-2 border-t border-border flex justify-between items-center">
                  <span className="text-sm font-extrabold text-foreground">Saldo em Caixa</span>
                  <span
                    className={`text-lg font-black font-mono ${
                      summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    R$ {summary.balance.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Overdue Alert Widget */}
            <Card className="stripe-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" /> Alunos Inadimplentes Recentes
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('reports')}>
                  Ver relatório
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {overdueList.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Nenhuma parcela vencida no momento. Parabéns!
                  </p>
                ) : (
                  overdueList.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-foreground">
                          {getStudentName(item.student)}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Venc: {item.dueDate} • {item.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-rose-600 font-mono">
                          R$ {item.finalValue.toFixed(2)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-primary"
                          onClick={() => {
                            setPayingTuitionItem(item);
                            setIsPayConfirmOpen(true);
                          }}
                        >
                          Baixar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: MENSALIDADES & FILTROS AVANÇADOS */}
      {activeTab === 'tuition' && (
        <div className="space-y-6">
          {/* Multi-Criteria Search & Filter Panel */}
          <Card className="stripe-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" /> Filtros Avançados de Busca
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Aluno */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                  Aluno (Nome / CPF)
                </label>
                <Input
                  placeholder="Buscar aluno..."
                  leftIcon={<Search className="h-3.5 w-3.5 text-muted-foreground" />}
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
              </div>

              {/* Filter Turma */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                  Turma
                </label>
                <Select value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)}>
                  <option value="">Todas as Turmas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Filter Situação */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                  Situação
                </label>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">Todas as Situações</option>
                  <option value="PAGO">Pago</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="ATRASADO">Vencido / Atrasado</option>
                </Select>
              </div>

              {/* Data Início */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                  Vencimento De:
                </label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>

              {/* Data Fim */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                  Vencimento Até:
                </label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tuitions Breakdown Table */}
          <Card className="stripe-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">
                Tabela Detalhada de Mensalidades ({tuitions.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterSearch('');
                  setFilterClassId('');
                  setFilterStatus('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
              >
                Limpar Filtros
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno / Turma</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-center">Valor Base</TableHead>
                    <TableHead className="text-center">Desc. / Bolsa</TableHead>
                    <TableHead className="text-center">Multa / Juros</TableHead>
                    <TableHead className="text-center">Valor Final</TableHead>
                    <TableHead className="text-center">Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tuitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">
                        Nenhuma mensalidade encontrada para os critérios selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tuitions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-bold text-xs text-foreground">
                            {getStudentName(item.student)}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {item.student?.class?.name || 'Sem Turma'}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs font-medium">{item.description}</TableCell>

                        <TableCell className="font-mono text-xs font-semibold">
                          {item.dueDate}
                        </TableCell>

                        <TableCell className="text-center font-mono text-xs">
                          R$ {item.value.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-center font-mono text-xs text-emerald-600">
                          {item.discount > 0 ? `R$ ${item.discount.toFixed(2)}` : ''}
                          {item.scholarshipPercent > 0 ? ` (${item.scholarshipPercent}%)` : ''}
                          {item.discount === 0 && item.scholarshipPercent === 0 ? '—' : ''}
                        </TableCell>

                        <TableCell className="text-center font-mono text-xs text-rose-500">
                          {item.fine > 0 || item.interest > 0
                            ? `R$ ${(item.fine + item.interest).toFixed(2)}`
                            : '—'}
                        </TableCell>

                        <TableCell className="text-center font-black font-mono text-xs text-foreground">
                          R$ {item.finalValue.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-center">
                          {getStatusBadge(item.status, item.dueDate)}
                        </TableCell>

                        <TableCell className="text-right space-x-1 whitespace-nowrap">
                          {item.status !== 'PAGO' ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPayingTuitionItem(item);
                                  setIsPayConfirmOpen(true);
                                }}
                              >
                                Dar Baixa
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditTuition(item)}
                              >
                                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Printer className="h-3.5 w-3.5" />}
                              onClick={() => handleOpenReceiptViewer(item)}
                            >
                              Recibo
                            </Button>
                          )}
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

      {/* TAB 3: FLUXO DE CAIXA */}
      {activeTab === 'cashflow' && (
        <Card className="stripe-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground">
              Lançamentos de Caixa (Receitas e Despesas)
            </CardTitle>
            <Button
              variant="default"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsTransactionModalOpen(true)}
            >
              Novo Lançamento
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Forma de Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                      Nenhum lançamento no fluxo de caixa.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs font-semibold">{t.date}</TableCell>
                      <TableCell>
                        <Badge variant={t.type === 'RECEITA' ? 'success' : 'destructive'}>
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold">{t.category}</TableCell>
                      <TableCell className="text-xs">{t.description}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{t.paymentMethod || '—'}</TableCell>
                      <TableCell className="text-right font-black font-mono text-xs">
                        <span className={t.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-500'}>
                          {t.type === 'RECEITA' ? '+' : '-'} R$ {t.value.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-500 hover:text-rose-600"
                          onClick={() => handleDeleteTransaction(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: RELATÓRIOS FINANCEIROS DEDICADOS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex border-b border-border gap-2 pb-px">
            <button
              onClick={() => setReportSubTab('paid')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                reportSubTab === 'paid'
                  ? 'border-emerald-500 text-emerald-600 font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              ✅ Pagos ({paidList.length})
            </button>
            <button
              onClick={() => setReportSubTab('pending')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                reportSubTab === 'pending'
                  ? 'border-amber-500 text-amber-600 font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              ⏳ Pendentes ({pendingList.length})
            </button>
            <button
              onClick={() => setReportSubTab('overdue')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                reportSubTab === 'overdue'
                  ? 'border-rose-500 text-rose-600 font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              ⚠️ Vencidos / Inadimplência ({overdueList.length})
            </button>
          </div>

          {/* Sub-tab 1: PAGOS */}
          {reportSubTab === 'paid' && (
            <Card className="stripe-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Relatório de Mensalidades Quitadas
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer className="h-4 w-4" />}
                  onClick={() => window.print()}
                >
                  Imprimir Relatório
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno / Turma</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Data do Pagamento</TableHead>
                      <TableHead className="text-center">Método</TableHead>
                      <TableHead className="text-right">Valor Quitado</TableHead>
                      <TableHead className="text-right">Recibo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                          Nenhuma mensalidade paga registrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paidList.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-bold text-xs text-foreground">
                              {getStudentName(item.student)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {item.student?.class?.name || 'Sem Turma'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold">{item.description}</TableCell>
                          <TableCell className="font-mono text-xs">{item.dueDate}</TableCell>
                          <TableCell className="font-mono text-xs text-emerald-600 font-bold">
                            {item.paymentDate || '—'}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs">
                            {item.paymentMethod || 'PIX'}
                          </TableCell>
                          <TableCell className="text-right font-black font-mono text-xs text-emerald-600">
                            R$ {item.finalValue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenReceiptViewer(item)}
                            >
                              Comprovante
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Sub-tab 2: PENDENTES */}
          {reportSubTab === 'pending' && (
            <Card className="stripe-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  Relatório de Mensalidades A Vencer
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer className="h-4 w-4" />}
                  onClick={() => window.print()}
                >
                  Imprimir Relatório
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno / Turma</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-center">Valor Base</TableHead>
                      <TableHead className="text-center">Desconto</TableHead>
                      <TableHead className="text-right">Valor Previsto</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                          Nenhuma mensalidade pendente a vencer.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingList.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-bold text-xs text-foreground">
                              {getStudentName(item.student)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {item.student?.class?.name || 'Sem Turma'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold">{item.description}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-foreground">
                            {item.dueDate}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs">
                            R$ {item.value.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-emerald-600">
                            {item.discount > 0 ? `R$ ${item.discount.toFixed(2)}` : '—'}
                          </TableCell>
                          <TableCell className="text-right font-black font-mono text-xs text-foreground">
                            R$ {item.finalValue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPayingTuitionItem(item);
                                setIsPayConfirmOpen(true);
                              }}
                            >
                              Receber
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Sub-tab 3: VENCIDOS (INADIMPLÊNCIA) */}
          {reportSubTab === 'overdue' && (
            <Card className="stripe-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  Relatório Analítico de Inadimplência e Vencidos
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer className="h-4 w-4" />}
                  onClick={() => window.print()}
                >
                  Imprimir Relatório
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno / Turma</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data Vencimento</TableHead>
                      <TableHead className="text-center">Valor Base</TableHead>
                      <TableHead className="text-center">Multa (2%) + Juros</TableHead>
                      <TableHead className="text-right">Valor Atualizado</TableHead>
                      <TableHead className="text-right">Cobrança</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                          Nenhum aluno inadimplente ou parcela vencida.
                        </TableCell>
                      </TableRow>
                    ) : (
                      overdueList.map((item) => {
                        const netBase = item.value * (1 - item.scholarshipPercent / 100) - item.discount;
                        const estimatedFineInterest = item.fine > 0 || item.interest > 0
                          ? item.fine + item.interest
                          : netBase * 0.02;
                        const updatedVal = Math.max(0, netBase + estimatedFineInterest);

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-bold text-xs text-foreground">
                                {getStudentName(item.student)}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {item.student?.class?.name || 'Sem Turma'}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold">{item.description}</TableCell>
                            <TableCell className="font-mono text-xs font-bold text-rose-600">
                              {item.dueDate}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              R$ {netBase.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs text-rose-600 font-bold">
                              + R$ {estimatedFineInterest.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-black font-mono text-xs text-rose-600">
                              R$ {updatedVal.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPayingTuitionItem(item);
                                  setIsPayConfirmOpen(true);
                                }}
                              >
                                Baixar / Quitar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── MODAL 1: GERAR MENSALIDADES ────────────────────────────────────────── */}
      <Modal
        isOpen={isInstallmentsModalOpen}
        onClose={() => setIsInstallmentsModalOpen(false)}
        title="Gerar Carnê de Mensalidades para Aluno"
      >
        <form onSubmit={handleGenerateInstallments} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Selecionar Aluno *</label>
            <Select
              value={selectedStudentForInstallments?.id || ''}
              onChange={(e) => {
                const st = students.find((s) => s.id === e.target.value);
                if (st) setSelectedStudentForInstallments(st);
              }}
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {getStudentName(st)} ({st.class?.name || 'Sem Turma'})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Valor Base da Mensalidade (R$) *</label>
              <Input
                type="number"
                step="0.01"
                value={instValue}
                onChange={(e) => setInstValue(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Desconto Fixo (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={instDiscount}
                onChange={(e) => setInstDiscount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Bolsa de Estudos (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={instScholarship}
                onChange={(e) => setInstScholarship(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Quantidade de Parcelas (Meses)</label>
              <Input
                type="number"
                min="1"
                max="24"
                value={instMonths}
                onChange={(e) => setInstMonths(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsInstallmentsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" size="sm" type="submit" disabled={generatingInstallments}>
              {generatingInstallments ? 'Gerando...' : 'Gerar Parcelas'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 2: DAR BAIXA / CONFIRMAR PAGAMENTO ───────────────────────────── */}
      <Modal
        isOpen={isPayConfirmOpen}
        onClose={() => setIsPayConfirmOpen(false)}
        title="Confirmar Pagamento e Baixa de Mensalidade"
      >
        {payingTuitionItem && (
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div className="p-3 bg-muted rounded-xl space-y-1 text-xs">
              <div>Aluno: <strong>{getStudentName(payingTuitionItem.student)}</strong></div>
              <div>Descrição: <strong>{payingTuitionItem.description}</strong></div>
              <div>Vencimento: <strong>{payingTuitionItem.dueDate}</strong></div>
              <div>Valor Previsto: <strong>R$ {payingTuitionItem.finalValue.toFixed(2)}</strong></div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Forma de Pagamento *</label>
                <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="CARTAO">Cartão de Crédito/Débito</option>
                  <option value="DINHEIRO">Dinheiro Espécie</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Data do Pagamento *</label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsPayConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="default" size="sm" type="submit" disabled={processingPayment}>
                {processingPayment ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── MODAL 3: EDITAR PARCELA DE MENSALIDADE ─────────────────────────────── */}
      <Modal
        isOpen={isEditTuitionOpen}
        onClose={() => setIsEditTuitionOpen(false)}
        title="Editar Dados da Mensalidade"
      >
        <form onSubmit={handleSaveEditTuition} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Descrição</label>
            <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} required />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Data de Vencimento</label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Valor Base (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Desconto Fixo (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={editDiscount}
                onChange={(e) => setEditDiscount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Bolsa (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={editScholarship}
                onChange={(e) => setEditScholarship(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditTuitionOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" size="sm" type="submit" disabled={savingEditTuition}>
              {savingEditTuition ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL 4: REGISTRAR LANÇAMENTO DE CAIXA ──────────────────────────────── */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Registrar Lançamento de Caixa (Receita / Despesa)"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Tipo de Lançamento *</label>
              <Select value={transType} onChange={(e) => setTransType(e.target.value as any)}>
                <option value="RECEITA">RECEITA (Entrada)</option>
                <option value="DESPESA">DESPESA (Saída)</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Categoria *</label>
              <Select value={transCategory} onChange={(e) => setTransCategory(e.target.value)}>
                <option value="Mensalidade">Mensalidade</option>
                <option value="Material Escolar">Material Escolar</option>
                <option value="Eventos">Eventos / Taxas</option>
                <option value="Salários">Salários de Funcionários</option>
                <option value="Aluguel">Aluguel / Infraestrutura</option>
                <option value="Água / Luz / Internet">Água / Luz / Internet</option>
                <option value="Outros">Outros Lançamentos</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Descrição do Lançamento *</label>
            <Input
              placeholder="Ex: Pagamento de Energia Elétrica / Venda de Uniforme"
              value={transDesc}
              onChange={(e) => setTransDesc(e.target.value)}
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Valor (R$) *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={transVal}
                onChange={(e) => setTransVal(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Data *</label>
              <Input
                type="date"
                value={transDate}
                onChange={(e) => setTransDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsTransactionModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" size="sm" type="submit" disabled={savingTransaction}>
              {savingTransaction ? 'Salvando...' : 'Salvar Lançamento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Viewer Modal for Receipts */}
      <DocumentViewerModal
        isOpen={viewerModalOpen}
        onClose={() => setViewerModalOpen(false)}
        document={selectedDocData}
      />
    </div>
  );
};

export default FinancialPage;
