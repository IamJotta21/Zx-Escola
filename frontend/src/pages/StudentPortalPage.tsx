import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  FileSpreadsheet,
  Calendar,
  BookOpen,
  MessageSquare,
  User,
  Clock,
  Printer,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  AlertCircle,
  Award,
  BookMarked,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import { DocumentViewerModal, DocumentData } from '../components/portal/DocumentViewerModal';

interface StudentProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  birthDate: string | null;
  avatarUrl: string | null;
  className: string | null;
  classId: string | null;
  status: string;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
}

interface StudentReportCard {
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

interface StudentActivityItem {
  id: string;
  title: string;
  date: string;
  maxGrade: number;
  myGrade: number | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string; // PRESENTE, FALTA, JUSTIFICADA
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

interface CalendarItem {
  id: string;
  date: string;
  title: string;
  description: string | null;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface SchoolDoc {
  id: string;
  type: string;
  title: string;
  content?: string;
  filePath?: string;
  fileName?: string;
  createdAt: string;
}

export const StudentPortalPage: React.FC = () => {
  const { addToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'grades'
    | 'bulletin'
    | 'attendance'
    | 'schedule'
    | 'announcements'
    | 'documents'
    | 'profile'
  >('dashboard');

  // Loaded Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [grades, setGrades] = useState<StudentReportCard[]>([]);
  const [activities, setActivities] = useState<StudentActivityItem[]>([]);
  const [attendance, setAttendance] = useState<{
    records: AttendanceRecord[];
    summary: AttendanceSummary;
  } | null>(null);
  const [schedule, setSchedule] = useState<{
    contents: CalendarItem[];
    activities: StudentActivityItem[];
  }>({ contents: [], activities: [] });
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [documents, setDocuments] = useState<SchoolDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State for Document Generator / Printer
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [selectedDocData, setSelectedDocData] = useState<DocumentData | null>(null);

  // Search filter for announcements
  const [announcementFilter, setAnnouncementFilter] = useState('');

  const fetchAllStudentData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        profileRes,
        dashboardRes,
        gradesRes,
        activitiesRes,
        attendanceRes,
        scheduleRes,
        announcementsRes,
        documentsRes,
      ] = await Promise.all([
        api.get('/portal/student/profile'),
        api.get('/portal/student/dashboard').catch(() => ({ data: { data: null } })),
        api.get('/portal/student/grades'),
        api.get('/portal/student/activities'),
        api.get('/portal/student/attendance').catch(() => ({ data: { data: { records: [], summary: { total: 0, present: 0, absent: 0, percentage: 100 } } } })),
        api.get('/portal/student/schedule').catch(() => ({ data: { data: { contents: [], activities: [] } } })),
        api.get('/portal/student/announcements'),
        api.get('/portal/student/documents').catch(() => ({ data: { data: [] } })),
      ]);

      setProfile(profileRes.data.data);
      setDashboardData(dashboardRes.data.data);
      setGrades(gradesRes.data.data || []);
      setActivities(activitiesRes.data.data || []);
      setAttendance(attendanceRes.data.data || null);
      setSchedule(scheduleRes.data.data || { contents: [], activities: [] });
      setAnnouncements(announcementsRes.data.data || []);
      setDocuments(documentsRes.data.data || []);
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao obter dados do portal do aluno.' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAllStudentData();
  }, [fetchAllStudentData]);

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

  const handleOpenDocViewer = (type: 'BOLETIM' | 'DECLARACAO' | 'HISTORICO' | 'COMPROVANTE' | 'CUSTOM', customDoc?: SchoolDoc) => {
    if (!profile) return;

    let docTitle = 'Documento Escolar';
    if (type === 'BOLETIM') docTitle = 'Boletim Escolar Oficial';
    if (type === 'DECLARACAO') docTitle = 'Declaração de Matrícula';
    if (type === 'HISTORICO') docTitle = 'Histórico Escolar';
    if (type === 'COMPROVANTE') docTitle = 'Comprovante de Matrícula e Frequência';
    if (customDoc) docTitle = customDoc.title;

    setSelectedDocData({
      title: docTitle,
      type: type === 'CUSTOM' ? 'CUSTOM' : type,
      studentName: profile.name,
      studentId: profile.id,
      className: profile.className,
      reportCards: grades,
      attendancePercentage: attendance?.summary?.percentage ?? 100,
      customContent: customDoc?.content,
      fileName: customDoc?.fileName,
      filePath: customDoc?.filePath,
    });
    setViewerModalOpen(true);
  };

  // Filtered announcements
  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(announcementFilter.toLowerCase()) ||
      a.content.toLowerCase().includes(announcementFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Student Greeting */}
      {profile && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/20 px-2.5 py-1 rounded-md border border-primary/30">
                Portal do Aluno
              </span>
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                Matrícula #{profile.id.slice(0, 8).toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-2xl font-black">Olá, {profile.name}!</h1>
            <p className="text-sm text-slate-300">
              Acompanhe seu desempenho acadêmico, notas, boletim, frequências e horários.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Turma Atual
                </div>
                <div className="text-xs font-extrabold">{profile.className || 'Sem Turma'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left panel: Navigation & Quick Status */}
          <div className="md:col-span-1 space-y-6">
            <Card className="stripe-card">
              <CardContent className="p-6 text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-3xl border-4 border-primary/20 overflow-hidden">
                    {profile.avatarUrl ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${profile.avatarUrl}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile.name.charAt(0)
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-4 border-background" />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground">{profile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
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
                    <div className="text-xs text-muted-foreground">Status</div>
                    <Badge
                      variant={
                        profile.status === 'MATRICULADO' || profile.status === 'REMATRICULADO'
                          ? 'success'
                          : 'outline'
                      }
                    >
                      {profile.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Documentos Rápidos
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
            {/* Tab Header Navigation */}
            <div className="flex border-b border-border overflow-x-auto pb-px gap-1">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
                { key: 'grades', label: 'Minhas Notas', icon: <Clock className="h-4 w-4" /> },
                { key: 'bulletin', label: 'Meu Boletim', icon: <FileSpreadsheet className="h-4 w-4" /> },
                { key: 'attendance', label: 'Minha Frequência', icon: <CheckCircle2 className="h-4 w-4" /> },
                { key: 'schedule', label: 'Horário das Aulas', icon: <Calendar className="h-4 w-4" /> },
                { key: 'announcements', label: 'Comunicados', icon: <MessageSquare className="h-4 w-4" /> },
                { key: 'documents', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
                { key: 'profile', label: 'Meu Perfil', icon: <User className="h-4 w-4" /> },
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
                {/* Dashboard Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="stripe-card bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold">Disciplinas Cursando</div>
                        <div className="text-2xl font-black text-foreground mt-1">
                          {grades.length}
                        </div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <BookMarked className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="stripe-card bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold">Percentual de Frequência</div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                          {attendance?.summary?.percentage ?? 100}%
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="stripe-card bg-gradient-to-br from-indigo-500/5 to-transparent">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold">Faltas Registradas</div>
                        <div className="text-2xl font-black text-foreground mt-1">
                          {attendance?.summary?.absent ?? 0}
                        </div>
                      </div>
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600">
                        <XCircle className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Dashboard Recent Activities & Announcements */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Recent Activities Widget */}
                  <Card className="stripe-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-bold text-foreground">
                        Atividades Recentes
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('grades')}>
                        Ver todas
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {activities.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          Nenhuma atividade recente cadastrada.
                        </p>
                      ) : (
                        activities.slice(0, 4).map((act) => (
                          <div
                            key={act.id}
                            className="p-3 rounded-xl border border-border/70 flex items-center justify-between bg-muted/20"
                          >
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-xs text-foreground">{act.title}</h4>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                Data: {act.date}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground block">Nota</span>
                              <span className="text-xs font-black text-primary font-mono">
                                {act.myGrade !== null ? `${act.myGrade} / ${act.maxGrade}` : 'Pendente'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Announcements Widget */}
                  <Card className="stripe-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-bold text-foreground">
                        Últimos Comunicados
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('announcements')}>
                        Ver todos
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {announcements.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          Nenhum comunicado no momento.
                        </p>
                      ) : (
                        announcements.slice(0, 3).map((ann) => (
                          <div key={ann.id} className="p-3 rounded-xl border border-border/70 space-y-1 bg-muted/20">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-foreground">{ann.title}</h4>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(ann.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {ann.content}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB 2: MINHAS NOTAS */}
            {activeTab === 'grades' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Atividades, Avaliações e Trabalhos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título da Atividade</TableHead>
                        <TableHead>Data de Lançamento / Limite</TableHead>
                        <TableHead className="text-center">Nota Máxima</TableHead>
                        <TableHead className="text-right">Minha Nota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs">
                            Nenhuma atividade registrada até o momento.
                          </TableCell>
                        </TableRow>
                      ) : (
                        activities.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-semibold text-foreground">
                              {a.title}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{a.date}</TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {a.maxGrade}
                            </TableCell>
                            <TableCell className="text-right font-black font-mono text-xs">
                              {a.myGrade !== null ? (
                                <span className={a.myGrade >= 6 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {a.myGrade}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-normal">Pendente</span>
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

            {/* TAB 3: MEU BOLETIM */}
            {activeTab === 'bulletin' && (
              <Card className="stripe-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Boletim Escolar Oficial
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
                            Nenhuma disciplina lançada no boletim.
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

            {/* TAB 4: MINHA FREQUÊNCIA */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                {/* Attendance Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card className="stripe-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-xs text-muted-foreground">Total de Aulas</div>
                      <div className="text-2xl font-black text-foreground mt-1">
                        {attendance?.summary?.total ?? 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="stripe-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-xs text-muted-foreground">Presenças</div>
                      <div className="text-2xl font-black text-emerald-600 mt-1">
                        {attendance?.summary?.present ?? 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="stripe-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-xs text-muted-foreground">Faltas</div>
                      <div className="text-2xl font-black text-rose-500 mt-1">
                        {attendance?.summary?.absent ?? 0}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="stripe-card">
                    <CardContent className="p-4 text-center">
                      <div className="text-xs text-muted-foreground">Percentual</div>
                      <div className="text-2xl font-black text-primary mt-1">
                        {attendance?.summary?.percentage ?? 100}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Attendance History Table */}
                <Card className="stripe-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Histórico Diário de Frequência
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data da Aula</TableHead>
                          <TableHead className="text-right">Status da Frequência</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!attendance?.records || attendance.records.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-8 text-muted-foreground text-xs">
                              Nenhum registro diário de frequência encontrado.
                            </TableCell>
                          </TableRow>
                        ) : (
                          attendance.records.map((rec) => (
                            <TableRow key={rec.id}>
                              <TableCell className="font-mono text-xs font-semibold">
                                {rec.date}
                              </TableCell>
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

            {/* TAB 5: HORÁRIO DAS AULAS */}
            {activeTab === 'schedule' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Conteúdo Programático e Quadro de Aulas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {schedule.contents.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-xs">
                      Nenhum conteúdo letivo disponibilizado para a turma.
                    </p>
                  ) : (
                    schedule.contents.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-border/80 bg-background/50 hover:bg-slate-500/5 transition-colors flex items-start gap-4"
                      >
                        <div className="bg-primary/10 text-primary font-bold px-3 py-2 rounded-xl text-center font-mono text-xs shrink-0">
                          {item.date}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-foreground text-xs">{item.title}</h4>
                          {item.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* TAB 6: COMUNICADOS */}
            {activeTab === 'announcements' && (
              <Card className="stripe-card">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Mural de Comunicados Oficiais
                  </CardTitle>
                  <div className="w-full sm:w-64">
                    <Input
                      placeholder="Filtrar avisos..."
                      leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                      value={announcementFilter}
                      onChange={(e) => setAnnouncementFilter(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {filteredAnnouncements.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-xs">
                      Nenhum comunicado encontrado.
                    </p>
                  ) : (
                    filteredAnnouncements.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-5 rounded-2xl border border-border/80 bg-card hover:shadow-md transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" /> {ann.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
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
                      Emissão e Visualização de Documentos Oficiais
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
                          <p className="text-[10px] text-muted-foreground">Notas e frequências por disciplina</p>
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
                          <p className="text-[10px] text-muted-foreground">Comprovante de vínculo letivo ativo</p>
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
                          <p className="text-[10px] text-muted-foreground">Registro completo de notas e médias</p>
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
                          <h4 className="font-bold text-foreground text-xs">Comprovante de Frequência</h4>
                          <p className="text-[10px] text-muted-foreground">Atestado de cumprimento da carga horária</p>
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
                        Outros Documentos Emitidos pela Secretaria
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Data de Emissão</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
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
                                  onClick={() => handleOpenDocViewer('CUSTOM', doc)}
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

            {/* TAB 8: MEU PERFIL */}
            {activeTab === 'profile' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Informações Cadastrais Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Nome Completo
                      </div>
                      <div className="text-sm font-bold text-foreground">{profile.name}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> E-mail
                      </div>
                      <div className="text-sm font-bold text-foreground">{profile.email}</div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> Telefone/WhatsApp
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {profile.phone || '—'}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Endereço
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {profile.address
                          ? `${profile.address}, ${profile.city || ''} - ${profile.state || ''}`
                          : '—'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="py-20 text-center text-xs text-muted-foreground">
          Carregando dados do portal do aluno...
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

export default StudentPortalPage;
