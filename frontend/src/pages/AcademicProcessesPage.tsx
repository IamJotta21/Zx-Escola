import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  ArrowRightLeft,
  XOctagon,
  Search,
  BookOpen,
  Calendar,
  Building,
  AlertTriangle,
  GraduationCap,
  History,
  FileText,
  User,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { SkeletonTable } from '../components/ui/Skeleton';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

interface StudentShort {
  id: string;
  status: string;
  user: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    } | null;
  };
}

interface EnrollmentHistoryItem {
  id: string;
  status: string;
  schoolYear: string;
  destinationSchool: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  student: {
    user: {
      profile: {
        firstName: string;
        lastName: string;
      } | null;
    };
  };
}

interface EnrollmentMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  LISTA_DE_ESPERA: {
    label: 'Lista de Espera',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  MATRICULADO: {
    label: 'Matriculado',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  REMATRICULADO: {
    label: 'Rematriculado',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  TRANSFERIDO: {
    label: 'Transferido',
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  CANCELADO: { label: 'Cancelado', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
};

export const AcademicProcessesPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    'espera' | 'rematricula' | 'transfer' | 'cancel' | 'log'
  >('espera');

  // Students list filtered by context state
  const [students, setStudents] = useState<StudentShort[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState('');

  // Log history state
  const [logs, setLogs] = useState<EnrollmentHistoryItem[]>([]);
  const [meta, setMeta] = useState<EnrollmentMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPage, setLogPage] = useState(1);

  // Process Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentShort | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [schoolYear, setSchoolYear] = useState('2026');
  const [destinationSchool, setDestinationSchool] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [executing, setExecuting] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  // ── Fetch Students based on Active Tab ──────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      let statusQuery = '';
      if (activeTab === 'espera') {
        statusQuery = 'LISTA_DE_ESPERA';
      } else if (activeTab === 'rematricula') {
        statusQuery = 'MATRICULADO';
      } else if (activeTab === 'transfer' || activeTab === 'cancel') {
        // Can search/select any active/registered student
        statusQuery = '';
      }

      const params: Record<string, string> = { limit: '100' };
      if (statusQuery) params.isActive = statusQuery === 'LISTA_DE_ESPERA' ? 'true' : 'true'; // status field holds enum on backend now
      if (search) params.search = search;

      const res = await api.get('/students', { params });

      // Filter manually on frontend if API list doesn't fully support multiple status filters or raw enums
      let filtered = res.data.data.students as StudentShort[];
      if (activeTab === 'espera') {
        filtered = filtered.filter((s) => s.status === 'LISTA_DE_ESPERA');
      } else if (activeTab === 'rematricula') {
        filtered = filtered.filter((s) => s.status === 'MATRICULADO');
      } else if (activeTab === 'transfer') {
        filtered = filtered.filter((s) => ['MATRICULADO', 'REMATRICULADO'].includes(s.status));
      } else if (activeTab === 'cancel') {
        filtered = filtered.filter((s) =>
          ['LISTA_DE_ESPERA', 'MATRICULADO', 'REMATRICULADO'].includes(s.status)
        );
      }

      setStudents(filtered);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar estudantes para processo.' });
    } finally {
      setLoadingStudents(false);
    }
  }, [activeTab, search, addToast]);

  // ── Fetch Global Logs ───────────────────────────────────────────────────────
  const fetchLogs = useCallback(
    async (page = logPage) => {
      setLoadingLogs(true);
      try {
        const res = await api.get('/enrollments', { params: { page: String(page), limit: '10' } });
        setLogs(res.data.data.enrollments);
        setMeta(res.data.data.meta);
      } catch {
        addToast({ type: 'error', message: 'Erro ao carregar histórico de matrículas.' });
      } finally {
        setLoadingLogs(false);
      }
    },
    [logPage, addToast]
  );

  // Sync fetches on tab changes
  useEffect(() => {
    setSearch('');
    if (activeTab === 'log') {
      fetchLogs(1);
      setLogPage(1);
    } else {
      fetchStudents();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab !== 'log') {
      fetchStudents();
    }
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'log') {
      fetchLogs(logPage);
    }
  }, [logPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open Process Dialog ─────────────────────────────────────────────────────
  const handleOpenProcess = (st: StudentShort, status: string) => {
    setSelectedStudent(st);
    setTargetStatus(status);
    setSchoolYear('2026');
    setDestinationSchool('');
    setReason('');
    setNotes('');
    setIsModalOpen(true);
  };

  // ── Submit Process ──────────────────────────────────────────────────────────
  const handleSubmitProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setExecuting(true);
    try {
      await api.post('/enrollments/process', {
        studentId: selectedStudent.id,
        status: targetStatus,
        schoolYear,
        destinationSchool: targetStatus === 'TRANSFERIDO' ? destinationSchool : undefined,
        reason: ['TRANSFERIDO', 'CANCELADO'].includes(targetStatus) ? reason : undefined,
        notes: notes || undefined,
      });

      addToast({
        type: 'success',
        title: 'Processo Executado',
        message: 'A situação acadêmica do aluno foi alterada com sucesso.',
      });
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Falha ao processar operação.';
      addToast({ type: 'error', title: 'Erro de transação', message: msg });
    } finally {
      setExecuting(false);
    }
  };

  const getProcessTitle = () => {
    if (targetStatus === 'MATRICULADO') return 'Efetivar Matrícula';
    if (targetStatus === 'REMATRICULADO') return 'Realizar Rematrícula';
    if (targetStatus === 'TRANSFERIDO') return 'Registrar Transferência';
    if (targetStatus === 'CANCELADO') return 'Registrar Cancelamento';
    return 'Processo Acadêmico';
  };

  const getModalDescription = () => {
    if (!selectedStudent) return '';
    const name =
      `${selectedStudent.user.profile?.firstName || ''} ${selectedStudent.user.profile?.lastName || ''}`.trim();
    if (targetStatus === 'MATRICULADO')
      return `Confirmar a efetivação da matrícula do(a) aluno(a) ${name} no ano letivo.`;
    if (targetStatus === 'REMATRICULADO')
      return `Confirmar a rematrícula do(a) aluno(a) ${name} para o próximo período.`;
    if (targetStatus === 'TRANSFERIDO')
      return `Registrar transferência externa do(a) aluno(a) ${name} para outra escola.`;
    if (targetStatus === 'CANCELADO')
      return `Efetuar o cancelamento formal da matrícula do(a) aluno(a) ${name}.`;
    return '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-sans tracking-tight text-foreground">
          Processos e Matrículas
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerenciamento do ciclo de vida acadêmica dos estudantes do portal.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border mb-4 flex-wrap">
        {(
          [
            { key: 'espera', label: 'Lista de Espera', icon: BookOpen },
            { key: 'rematricula', label: 'Rematrículas', icon: RefreshCw },
            { key: 'transfer', label: 'Transferências', icon: ArrowRightLeft },
            { key: 'cancel', label: 'Cancelamentos', icon: XOctagon },
            { key: 'log', label: 'Histórico de Processos', icon: History },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab description card */}
      {activeTab !== 'log' && (
        <Card className="stripe-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {activeTab === 'espera' && (
                  <p>
                    Alunos pré-cadastrados na <strong>Lista de Espera</strong> aguardando liberação
                    de vagas para efetivação de Matrícula.
                  </p>
                )}
                {activeTab === 'rematricula' && (
                  <p>
                    Alunos matriculados que estão aptos para a renovação de matrícula (
                    <strong>Rematrícula</strong>) para o próximo ano letivo.
                  </p>
                )}
                {activeTab === 'transfer' && (
                  <p>
                    Solicitar e registrar a <strong>Transferência Escolar</strong> de alunos
                    matriculados para outras redes de ensino.
                  </p>
                )}
                {activeTab === 'cancel' && (
                  <p>
                    Efetuar o desligamento definitivo (<strong>Cancelamento</strong>) de matrículas
                    ativas ou reservas de vagas no sistema.
                  </p>
                )}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filtrar aluno..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content table card */}
      {activeTab !== 'log' ? (
        <Card className="stripe-card">
          <CardContent className="p-0">
            {loadingStudents ? (
              <div className="p-6">
                <SkeletonTable rows={5} cols={4} />
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <GraduationCap className="h-10 w-10 opacity-30 mb-2" />
                <p className="text-sm font-semibold">Nenhum aluno nesta fila no momento.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Situação Atual</TableHead>
                    <TableHead className="text-right">Ação Acadêmica</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((st) => {
                    const fullName =
                      `${st.user.profile?.firstName || ''} ${st.user.profile?.lastName || ''}`.trim();
                    const badge = statusLabels[st.status] || {
                      label: st.status,
                      color: 'bg-secondary text-foreground',
                    };
                    const avatar = st.user.profile?.avatarUrl;
                    return (
                      <TableRow key={st.id}>
                        <TableCell>
                          <div className="h-8 w-8 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                            {avatar ? (
                              <img
                                src={avatar.startsWith('data:') ? avatar : `${API_BASE}${avatar}`}
                                alt={fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-primary/60" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">{fullName}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {st.user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badge.color}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {activeTab === 'espera' && (
                            <Button
                              size="sm"
                              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                              onClick={() => handleOpenProcess(st, 'MATRICULADO')}
                            >
                              Efetivar Matrícula
                            </Button>
                          )}
                          {activeTab === 'rematricula' && (
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                              onClick={() => handleOpenProcess(st, 'REMATRICULADO')}
                            >
                              Realizar Rematrícula
                            </Button>
                          )}
                          {activeTab === 'transfer' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-indigo-600 dark:text-indigo-400 border-indigo-600/30 hover:bg-indigo-500/10"
                              leftIcon={<ArrowRightLeft className="h-3.5 w-3.5" />}
                              onClick={() => handleOpenProcess(st, 'TRANSFERIDO')}
                            >
                              Transferir Aluno
                            </Button>
                          )}
                          {activeTab === 'cancel' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              leftIcon={<XOctagon className="h-3.5 w-3.5" />}
                              onClick={() => handleOpenProcess(st, 'CANCELADO')}
                            >
                              Cancelar Matrícula
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* History Log Tab */
        <Card className="stripe-card">
          <CardContent className="p-0">
            {loadingLogs ? (
              <div className="p-6">
                <SkeletonTable rows={5} cols={5} />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <History className="h-10 w-10 opacity-30 mb-2" />
                <p className="text-sm">Nenhum processo acadêmico registrado ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Operação</TableHead>
                    <TableHead>Ano Letivo</TableHead>
                    <TableHead>Detalhes Contextuais</TableHead>
                    <TableHead>Data / Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const studentName = log.student.user.profile
                      ? `${log.student.user.profile.firstName} ${log.student.user.profile.lastName}`
                      : '—';
                    const badge = statusLabels[log.status] || {
                      label: log.status,
                      color: 'bg-secondary text-foreground',
                    };
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-semibold text-foreground">
                          {studentName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badge.color}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.schoolYear}</TableCell>
                        <TableCell className="text-xs text-foreground">
                          {log.status === 'TRANSFERIDO' && log.destinationSchool && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>
                                Destino: <strong>{log.destinationSchool}</strong>
                              </span>
                            </div>
                          )}
                          {log.reason && (
                            <div className="text-muted-foreground">
                              Motivo: <em>{log.reason}</em>
                            </div>
                          )}
                          {log.notes && (
                            <div
                              className="text-[10px] text-muted-foreground max-w-sm truncate mt-0.5"
                              title={log.notes}
                            >
                              Obs: {log.notes}
                            </div>
                          )}
                          {!log.destinationSchool && !log.reason && !log.notes && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Pagination for logs */}
          {meta.totalPages > 1 && (
            <div className="p-4 border-t border-border">
              <Pagination
                currentPage={logPage}
                totalPages={meta.totalPages}
                onPageChange={(p) => setLogPage(p)}
              />
            </div>
          )}
        </Card>
      )}

      {/* ── Process Dialog Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={getProcessTitle()}
        size="md"
      >
        <form onSubmit={handleSubmitProcess} className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{getModalDescription()}</p>

          <Input
            label="Ano Letivo *"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            placeholder="Ex: 2026"
            leftIcon={<Calendar className="h-4 w-4" />}
            required
          />

          {targetStatus === 'TRANSFERIDO' && (
            <Input
              label="Escola de Destino *"
              value={destinationSchool}
              onChange={(e) => setDestinationSchool(e.target.value)}
              placeholder="Nome da escola para transferência"
              leftIcon={<Building className="h-4 w-4" />}
              required
            />
          )}

          {['TRANSFERIDO', 'CANCELADO'].includes(targetStatus) && (
            <Input
              label="Motivo *"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Razão ou justificativa formal"
              leftIcon={<FileText className="h-4 w-4" />}
              required
            />
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Observações Adicionais
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anotações internas..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {targetStatus === 'CANCELADO' && (
            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-600 mb-0.5">Aviso Importante</p>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Ao cancelar a matrícula, a conta do aluno correspondente no portal será marcada
                  como inativa.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Voltar
            </Button>
            <Button
              type="submit"
              variant={targetStatus === 'CANCELADO' ? 'destructive' : 'primary'}
              isLoading={executing}
            >
              Confirmar Operação
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default AcademicProcessesPage;
