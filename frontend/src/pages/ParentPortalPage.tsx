import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  LayoutDashboard,
  FileSpreadsheet,
  DollarSign,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  Copy,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  QrCode,
  Award,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import { DocumentViewerModal, DocumentData } from '../components/portal/DocumentViewerModal';

interface Child {
  id: string;
  userId: string;
  name: string;
  className: string | null;
  classId: string | null;
  status: string;
  avatarUrl: string | null;
  cpf?: string | null;
  birthDate?: string | null;
}

interface ReportCard {
  id: string;
  subject: string;
  bimester1: number | null;
  bimester2: number | null;
  bimester3: number | null;
  bimester4: number | null;
  remedialGrade: number | null;
  finalAverage: number | null;
  status: string;
  absences: number;
}

interface Tuition {
  id: string;
  description: string;
  dueDate: string;
  value: number;
  discount: number;
  fine: number;
  interest: number;
  finalValue: number;
  status: string;
  paymentMethod: string | null;
  paymentDate: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ClassContentItem {
  id: string;
  date: string;
  title: string;
  description: string | null;
}

interface ActivityItem {
  id: string;
  title: string;
  date: string;
  maxGrade: number;
}

interface SchoolDocumentItem {
  id: string;
  type: string;
  title: string;
  content?: string;
  filePath: string | null;
  fileName: string | null;
  createdAt: string;
}

export const ParentPortalPage: React.FC = () => {
  const { addToast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'studentData' | 'grades' | 'attendance' | 'finance' | 'messages' | 'documents'
  >('dashboard');

  // Specific Child Data
  const [childDetails, setChildDetails] = useState<any>(null);
  const [grades, setGrades] = useState<ReportCard[]>([]);
  const [finance, setFinance] = useState<Tuition[]>([]);
  const [attendance, setAttendance] = useState<{
    records: AttendanceRecord[];
    summary: AttendanceSummary;
  } | null>(null);
  const [messages, setMessages] = useState<{
    notifications: NotificationItem[];
    announcements: AnnouncementItem[];
  }>({ notifications: [], announcements: [] });
  const [documents, setDocuments] = useState<SchoolDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Document Viewer Modal state
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [selectedDocData, setSelectedDocData] = useState<DocumentData | null>(null);

  const fetchChildren = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/portal/guardian/children');
      const data: Child[] = res.data.data || [];
      setChildren(data);
      if (data.length > 0) {
        setSelectedChildId(data[0].id);
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao carregar lista de alunos vinculados.' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const fetchChildData = useCallback(
    async (childId: string) => {
      if (!childId) return;
      try {
        setIsLoading(true);
        const [gradesRes, financeRes, attendanceRes, messagesRes, documentsRes] =
          await Promise.all([
            api.get('/portal/guardian/grades', { params: { studentId: childId } }),
            api.get('/portal/guardian/finance', { params: { studentId: childId } }),
            api.get('/portal/guardian/attendance', { params: { studentId: childId } }),
            api.get('/portal/guardian/messages'),
            api.get('/portal/guardian/documents', { params: { studentId: childId } }),
          ]);

        setGrades(gradesRes.data.data || []);
        setFinance(financeRes.data.data || []);
        setAttendance(attendanceRes.data.data || null);
        setMessages(messagesRes.data.data || { notifications: [], announcements: [] });
        setDocuments(documentsRes.data.data || []);
      } catch (err) {
        addToast({ type: 'error', message: 'Erro ao buscar informações do aluno.' });
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (selectedChildId) {
      fetchChildData(selectedChildId);
    }
  }, [selectedChildId, fetchChildData]);

  const activeChild = children.find((c) => c.id === selectedChildId) || children[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADO':
        return <Badge variant="success">Aprovado</Badge>;
      case 'REPROVADO':
        return <Badge variant="destructive">Reprovado</Badge>;
      case 'EM_RECUPERACAO':
        return <Badge variant="warning">Em Recuperação</Badge>;
      default:
        return <Badge variant="outline">Cursando</Badge>;
    }
  };

  const getTuitionBadge = (status: string) => {
    switch (status) {
      case 'PAGO':
        return <Badge variant="success">Pago</Badge>;
      case 'ATRASADO':
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="warning">Pendente</Badge>;
    }
  };

  const handleCopyPixKey = (tuition: Tuition) => {
    const fakePixKey = `00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${tuition.finalValue.toFixed(2)}5802BR5916ZX-ESCOLA ENSI6009SAO PAULO62070503***6304`;
    navigator.clipboard.writeText(fakePixKey);
    addToast({ type: 'success', message: 'Chave PIX copiada para a área de transferência!' });
  };

  const handleOpenDocViewer = (
    type: 'BOLETIM' | 'DECLARACAO' | 'HISTORICO' | 'COMPROVANTE' | 'CUSTOM',
    tuition?: Tuition,
    customDoc?: SchoolDocumentItem
  ) => {
    if (!activeChild) return;

    let docTitle = 'Documento Escolar';
    if (type === 'BOLETIM') docTitle = `Boletim Escolar - ${activeChild.name}`;
    if (type === 'DECLARACAO') docTitle = `Declaração de Matrícula - ${activeChild.name}`;
    if (type === 'HISTORICO') docTitle = `Histórico Escolar - ${activeChild.name}`;
    if (type === 'COMPROVANTE') docTitle = `Comprovante de Quitação / Matrícula - ${activeChild.name}`;
    if (customDoc) docTitle = customDoc.title;

    setSelectedDocData({
      title: docTitle,
      type: type === 'CUSTOM' ? 'CUSTOM' : type,
      studentName: activeChild.name,
      studentId: activeChild.id,
      className: activeChild.className,
      cpf: activeChild.cpf,
      birthDate: activeChild.birthDate,
      reportCards: grades,
      attendancePercentage: attendance?.summary?.percentage ?? 100,
      tuitionInfo: tuition
        ? {
            description: tuition.description,
            value: tuition.finalValue,
            paymentDate: tuition.paymentDate,
            paymentMethod: tuition.paymentMethod,
            status: tuition.status,
          }
        : undefined,
      customContent: customDoc?.content || undefined,
      fileName: customDoc?.fileName || undefined,
      filePath: customDoc?.filePath || undefined,
    });
    setViewerModalOpen(true);
  };

  // Financial pending total
  const pendingTuitions = finance.filter((t) => t.status !== 'PAGO');
  const pendingTotal = pendingTuitions.reduce((acc, curr) => acc + curr.finalValue, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Multi-Student Switcher Header */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/20 px-2.5 py-1 rounded-md border border-primary/30">
                Portal dos Responsáveis
              </span>
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                {children.length} Aluno(s) Vinculado(s)
              </Badge>
            </div>
            <h1 className="text-2xl font-black">Acompanhamento Acadêmico dos Filhos</h1>
            <p className="text-sm text-slate-300">
              Gerencie dados, boletim, frequências, financeiro e documentos.
            </p>
          </div>

          {/* MULTI-STUDENT SWITCHER */}
          {children.length > 1 && (
            <div className="flex items-center gap-3 bg-slate-800/90 p-3 rounded-xl border border-slate-700">
              <Users className="h-5 w-5 text-primary" />
              <div className="space-y-0.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Alternar Aluno
                </label>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="bg-slate-900 text-white font-bold text-xs rounded-lg px-3 py-1.5 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name} ({child.className || 'Sem Turma'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Selected Child Info Strip */}
        {activeChild && (
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-extrabold flex items-center justify-center border border-primary/30">
                {activeChild.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-extrabold text-white">{activeChild.name}</div>
                <div className="text-xs text-slate-400">
                  Turma: <span className="font-bold text-slate-200">{activeChild.className || 'Não enturmado'}</span> • Matrícula #{activeChild.id.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={activeChild.status === 'MATRICULADO' ? 'success' : 'outline'}>
                {activeChild.status}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {activeChild && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left panel: Quick Student Card & Documents */}
          <div className="md:col-span-1 space-y-6">
            {/* Student Card */}
            <Card className="stripe-card">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-black text-2xl mx-auto flex items-center justify-center border-2 border-primary/20">
                  {activeChild.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground">{activeChild.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Turma {activeChild.className || 'N/A'}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex justify-around text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Frequência</div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {attendance?.summary?.percentage ?? 100}%
                    </div>
                  </div>
                  <div className="w-px bg-border my-1" />
                  <div>
                    <div className="text-xs text-muted-foreground">Pendências</div>
                    <div className="text-lg font-black text-rose-500">
                      {pendingTuitions.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Documentos & Ações
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs font-semibold"
                  leftIcon={<Printer className="h-4 w-4 text-primary" />}
                  onClick={() => handleOpenDocViewer('BOLETIM')}
                >
                  Imprimir Boletim
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs font-semibold"
                  leftIcon={<FileText className="h-4 w-4 text-primary" />}
                  onClick={() => handleOpenDocViewer('DECLARACAO')}
                >
                  Declaração de Matrícula
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs font-semibold"
                  leftIcon={<Award className="h-4 w-4 text-primary" />}
                  onClick={() => handleOpenDocViewer('HISTORICO')}
                >
                  Histórico Escolar
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Tabbed Sections */}
          <div className="md:col-span-3 space-y-6">
            {/* Tab Navigation Bar */}
            <div className="flex border-b border-border overflow-x-auto pb-px gap-1">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
                { key: 'studentData', label: 'Dados do Aluno', icon: <User className="h-4 w-4" /> },
                { key: 'grades', label: 'Boletim', icon: <FileSpreadsheet className="h-4 w-4" /> },
                { key: 'attendance', label: 'Frequência', icon: <CheckCircle2 className="h-4 w-4" /> },
                { key: 'finance', label: 'Financeiro', icon: <DollarSign className="h-4 w-4" /> },
                { key: 'messages', label: 'Comunicados', icon: <MessageSquare className="h-4 w-4" /> },
                { key: 'documents', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
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

            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="stripe-card bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold">Disciplinas Cursadas</div>
                        <div className="text-2xl font-black text-foreground mt-1">
                          {grades.length}
                        </div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="stripe-card bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold">Frequência Geral</div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                          {attendance?.summary?.percentage ?? 100}%
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="stripe-card bg-gradient-to-br from-rose-500/5 to-transparent">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold">Mensalidades a Pagar</div>
                        <div className="text-2xl font-black text-rose-500 mt-1">
                          R$ {pendingTotal.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500">
                        <DollarSign className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Dashboard Widgets */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Latest Grades Widget */}
                  <Card className="stripe-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-bold text-foreground">
                        Resumo do Boletim
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('grades')}>
                        Ver completo
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      {grades.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          Nenhuma nota cadastrada até o momento.
                        </p>
                      ) : (
                        grades.slice(0, 4).map((g) => (
                          <div key={g.id} className="p-2.5 rounded-lg border border-border/70 flex items-center justify-between bg-muted/20">
                            <span className="font-bold text-xs text-foreground">{g.subject}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold">Média: {g.finalAverage ?? '—'}</span>
                              {getStatusBadge(g.status)}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Finance Overview Widget */}
                  <Card className="stripe-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-bold text-foreground">
                        Próximas Mensalidades
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('finance')}>
                        Ver financeiro
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      {finance.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          Nenhuma mensalidade lançada.
                        </p>
                      ) : (
                        finance.slice(0, 3).map((t) => (
                          <div key={t.id} className="p-2.5 rounded-lg border border-border/70 flex items-center justify-between bg-muted/20">
                            <div>
                              <div className="font-bold text-xs text-foreground">{t.description}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">Venc: {t.dueDate}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs">R$ {t.finalValue.toFixed(2)}</span>
                              {getTuitionBadge(t.status)}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB 2: DADOS DO ALUNO */}
            {activeTab === 'studentData' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Ficha de Dados do Aluno
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-semibold">Nome Completo</div>
                      <div className="text-sm font-extrabold text-foreground">{activeChild.name}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-semibold">Número de Matrícula</div>
                      <div className="text-sm font-mono font-bold text-foreground">
                        #{activeChild.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-semibold">Turma Atual</div>
                      <div className="text-sm font-bold text-foreground">{activeChild.className || 'Não enturmado'}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-semibold">Status de Matrícula</div>
                      <div>
                        <Badge variant={activeChild.status === 'MATRICULADO' ? 'success' : 'outline'}>
                          {activeChild.status}
                        </Badge>
                      </div>
                    </div>

                    {activeChild.cpf && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-semibold">CPF do Aluno</div>
                        <div className="text-sm font-mono font-bold text-foreground">{activeChild.cpf}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 3: BOLETIM */}
            {activeTab === 'grades' && (
              <Card className="stripe-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Boletim Escolar do Aluno
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="h-4 w-4" />}
                    onClick={() => handleOpenDocViewer('BOLETIM')}
                  >
                    Visualizar & Imprimir PDF
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Disciplina</TableHead>
                        <TableHead className="text-center">Bim 1</TableHead>
                        <TableHead className="text-center">Bim 2</TableHead>
                        <TableHead className="text-center">Bim 3</TableHead>
                        <TableHead className="text-center">Bim 4</TableHead>
                        <TableHead className="text-center">Rec</TableHead>
                        <TableHead className="text-center">Média</TableHead>
                        <TableHead className="text-center">Faltas</TableHead>
                        <TableHead className="text-right">Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-xs">
                            Nenhuma nota lançada para este aluno.
                          </TableCell>
                        </TableRow>
                      ) : (
                        grades.map((g) => (
                          <TableRow key={g.id}>
                            <TableCell className="font-semibold text-foreground">{g.subject}</TableCell>
                            <TableCell className="text-center font-mono text-xs">{g.bimester1 ?? '—'}</TableCell>
                            <TableCell className="text-center font-mono text-xs">{g.bimester2 ?? '—'}</TableCell>
                            <TableCell className="text-center font-mono text-xs">{g.bimester3 ?? '—'}</TableCell>
                            <TableCell className="text-center font-mono text-xs">{g.bimester4 ?? '—'}</TableCell>
                            <TableCell className="text-center font-mono text-xs text-rose-500">{g.remedialGrade ?? '—'}</TableCell>
                            <TableCell className="text-center font-black font-mono text-xs">{g.finalAverage ?? '—'}</TableCell>
                            <TableCell className="text-center font-mono text-xs">{g.absences}</TableCell>
                            <TableCell className="text-right">{getStatusBadge(g.status)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* TAB 4: FREQUÊNCIA */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card className="stripe-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-xs text-muted-foreground">Total de Aulas</div>
                      <div className="text-2xl font-black text-foreground mt-1">{attendance?.summary?.total ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card className="stripe-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-xs text-muted-foreground">Presenças</div>
                      <div className="text-2xl font-black text-emerald-600 mt-1">{attendance?.summary?.present ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card className="stripe-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-xs text-muted-foreground">Faltas</div>
                      <div className="text-2xl font-black text-rose-500 mt-1">{attendance?.summary?.absent ?? 0}</div>
                    </CardContent>
                  </Card>
                  <Card className="stripe-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-xs text-muted-foreground">Percentual</div>
                      <div className="text-2xl font-black text-primary mt-1">{attendance?.summary?.percentage ?? 100}%</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Histórico de Frequência Diária
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!attendance?.records || attendance.records.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground text-xs">
                              Nenhum registro de frequência encontrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          attendance.records.map((rec) => (
                            <TableRow key={rec.id}>
                              <TableCell className="font-mono text-xs font-semibold">{rec.date}</TableCell>
                              <TableCell className="text-right">
                                {rec.status === 'PRESENTE' ? (
                                  <Badge variant="success">Presente</Badge>
                                ) : rec.status === 'JUSTIFICADA' ? (
                                  <Badge variant="warning">Falta Justificada</Badge>
                                ) : (
                                  <Badge variant="destructive">Falta</Badge>
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

            {/* TAB 5: FINANCEIRO */}
            {activeTab === 'finance' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Gestão Financeira e Mensalidades
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-center">Valor Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {finance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                            Nenhuma mensalidade ou cobrança cadastrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        finance.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-semibold text-foreground">{t.description}</TableCell>
                            <TableCell className="font-mono text-xs">{t.dueDate}</TableCell>
                            <TableCell className="text-center font-mono font-bold text-xs">
                              R$ {t.finalValue.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">{getTuitionBadge(t.status)}</TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-2">
                              {t.status !== 'PAGO' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<Copy className="h-3.5 w-3.5" />}
                                  onClick={() => handleCopyPixKey(t)}
                                >
                                  Copiar PIX
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<Printer className="h-3.5 w-3.5" />}
                                  onClick={() => handleOpenDocViewer('COMPROVANTE', t)}
                                >
                                  Comprovante
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
            )}

            {/* TAB 6: COMUNICADOS */}
            {activeTab === 'messages' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Comunicados da Escola
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {messages.announcements.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-xs">
                      Nenhum comunicado disponível no momento.
                    </p>
                  ) : (
                    messages.announcements.map((ann) => (
                      <div key={ann.id} className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" /> {ann.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(ann.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {ann.content}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* TAB 7: DOCUMENTOS */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Emissão de Documentos e Certificados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-slate-500/5 hover:border-primary transition-all space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                          <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-xs">Boletim Escolar Oficial</h4>
                          <p className="text-[10px] text-muted-foreground">Relatório de notas do aluno</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold"
                        onClick={() => handleOpenDocViewer('BOLETIM')}
                      >
                        Visualizar / Imprimir
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-slate-500/5 hover:border-primary transition-all space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-xs">Declaração de Matrícula</h4>
                          <p className="text-[10px] text-muted-foreground">Comprovante oficial de escolaridade</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold"
                        onClick={() => handleOpenDocViewer('DECLARACAO')}
                      >
                        Visualizar / Imprimir
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-slate-500/5 hover:border-primary transition-all space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-xs">Histórico Escolar</h4>
                          <p className="text-[10px] text-muted-foreground">Registro de notas e aprovações</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold"
                        onClick={() => handleOpenDocViewer('HISTORICO')}
                      >
                        Visualizar / Imprimir
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-slate-500/5 hover:border-primary transition-all space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-xs">Comprovante Financeiro</h4>
                          <p className="text-[10px] text-muted-foreground">Declaração de quitação e pagamentos</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold"
                        onClick={() => handleOpenDocViewer('COMPROVANTE')}
                      >
                        Visualizar / Imprimir
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Attached School Documents */}
                {documents.length > 0 && (
                  <Card className="stripe-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-foreground">
                        Documentos Emitidos pela Secretaria
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Emissão</TableHead>
                            <TableHead className="text-right">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-semibold text-foreground">{doc.title}</TableCell>
                              <TableCell className="text-xs">{doc.type}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDocViewer('CUSTOM', undefined, doc)}
                                >
                                  Visualizar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="py-20 text-center text-xs text-muted-foreground">
          Carregando dados do aluno...
        </div>
      )}

      {/* Universal Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={viewerModalOpen}
        onClose={() => setViewerModalOpen(false)}
        document={selectedDocData}
      />
    </div>
  );
};

export default ParentPortalPage;
