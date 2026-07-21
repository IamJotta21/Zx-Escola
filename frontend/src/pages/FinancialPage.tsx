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
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
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

interface StudentListItem {
  id: string;
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
  overdueSum: number;
  overdueCount: number;
}

export const FinancialPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tuition' | 'cashflow' | 'reports'>(
    'dashboard'
  );

  // Data states
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenues: 0,
    totalExpenses: 0,
    balance: 0,
    overdueSum: 0,
    overdueCount: 0,
  });
  const [overdueList, setOverdueList] = useState<TuitionItem[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  // ── 1. Installments Modal ───────────────────────────────────────────────────
  const [selectedStudentForInstallments, setSelectedStudentForInstallments] =
    useState<StudentListItem | null>(null);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
  const [instValue, setInstValue] = useState('500.00');
  const [instDiscount, setInstDiscount] = useState('0.00');
  const [instScholarship, setInstScholarship] = useState('0');
  const [instMonths, setInstMonths] = useState('12');
  const [generatingInstallments, setGeneratingInstallments] = useState(false);

  // ── 2. Student Tuitions View Modal ──────────────────────────────────────────
  const [selectedStudentForView, setSelectedStudentForView] = useState<StudentListItem | null>(
    null
  );
  const [isTuitionsViewOpen, setIsTuitionsViewOpen] = useState(false);
  const [studentTuitions, setStudentTuitions] = useState<TuitionItem[]>([]);
  const [loadingTuitions, setLoadingTuitions] = useState(false);

  // Payment Confirmation Modal
  const [payingTuitionItem, setPayingTuitionItem] = useState<TuitionItem | null>(null);
  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false);
  const [payMethod, setPayMethod] = useState('PIX');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [processingPayment, setProcessingPayment] = useState(false);

  // ── 3. Cash Flow Transaction Modals ──────────────────────────────────────────
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transType, setTransType] = useState<'RECEITA' | 'DESPESA'>('RECEITA');
  const [transCategory, setTransCategory] = useState('Outros');
  const [transDesc, setTransDesc] = useState('');
  const [transVal, setTransVal] = useState('');
  const [transDate, setTransDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transMethod, setTransMethod] = useState('PIX');
  const [savingTransaction, setSavingTransaction] = useState(false);

  // ── Fetch Operations ────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/financial/summary');
      setSummary(res.data.data.summary);
      setOverdueList(res.data.data.overdueList);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar estatísticas financeiras.' });
    }
  }, [addToast]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/students', { params: { limit: '200' } });
      setStudents(res.data.data.students);
    } catch {
      // Fail silently
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await api.get('/financial/transactions');
      setTransactions(res.data.data);
    } catch {
      // Fail silently
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchSummary(), fetchStudents(), fetchTransactions()]);
  }, [fetchSummary, fetchStudents, fetchTransactions]);

  useEffect(() => {
    fetchAllData();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 1. Installments Action ───────────────────────────────────────────────────
  const openInstallmentsModal = (student: StudentListItem) => {
    setSelectedStudentForInstallments(student);
    setInstValue('500.00');
    setInstDiscount('0.00');
    setInstScholarship('0');
    setInstMonths('12');
    setIsInstallmentsModalOpen(true);
  };

  const handleGenerateInstallments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForInstallments) return;

    const parsedVal = parseFloat(instValue);
    const parsedDisc = parseFloat(instDiscount);
    const parsedScholar = parseFloat(instScholarship);
    const parsedMonths = parseInt(instMonths);

    if (isNaN(parsedVal) || parsedVal <= 0) {
      addToast({
        type: 'warning',
        message: 'O valor da mensalidade deve ser um número positivo maior que zero.',
      });
      return;
    }
    if (isNaN(parsedDisc) || parsedDisc < 0) {
      addToast({ type: 'warning', message: 'O desconto deve ser maior ou igual a zero.' });
      return;
    }
    if (isNaN(parsedScholar) || parsedScholar < 0 || parsedScholar > 100) {
      addToast({ type: 'warning', message: 'A porcentagem de bolsa deve ser entre 0% e 100%.' });
      return;
    }
    if (isNaN(parsedMonths) || parsedMonths < 1 || parsedMonths > 24) {
      addToast({
        type: 'warning',
        message: 'A quantidade de parcelas deve ser entre 1 e 24 meses.',
      });
      return;
    }

    setGeneratingInstallments(true);
    try {
      await api.post('/financial/installments', {
        studentId: selectedStudentForInstallments.id,
        value: parsedVal,
        discount: parsedDisc,
        scholarshipPercent: parsedScholar,
        months: parsedMonths,
      });

      addToast({
        type: 'success',
        title: 'Carnê Gerado',
        message: `As ${instMonths} parcelas foram geradas para o aluno com sucesso.`,
      });
      setIsInstallmentsModalOpen(false);
    } catch {
      addToast({ type: 'error', message: 'Falha ao gerar parcelas financeiras.' });
    } finally {
      setGeneratingInstallments(false);
    }
  };

  // ── 2. Student Tuitions Action ──────────────────────────────────────────────
  const openTuitionsView = async (student: StudentListItem) => {
    setSelectedStudentForView(student);
    setIsTuitionsViewOpen(true);
    setLoadingTuitions(true);
    try {
      const res = await api.get(`/financial/student/${student.id}`);
      setStudentTuitions(res.data.data);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar mensalidades do aluno.' });
    } finally {
      setLoadingTuitions(false);
    }
  };

  const reloadTuitions = async (studentId: string) => {
    setLoadingTuitions(true);
    try {
      const res = await api.get(`/financial/student/${studentId}`);
      setStudentTuitions(res.data.data);
    } catch {
      // Fail silently
    } finally {
      setLoadingTuitions(false);
    }
  };

  // Payment Logic
  const openPayConfirmModal = (item: TuitionItem) => {
    setPayingTuitionItem(item);
    setPayMethod('PIX');
    setPayDate(new Date().toISOString().split('T')[0]);
    setIsPayConfirmOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!payingTuitionItem) return;
    setProcessingPayment(true);
    try {
      await api.post(`/financial/pay/${payingTuitionItem.id}`, {
        paymentMethod: payMethod,
        paymentDate: payDate,
      });

      addToast({
        type: 'success',
        title: 'Pagamento Baixado',
        message: 'A parcela foi marcada como paga e o caixa foi atualizado.',
      });
      setIsPayConfirmOpen(false);
      // Reload student list & stats
      if (selectedStudentForView) {
        reloadTuitions(selectedStudentForView.id);
      }
      fetchSummary();
    } catch {
      addToast({ type: 'error', message: 'Erro ao processar baixa de pagamento.' });
    } finally {
      setProcessingPayment(false);
    }
  };

  // ── 3. Manual Cash Flow Logic ────────────────────────────────────────────────
  const openTransactionModal = (type: 'RECEITA' | 'DESPESA') => {
    setTransType(type);
    setTransCategory(type === 'RECEITA' ? 'Mensalidade' : 'Luz');
    setTransDesc('');
    setTransVal('');
    setTransDate(new Date().toISOString().split('T')[0]);
    setTransMethod('PIX');
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transDesc || !transVal) {
      addToast({ type: 'warning', message: 'Descrição e valor são obrigatórios.' });
      return;
    }

    const val = parseFloat(transVal);
    if (isNaN(val) || val <= 0) {
      addToast({
        type: 'warning',
        message: 'O valor da movimentação deve ser um número positivo maior que zero.',
      });
      return;
    }

    setSavingTransaction(true);
    try {
      await api.post('/financial/transactions', {
        type: transType,
        category: transCategory,
        description: transDesc,
        value: val,
        date: transDate,
        paymentMethod: transMethod,
      });

      addToast({
        type: 'success',
        title: 'Lançamento Efetuado',
        message: 'O fluxo de caixa foi atualizado.',
      });
      setIsTransactionModalOpen(false);
      fetchTransactions();
      fetchSummary();
    } catch {
      addToast({ type: 'error', message: 'Falha ao lançar movimentação.' });
    } finally {
      setSavingTransaction(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (
      !confirm(
        'Deseja excluir este lançamento do fluxo de caixa? Isso não alterará o status das mensalidades vinculadas.'
      )
    )
      return;
    try {
      await api.delete(`/financial/transactions/${id}`);
      addToast({ type: 'success', message: 'Lançamento removido.' });
      fetchTransactions();
      fetchSummary();
    } catch {
      addToast({ type: 'error', message: 'Erro ao remover lançamento.' });
    }
  };

  // Printing Layout report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-foreground">
            Gestão Financeira
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de fluxo de caixa, mensalidades dos alunos, inadimplência e relatórios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            size="sm"
            onClick={() => openTransactionModal('RECEITA')}
          >
            Receita
          </Button>
          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            size="sm"
            onClick={() => openTransactionModal('DESPESA')}
          >
            Despesa
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border print:hidden">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'dashboard'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Dashboard Financeiro
        </button>
        <button
          onClick={() => setActiveTab('tuition')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tuition'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Mensalidades & Alunos
        </button>
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'cashflow'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          Fluxo de Caixa
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Printer className="h-4 w-4" />
          Demonstrativo & Relatórios
        </button>
      </div>

      {/* ── 1. Dashboard Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 print:hidden">
          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="stripe-card border-l-4 border-l-emerald-500 bg-emerald-500/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>FATURAMENTO (RECEITAS)</span>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-foreground">
                  R$ {summary.totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card className="stripe-card border-l-4 border-l-rose-500 bg-rose-500/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>CUSTOS (DESPESAS)</span>
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                </div>
                <div className="text-2xl font-extrabold text-foreground">
                  R$ {summary.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card className="stripe-card border-l-4 border-l-primary bg-primary/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>SALDO EM CAIXA</span>
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div
                  className={`text-2xl font-extrabold ${summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card className="stripe-card border-l-4 border-l-amber-500 bg-amber-500/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>INADIMPLÊNCIA ATIVA</span>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-extrabold text-foreground">
                  R$ {summary.overdueSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {summary.overdueCount} parcelas atrasadas
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overdue/Defaulters List */}
          <Card className="stripe-card">
            <CardContent className="p-6">
              <h2 className="text-sm font-bold text-foreground mb-4">
                Lista de Alunos Inadimplentes (Débitos)
              </h2>
              {overdueList.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-10">
                  Nenhum aluno em atraso financeiro ativo. Parabéns!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Identificação da Parcela</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor Original</TableHead>
                      <TableHead>Valor com Descontos/Bolsa</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueList.map((item) => {
                      const stName = item.student?.user.profile
                        ? `${item.student.user.profile.firstName} ${item.student.user.profile.lastName}`
                        : '—';
                      const netVal =
                        item.value * (1 - item.scholarshipPercent / 100) - item.discount;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-semibold text-foreground">{stName}</TableCell>
                          <TableCell className="text-xs">{item.description}</TableCell>
                          <TableCell className="font-mono text-xs">{item.dueDate}</TableCell>
                          <TableCell className="text-xs">R$ {item.value.toFixed(2)}</TableCell>
                          <TableCell className="font-bold text-rose-600">
                            R$ {Math.max(0, netVal).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-primary border-primary/20"
                              onClick={() => {
                                // Simulate click to student's tuition card
                                if (item.student) {
                                  openTuitionsView(item.student);
                                }
                              }}
                            >
                              Baixar Parcela
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 2. Tuition Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'tuition' && (
        <Card className="stripe-card print:hidden">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-foreground mb-4">
              Gestão de Mensalidades por Aluno
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="text-right">Ações Financeiras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((st) => {
                  const name = st.user.profile
                    ? `${st.user.profile.firstName} ${st.user.profile.lastName}`
                    : 'Estudante';
                  return (
                    <TableRow key={st.id} className="group">
                      <TableCell className="font-semibold text-foreground">{name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {st.user.email}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => openInstallmentsModal(st)}
                          >
                            Gerar Carnê Anual
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs text-primary bg-primary/10 hover:bg-primary/20 border-transparent"
                            onClick={() => openTuitionsView(st)}
                          >
                            Ver Financeiro
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── 3. Cash Flow Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'cashflow' && (
        <Card className="stripe-card print:hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-foreground">
                Extrato de Movimentações (Livro Caixa)
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => openTransactionModal('RECEITA')}
                >
                  Nova Receita
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => openTransactionModal('DESPESA')}
                >
                  Nova Despesa
                </Button>
              </div>
            </div>

            {transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-10">
                Nenhum lançamento no livro caixa este mês.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id} className="group">
                      <TableCell className="font-mono text-xs">{t.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={t.type === 'RECEITA' ? 'success' : 'destructive'}
                          className="text-[10px]"
                        >
                          {t.type === 'RECEITA' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {t.category}
                      </TableCell>
                      <TableCell className="text-xs">{t.description}</TableCell>
                      <TableCell className="text-xs font-semibold">
                        {t.paymentMethod || '—'}
                      </TableCell>
                      <TableCell
                        className={`font-bold text-xs ${t.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}
                      >
                        {t.type === 'RECEITA' ? '+' : '-'} R$ {t.value.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteTransaction(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── 4. Reports Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center print:hidden">
            <h2 className="text-sm font-bold text-foreground">
              Relatório e Demonstrativo do Exercício
            </h2>
            <Button leftIcon={<Printer className="h-4 w-4" />} onClick={handlePrintReport}>
              Imprimir Demonstrativo
            </Button>
          </div>

          <div className="hidden print:block border-b-2 border-primary pb-4 mb-4">
            <h1 className="text-xl font-extrabold text-foreground">
              Demonstrativo de Resultado do Exercício (DRE)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Zx-Escola SaaS • Ano Letivo: 2026
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Cash statement card */}
            <Card className="stripe-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-extrabold tracking-wider text-muted-foreground border-b border-border pb-2">
                  DRE CONSOLIDADO
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between font-medium">
                    <span>Faturamento Bruto (Mensalidades Recebidas)</span>
                    <span className="text-emerald-600">
                      + R$ {summary.totalRevenues.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Custos Operacionais (Despesas Pagas)</span>
                    <span className="text-rose-600">- R$ {summary.totalExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-border pt-3 text-foreground text-sm">
                    <span>RESULTADO LÍQUIDO</span>
                    <span className={summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      R$ {summary.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overdue stats details */}
            <Card className="stripe-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-extrabold tracking-wider text-muted-foreground border-b border-border pb-2">
                  ESTATÍSTICAS DE INADIMPLÊNCIA
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Faturas Atrasadas:</span>
                    <span className="font-bold text-foreground">
                      {summary.overdueCount} parcelas
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Inadimplido:</span>
                    <span className="font-bold text-rose-600">
                      R$ {summary.overdueSum.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Faturamento Esperado Total:</span>
                    <span className="font-bold text-primary">
                      R$ {(summary.totalRevenues + summary.overdueSum).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Installments Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={isInstallmentsModalOpen}
        onClose={() => setIsInstallmentsModalOpen(false)}
        title={
          selectedStudentForInstallments
            ? `Gerar Parcelas: ${selectedStudentForInstallments.user.profile?.firstName}`
            : 'Gerar Parcelas'
        }
        size="sm"
      >
        <form onSubmit={handleGenerateInstallments} className="space-y-4">
          <Input
            label="Valor Base da Mensalidade (R$) *"
            value={instValue}
            onChange={(e) => setInstValue(e.target.value)}
            placeholder="500.00"
            required
          />
          <Input
            label="Desconto Fixo Adicional (R$)"
            value={instDiscount}
            onChange={(e) => setInstDiscount(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Percentual de Bolsa (%)"
            type="number"
            value={instScholarship}
            onChange={(e) => setInstScholarship(e.target.value)}
            placeholder="0"
          />
          <Input
            label="Quantidade de Parcelas (Meses)"
            type="number"
            value={instMonths}
            onChange={(e) => setInstMonths(e.target.value)}
            placeholder="12"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInstallmentsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={generatingInstallments}>
              Gerar Parcelas
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Student Tuitions View Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={isTuitionsViewOpen}
        onClose={() => setIsTuitionsViewOpen(false)}
        title={
          selectedStudentForView
            ? `Mensalidades: ${selectedStudentForView.user.profile?.firstName}`
            : 'Mensalidades'
        }
        size="lg"
      >
        <div className="space-y-4">
          {loadingTuitions ? (
            <div className="text-center py-10">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          ) : studentTuitions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-10">
              Nenhuma mensalidade gerada para este aluno.
            </p>
          ) : (
            <div className="max-h-[350px] overflow-y-auto pr-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor Líquido</TableHead>
                    <TableHead>Acréscimos (Multa/Juros)</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentTuitions.map((item) => {
                    const isOverdue =
                      new Date(item.dueDate) < new Date() && item.status === 'PENDENTE';
                    const net = item.value * (1 - item.scholarshipPercent / 100) - item.discount;
                    const surcharge = item.fine + item.interest;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {item.description}
                        </TableCell>
                        <TableCell className="font-mono text-[10px]">{item.dueDate}</TableCell>
                        <TableCell className="text-xs">R$ {Math.max(0, net).toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-rose-600">
                          {surcharge > 0 ? `+ R$ ${surcharge.toFixed(2)}` : '—'}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground">
                          {item.status === 'PAGO' ? `R$ ${item.finalValue.toFixed(2)}` : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === 'PAGO'
                                ? 'success'
                                : isOverdue
                                  ? 'destructive'
                                  : 'outline'
                            }
                            className="text-[10px]"
                          >
                            {item.status === 'PAGO' ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status !== 'PAGO' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] text-primary border-primary/20"
                              onClick={() => openPayConfirmModal(item)}
                            >
                              Baixar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex justify-end pt-3 border-t border-border">
            <Button onClick={() => setIsTuitionsViewOpen(false)}>Fechar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Payment Confirm Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={isPayConfirmOpen}
        onClose={() => setIsPayConfirmOpen(false)}
        title="Confirmar Baixa de Parcela"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Se a data de pagamento selecionada for posterior ao vencimento da parcela, o sistema
            calculará automaticamente a multa de **2%** e os juros de **1% ao mês (0.033%/dia)**
            sobre o valor líquido.
          </p>

          <Select
            label="Método de Recebimento *"
            options={[
              { value: 'PIX', label: 'PIX' },
              { value: 'BOLETO', label: 'Boleto Bancário' },
              { value: 'CARTAO', label: 'Cartão de Crédito/Débito' },
            ]}
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
          />

          <Input
            label="Data do Recebimento *"
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsPayConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} isLoading={processingPayment}>
              Confirmar Recebimento
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Transaction Manual Entry Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title={transType === 'RECEITA' ? 'Lançar Nova Receita' : 'Lançar Nova Despesa'}
        size="sm"
      >
        <form onSubmit={handleSaveTransaction} className="space-y-4">
          <Select
            label="Categoria *"
            options={
              transType === 'RECEITA'
                ? [
                    { value: 'Mensalidade', label: 'Mensalidade Escolar' },
                    { value: 'Material', label: 'Venda de Material' },
                    { value: 'Doação', label: 'Doações/Subsídios' },
                    { value: 'Outros', label: 'Outras Receitas' },
                  ]
                : [
                    { value: 'Luz', label: 'Energia Elétrica (Luz)' },
                    { value: 'Água', label: 'Serviço de Água' },
                    { value: 'Salário', label: 'Salários e Encargos' },
                    { value: 'Aluguel', label: 'Aluguel do Imóvel' },
                    { value: 'Material', label: 'Compra de Material Escolar' },
                    { value: 'Outros', label: 'Outras Despesas' },
                  ]
            }
            value={transCategory}
            onChange={(e) => setTransCategory(e.target.value)}
          />

          <Input
            label="Descrição *"
            value={transDesc}
            onChange={(e) => setTransDesc(e.target.value)}
            placeholder="Ex: Compra de giz e apagadores"
            required
          />

          <Input
            label="Valor em Reais (R$) *"
            value={transVal}
            onChange={(e) => setTransVal(e.target.value)}
            placeholder="250.00"
            required
          />

          <Input
            label="Data de Lançamento *"
            type="date"
            value={transDate}
            onChange={(e) => setTransDate(e.target.value)}
            required
          />

          <Select
            label="Forma de Movimentação"
            options={[
              { value: 'PIX', label: 'PIX' },
              { value: 'BOLETO', label: 'Boleto' },
              { value: 'CARTAO', label: 'Cartão' },
              { value: 'DINHEIRO', label: 'Dinheiro Físico' },
            ]}
            value={transMethod}
            onChange={(e) => setTransMethod(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransactionModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={savingTransaction}>
              Confirmar Lançamento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default FinancialPage;
