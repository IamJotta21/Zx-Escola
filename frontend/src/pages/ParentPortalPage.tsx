import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  FileSpreadsheet,
  DollarSign,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
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

interface Child {
  id: string;
  userId: string;
  name: string;
  className: string | null;
  classId: string | null;
  status: string;
  avatarUrl: string | null;
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
  filePath: string | null;
  fileName: string | null;
  createdAt: string;
}

export const ParentPortalPage: React.FC = () => {
  const { addToast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'grades' | 'finance' | 'attendance' | 'messages' | 'schedule' | 'documents'
  >('grades');

  // Specific Child Data
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
  const [schedule, setSchedule] = useState<{
    contents: ClassContentItem[];
    activities: ActivityItem[];
  }>({ contents: [], activities: [] });
  const [documents, setDocuments] = useState<SchoolDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChildren = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/portal/guardian/children');
      const data = res.data.data;
      setChildren(data);
      if (data.length > 0) {
        setSelectedChildId(data[0].id);
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao carregar lista de filhos vinculados.' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const fetchChildData = useCallback(
    async (childId: string) => {
      if (!childId) return;
      try {
        setIsLoading(true);
        // Fetch data in parallel depending on the active tab or fetch all relevant
        const [gradesRes, financeRes, attendanceRes, messagesRes, scheduleRes, documentsRes] =
          await Promise.all([
            api.get('/portal/guardian/grades', { params: { studentId: childId } }),
            api.get('/portal/guardian/finance', { params: { studentId: childId } }),
            api.get('/portal/guardian/attendance', { params: { studentId: childId } }),
            api.get('/portal/guardian/messages'),
            api.get('/portal/guardian/schedule', { params: { studentId: childId } }),
            api.get('/portal/guardian/documents', { params: { studentId: childId } }),
          ]);

        setGrades(gradesRes.data.data);
        setFinance(financeRes.data.data);
        setAttendance(attendanceRes.data.data);
        setMessages(messagesRes.data.data);
        setSchedule(scheduleRes.data.data);
        setDocuments(documentsRes.data.data);
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

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      // Update local state
      setMessages((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
      }));
    } catch {
      // Ignored
    }
  };

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

  const getFinanceBadge = (status: string) => {
    switch (status) {
      case 'PAGO':
        return <Badge variant="success">Pago</Badge>;
      case 'ATRASADO':
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="warning">Pendente</Badge>;
    }
  };

  const activeChild = children.find((c) => c.id === selectedChildId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Child Selection */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">
            Portal da Família
          </span>
          <h1 className="text-2xl font-black">Acompanhamento Escolar</h1>
          <p className="text-sm text-slate-300">
            Monitore notas, financeiro, presença e comunicados dos seus filhos.
          </p>
        </div>

        {children.length > 1 && (
          <div className="relative z-10 w-full md:w-64">
            <label className="block text-xs text-slate-300 font-bold mb-1">
              Selecione o Filho:
            </label>
            <Select
              options={children.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.className || 'Sem Turma'})`,
              }))}
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="bg-slate-800 text-white border-slate-700"
            />
          </div>
        )}
      </div>

      {activeChild && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left panel: Quick student profile info */}
          <div className="md:col-span-1 space-y-6">
            <Card className="stripe-card">
              <CardContent className="p-6 text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-3xl border-4 border-primary/20 overflow-hidden">
                    {activeChild.avatarUrl ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${activeChild.avatarUrl}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      activeChild.name.charAt(0)
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-4 border-background" />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground">{activeChild.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeChild.className || 'Sem Turma Definida'}
                  </p>
                </div>
                <div className="pt-4 border-t border-border flex justify-around text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Frequência</div>
                    <div className="text-lg font-black text-foreground">
                      {attendance?.summary ? `${attendance.summary.percentage}%` : '—'}
                    </div>
                  </div>
                  <div className="w-px bg-border my-1" />
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <Badge
                      variant={
                        activeChild.status === 'MATRICULADO' ||
                        activeChild.status === 'REMATRICULADO'
                          ? 'success'
                          : 'outline'
                      }
                    >
                      {activeChild.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Tabs and content */}
          <div className="md:col-span-3 space-y-6">
            <div className="flex border-b border-border overflow-x-auto pb-px">
              {[
                { key: 'grades', label: 'Notas', icon: <FileSpreadsheet className="h-4 w-4" /> },
                { key: 'finance', label: 'Financeiro', icon: <DollarSign className="h-4 w-4" /> },
                { key: 'attendance', label: 'Frequência', icon: <Users className="h-4 w-4" /> },
                {
                  key: 'messages',
                  label: 'Avisos & Mensagens',
                  icon: <MessageSquare className="h-4 w-4" />,
                },
                {
                  key: 'schedule',
                  label: 'Agenda & Atividades',
                  icon: <Calendar className="h-4 w-4" />,
                },
                { key: 'documents', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() =>
                    setActiveTab(
                      tab.key as
                        'grades' | 'finance' | 'attendance' | 'messages' | 'schedule' | 'documents'
                    )
                  }
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

            {/* TAB CONTENT: GRADES */}
            {activeTab === 'grades' && (
              <Card className="stripe-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Boletim Escolar
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="h-4 w-4" />}
                    onClick={() => window.print()}
                  >
                    Imprimir Boletim
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
                          <TableCell
                            colSpan={9}
                            className="text-center py-8 text-muted-foreground text-xs"
                          >
                            Nenhuma nota lançada para este aluno.
                          </TableCell>
                        </TableRow>
                      ) : (
                        grades.map((g) => (
                          <TableRow key={g.id}>
                            <TableCell className="font-semibold text-foreground">
                              {g.subject}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {g.bimester1 ?? '—'}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {g.bimester2 ?? '—'}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {g.bimester3 ?? '—'}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {g.bimester4 ?? '—'}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs text-rose-500">
                              {g.remedialGrade ?? '—'}
                            </TableCell>
                            <TableCell className="text-center font-black text-foreground font-mono text-xs">
                              {g.finalAverage ?? '—'}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {g.absences}
                            </TableCell>
                            <TableCell className="text-right">{getStatusBadge(g.status)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: FINANCE */}
            {activeTab === 'finance' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Situação Financeira / Parcelas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor Original</TableHead>
                        <TableHead className="text-right">Valor Final</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Data Pagto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {finance.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground text-xs"
                          >
                            Nenhum registro de mensalidade encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        finance.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell className="font-semibold text-foreground">
                              {f.description}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{f.dueDate}</TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              R$ {f.value.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-black text-foreground font-mono text-xs">
                              R$ {f.finalValue.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              {getFinanceBadge(f.status)}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {f.paymentDate || '—'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: ATTENDANCE */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                {attendance?.summary && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-slate-500/5">
                      <div className="text-xs text-muted-foreground font-semibold">PRESENÇAS</div>
                      <div className="text-2xl font-black text-emerald-600 mt-1">
                        {attendance.summary.present}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-slate-500/5">
                      <div className="text-xs text-muted-foreground font-semibold">FALTAS</div>
                      <div className="text-2xl font-black text-rose-600 mt-1">
                        {attendance.summary.absent}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-slate-500/5">
                      <div className="text-xs text-muted-foreground font-semibold">
                        FREQUÊNCIA FINAL
                      </div>
                      <div className="text-2xl font-black text-primary mt-1">
                        {attendance.summary.percentage}%
                      </div>
                    </div>
                  </div>
                )}

                <Card className="stripe-card">
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data da Aula</TableHead>
                          <TableHead className="text-right">Presença</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!attendance || attendance.records.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              className="text-center py-8 text-muted-foreground text-xs"
                            >
                              Nenhum registro de frequência encontrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          attendance.records.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-semibold text-foreground font-mono text-xs">
                                {r.date}
                              </TableCell>
                              <TableCell className="text-right">
                                {r.status === 'PRESENTE' ? (
                                  <Badge
                                    variant="success"
                                    className="flex items-center gap-1 ml-auto w-fit"
                                  >
                                    <CheckCircle2 className="h-3 w-3" /> Presente
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="destructive"
                                    className="flex items-center gap-1 ml-auto w-fit"
                                  >
                                    <XCircle className="h-3 w-3" /> Falta
                                  </Badge>
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

            {/* TAB CONTENT: MESSAGES */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Comunicados Gerais da Escola
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {messages.announcements.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground text-xs">
                        Nenhum aviso ou comunicado geral no momento.
                      </p>
                    ) : (
                      messages.announcements.map((a) => (
                        <div
                          key={a.id}
                          className="p-4 rounded-xl border border-border/80 bg-background/50 hover:bg-slate-500/5 transition-colors space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-foreground text-sm">{a.title}</h4>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {a.content}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Notificações Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {messages.notifications.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground text-xs">
                        Nenhuma notificação direcionada.
                      </p>
                    ) : (
                      messages.notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-4 rounded-xl border transition-colors flex items-start gap-3 justify-between ${
                            n.isRead
                              ? 'border-border bg-background/20'
                              : 'border-primary/20 bg-primary/5'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-foreground text-xs">{n.title}</h4>
                              {!n.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{n.content}</p>
                          </div>
                          {!n.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(n.id)}
                            >
                              Lido
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: SCHEDULE */}
            {activeTab === 'schedule' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Conteúdos Ministrados (Diário de Classe)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {schedule.contents.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground text-xs">
                        Nenhum conteúdo lançado nesta turma.
                      </p>
                    ) : (
                      schedule.contents.map((c) => (
                        <div key={c.id} className="p-3 border border-border rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-primary font-bold">
                              {c.date}
                            </span>
                          </div>
                          <h4 className="font-bold text-foreground text-xs">{c.title}</h4>
                          {c.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {c.description}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Atividades / Provas e Trabalhos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {schedule.activities.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground text-xs">
                        Nenhuma atividade agendada nesta turma.
                      </p>
                    ) : (
                      schedule.activities.map((a) => (
                        <div
                          key={a.id}
                          className="p-3 border border-border rounded-xl flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-foreground text-xs">{a.title}</h4>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              Data Entrega: {a.date}
                            </div>
                          </div>
                          <Badge variant="outline">Valendo {a.maxGrade}</Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: DOCUMENTS */}
            {activeTab === 'documents' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Documentos e Declarações Emitidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título do Documento</TableHead>
                        <TableHead>Data Emissão</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center py-8 text-muted-foreground text-xs"
                          >
                            Nenhum documento oficial emitido para download no momento.
                          </TableCell>
                        </TableRow>
                      ) : (
                        documents.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-semibold text-foreground">
                              {d.title}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right">
                              {d.filePath ? (
                                <a
                                  href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${d.filePath}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                                >
                                  <Download className="h-3.5 w-3.5" /> Baixar PDF
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Apenas visualização em secretaria
                                </span>
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
          </div>
        </div>
      )}

      {/* Spinner fallback if child data is not loaded yet */}
      {!activeChild && !isLoading && (
        <Card className="p-8 text-center text-muted-foreground text-xs">
          Nenhum filho cadastrado ou associado a esta conta. Favor entrar em contato com a
          secretaria.
        </Card>
      )}
    </div>
  );
};

export default ParentPortalPage;
