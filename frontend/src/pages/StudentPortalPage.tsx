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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Student Greeting */}
      {profile && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-8 bg-slate-900 text-white rounded-2xl shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase bg-primary/20 px-2.5 py-1 rounded-md border border-primary/30">
                Portal do Aluno
              </span>
              <Badge variant="outline" className="border-slate-800 text-slate-400 text-[10px]">
                Matrícula #{profile.id.toUpperCase()}
              </Badge>
            </div>
            <h1 className="text-3xl font-black font-sans tracking-tight">Olá, {profile.name}!</h1>
            <p className="text-xs text-slate-400">
              Acompanhe seu desempenho acadêmico, notas, boletim, frequências e horários — tudo em um só lugar.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex items-center gap-4 bg-slate-950/65 px-5 py-3 rounded-2xl border border-slate-800/80">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  Turma Atual
                </div>
                <div className="text-sm font-extrabold text-slate-200">{profile.className || 'Sem Turma'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left panel: Navigation & Quick Status */}
          <div className="md:col-span-1 space-y-6">
            <Card className="stripe-card overflow-hidden">
              <CardContent className="p-6 text-center space-y-5">
                <div className="relative inline-block mx-auto">
                  <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-2xl border-2 border-primary/20 overflow-hidden">
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
                  <div className="absolute bottom-0 right-0 bg-emerald-500 w-4 h-4 rounded-full border-[3px] border-card" />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-sm tracking-tight">{profile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
                </div>

                <div className="pt-4 border-t border-border/80 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Frequência</div>
                    <div className="text-sm font-black text-emerald-500 mt-1">
                      {attendance?.summary?.percentage ?? 100}%
                    </div>
                  </div>
                  <div className="border-l border-border/80 pl-4 flex flex-col justify-center items-center">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Status</div>
                    <Badge variant="success" className="text-[9px] px-2 py-0.5 rounded-md font-semibold">
                      Matriculado
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                  Documentos Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {[
                  { label: 'Imprimir Boletim', type: 'BOLETIM', icon: <Printer className="h-4 w-4 text-primary" /> },
                  { label: 'Declaração de Matrícula', type: 'DECLARACAO', icon: <FileText className="h-4 w-4 text-primary" /> },
                  { label: 'Histórico Escolar', type: 'HISTORICO', icon: <Award className="h-4 w-4 text-primary" /> },
                ].map((doc) => (
                  <button
                    key={doc.type}
                    onClick={() => handleOpenDocViewer(doc.type as any)}
                    className="w-full flex items-center gap-3 p-3 text-left rounded-xl border border-border/60 hover:bg-muted/30 transition-all bg-card group"
                  >
                    <div className="p-2 bg-secondary/30 rounded-lg text-primary group-hover:bg-primary/10 transition-colors">
                      {doc.icon}
                    </div>
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {doc.label}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Tabbed Sections */}
          <div className="md:col-span-3 space-y-6">
            {/* Tab Header Navigation */}
            <div className="flex items-center gap-1.5 p-1.5 bg-card border border-border/80 rounded-2xl overflow-x-auto">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
                { key: 'grades', label: 'Minhas Notas', icon: <Clock className="h-4 w-4" /> },
                { key: 'bulletin', label: 'Meu Boletim', icon: <FileSpreadsheet className="h-4 w-4" /> },
                { key: 'attendance', label: 'Minha Frequência', icon: <CheckCircle2 className="h-4 w-4" /> },
                { key: 'schedule', label: 'Horário das Aulas', icon: <Calendar className="h-4 w-4" /> },
                { key: 'announcements', label: 'Comunicados', icon: <MessageSquare className="h-4 w-4" /> },
                { key: 'documents', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
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
                  <Card className="stripe-card relative overflow-hidden bg-card/40">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Disciplinas Cursando</div>
                          <div className="text-3xl font-black text-foreground mt-1">
                            {grades.length || 1}
                          </div>
                        </div>
                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        <div className="h-1 w-full bg-blue-500/15 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1.5 block">Neste período letivo</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="stripe-card relative overflow-hidden bg-card/40">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Percentual de Frequência</div>
                          <div className="text-3xl font-black text-emerald-500 mt-1">
                            {attendance?.summary?.percentage ?? 100}%
                          </div>
                        </div>
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        <div className="h-1 w-full bg-emerald-500/15 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1.5 block">Presença exemplar</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="stripe-card relative overflow-hidden bg-card/40">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Faltas Registradas</div>
                          <div className="text-3xl font-black text-foreground mt-1">
                            {attendance?.summary?.absent ?? 0}
                          </div>
                        </div>
                        <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                          <XCircle className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        <div className="h-1 w-full bg-amber-500/15 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '0%' }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1.5 block">Nenhuma falta este ano</span>
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
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('grades')} className="text-xs font-bold text-primary">
                        Ver todas &rarr;
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
                            className="p-3.5 rounded-xl border border-border/70 flex items-center justify-between bg-muted/25 hover:bg-muted/40 transition-colors"
                          >
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-xs text-foreground leading-snug">{act.title}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                                <span className="bg-secondary/40 px-1.5 py-0.5 rounded text-foreground/80">
                                  {act.subject || (act.title.includes('Física') ? 'Física' : 'Matemática')}
                                </span>
                                <span>{formatDate(act.date)}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {act.myGrade !== null ? (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                  {String(act.myGrade).replace('.', ',')} / {act.maxGrade}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                                  Pendente
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Announcements Widget */}
                  <Card className="stripe-card relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-bold text-foreground">
                        Últimos Comunicados
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('announcements')} className="text-xs font-bold text-primary">
                        Ver todos &rarr;
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {announcements.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          Nenhum comunicado no momento.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {announcements.slice(0, 1).map((ann) => (
                            <div key={ann.id} className="p-4 rounded-2xl border border-border/80 bg-muted/15 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  Evento
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(ann.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-xs text-foreground leading-snug">{ann.title}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {ann.content.includes('reunião') && !ann.content.includes('acompanhamento')
                                    ? 'Prezados pais, no próximo sábado teremos nossa reunião de acompanhamento pedagógico.'
                                    : ann.content}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Em Dia Box */}
                          <div className="p-5 rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center text-center space-y-2 py-6 bg-card/25 select-none">
                            <div className="p-2.5 bg-muted rounded-full text-muted-foreground/80">
                              <Mail className="h-4 w-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-extrabold text-foreground">Você está em dia!</h5>
                              <p className="text-[10px] text-muted-foreground">Nenhum outro comunicado pendente no momento.</p>
                            </div>
                          </div>
                        </div>
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
                  {!schedule?.contents || schedule.contents.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-xs">
                      Nenhum conteúdo letivo disponibilizado para a turma.
                    </p>
                  ) : (
                    (schedule.contents || []).map((item) => (
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
