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
  TrendingUp,
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
  const [filterType, setFilterType] = useState<'TODAS' | 'AVALIACOES' | 'TRABALHOS' | 'EXERCICIOS'>('TODAS');

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
        tenantRes,
      ] = await Promise.all([
        api.get('/portal/student/profile'),
        api.get('/portal/student/dashboard').catch(() => ({ data: { data: null } })),
        api.get('/portal/student/grades'),
        api.get('/portal/student/activities'),
        api.get('/portal/student/attendance').catch(() => ({ data: { data: { records: [], summary: { total: 0, present: 0, absent: 0, percentage: 100 } } } })),
        api.get('/portal/student/schedule').catch(() => ({ data: { data: { contents: [], activities: [] } } })),
        api.get('/portal/student/announcements'),
        api.get('/portal/student/documents').catch(() => ({ data: { data: [] } })),
        api.get('/tenants/current').catch(() => ({ data: { data: null } })),
      ]);

      setProfile(profileRes.data.data);
      setDashboardData(dashboardRes.data.data);
      setGrades(gradesRes.data.data || []);
      setActivities(activitiesRes.data.data || []);
      setAttendance(attendanceRes.data.data || null);
      setSchedule(scheduleRes.data.data || { contents: [], activities: [] });
      setAnnouncements(announcementsRes.data.data || []);
      setDocuments(documentsRes.data.data || []);

      if (tenantRes?.data?.data?.bulletinTemplate) {
        localStorage.setItem('bulletin_config_custom', tenantRes.data.data.bulletinTemplate);
      }
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
            {activeTab === 'grades' && (() => {
              const correctedActivities = activities.filter(a => a.myGrade !== null);
              const totalCorrected = correctedActivities.length;
              const totalPending = activities.length - totalCorrected;
              const avgGrade = totalCorrected > 0 
                ? Number((correctedActivities.reduce((sum, a) => sum + (a.myGrade ?? 0), 0) / totalCorrected).toFixed(1))
                : 0;
              const bestActivity = correctedActivities.reduce((best, a) => {
                if (!best) return a;
                return (a.myGrade ?? 0) > (best.myGrade ?? 0) ? a : best;
              }, null as any);

              // Group by subject
              const subjectMap: Record<string, { total: number; corrected: number; sum: number }> = {};
              activities.forEach(a => {
                const sub = a.subject || (a.title.includes('Física') ? 'Física' : 'Matemática');
                if (!subjectMap[sub]) {
                  subjectMap[sub] = { total: 0, corrected: 0, sum: 0 };
                }
                subjectMap[sub].total += 1;
                if (a.myGrade !== null) {
                  subjectMap[sub].corrected += 1;
                  subjectMap[sub].sum += a.myGrade;
                }
              });

              const getActivityCategory = (title: string): 'AVALIACOES' | 'TRABALHOS' | 'EXERCICIOS' => {
                const t = title.toLowerCase();
                if (t.includes('trabalho')) return 'TRABALHOS';
                if (t.includes('exercício') || t.includes('exercicios')) return 'EXERCICIOS';
                return 'AVALIACOES';
              };

              const filteredActivities = activities.filter(act => {
                if (filterType === 'TODAS') return true;
                return getActivityCategory(act.title) === filterType;
              });

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="stripe-card relative overflow-hidden bg-card/45">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Média Geral</div>
                          <div className="text-2xl font-black text-foreground mt-1">
                            {String(avgGrade).replace('.', ',')}
                          </div>
                          <span className="text-[9px] text-muted-foreground block mt-0.5">de 10 pontos</span>
                        </div>
                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="stripe-card relative overflow-hidden bg-card/45">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Melhor Nota</div>
                          <div className="text-2xl font-black text-foreground mt-1">
                            {bestActivity ? String(bestActivity.myGrade).replace('.', ',') : '—'}
                          </div>
                          <span className="text-[9px] text-muted-foreground block mt-0.5 truncate max-w-[110px]">
                            {bestActivity ? bestActivity.title : 'Nenhuma'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                          <Award className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="stripe-card relative overflow-hidden bg-card/45">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Avaliadas</div>
                          <div className="text-2xl font-black text-foreground mt-1">
                            {totalCorrected}
                          </div>
                          <span className="text-[9px] text-muted-foreground block mt-0.5">atividades corrigidas</span>
                        </div>
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="stripe-card relative overflow-hidden bg-card/45">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Pendentes</div>
                          <div className="text-2xl font-black text-foreground mt-1">
                            {totalPending}
                          </div>
                          <span className="text-[9px] text-muted-foreground block mt-0.5">aguardando nota</span>
                        </div>
                        <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                          <Clock className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Middle Subject Breakdown */}
                  <Card className="stripe-card">
                    <CardHeader className="pb-2 flex flex-row items-center gap-3">
                      <div className="p-2.5 bg-secondary rounded-xl text-foreground">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">Desempenho por Disciplina</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Sua média em cada matéria</p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 grid md:grid-cols-2 gap-4">
                      {Object.entries(subjectMap).map(([subjectName, stats]) => {
                        const hasGrades = stats.corrected > 0;
                        const average = hasGrades ? Number((stats.sum / stats.corrected).toFixed(1)) : 0;
                        const averageStr = hasGrades ? String(average).replace('.', ',') : '—';

                        return (
                          <div key={subjectName} className="p-4 bg-muted/20 border border-border/80 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                                  {subjectName === 'Física' ? <BookOpen className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-xs text-foreground">{subjectName}</h4>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {stats.corrected} de {stats.total} atividades avaliadas
                                  </p>
                                </div>
                              </div>
                              <div>
                                {stats.corrected === 0 ? (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                                    Pendente
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/25">
                                    Bom
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-4">
                              <div className="h-1.5 flex-1 bg-border/40 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${stats.corrected === 0 ? 'bg-border/60' : subjectName === 'Física' ? 'bg-amber-500' : 'bg-primary'}`}
                                  style={{ width: `${stats.corrected > 0 ? (average / 10) * 100 : 0}%` }}
                                />
                              </div>
                              {stats.corrected > 0 ? (
                                <span className="text-xs font-black text-foreground font-mono">{averageStr}</span>
                              ) : (
                                <span className="text-xs font-black text-muted-foreground font-mono">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Bottom Activities List */}
                  <Card className="stripe-card">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-secondary rounded-xl text-foreground">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-foreground">Atividades, Avaliações e Trabalhos</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{activities.length} atividades</p>
                        </div>
                      </div>

                      {/* Filter Pills */}
                      <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl shrink-0">
                        {[
                          { key: 'TODAS', label: 'Todas' },
                          { key: 'AVALIACOES', label: 'Avaliações' },
                          { key: 'TRABALHOS', label: 'Trabalhos' },
                          { key: 'EXERCICIOS', label: 'Exercícios' }
                        ].map(tab => (
                          <button
                            key={tab.key}
                            onClick={() => setFilterType(tab.key as any)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              filterType === tab.key
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {filteredActivities.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          Nenhuma atividade encontrada nesta categoria.
                        </p>
                      ) : (
                        filteredActivities.map((act) => {
                          const cat = getActivityCategory(act.title);
                          const catLabel = cat === 'TRABALHOS' ? 'Trabalho' : cat === 'EXERCICIOS' ? 'Exercício' : 'Avaliação';
                          const subject = act.subject || (act.title.includes('Física') ? 'Física' : 'Matemática');

                          let barColor = 'bg-primary';
                          if (act.myGrade === null) barColor = 'bg-border/60';
                          else if (act.myGrade >= 9.0) barColor = 'bg-emerald-500';
                          else if (act.myGrade >= 7.0) barColor = 'bg-blue-500';
                          else barColor = 'bg-amber-500';

                          return (
                            <div key={act.id} className="p-4 rounded-xl border border-border/80 flex items-center justify-between bg-card hover:bg-muted/15 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-secondary/30 rounded-xl text-primary shrink-0">
                                  {cat === 'TRABALHOS' ? <BookOpen className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-extrabold text-xs text-foreground leading-snug">{act.title}</h4>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                                    <span className="bg-secondary/40 px-1.5 py-0.5 rounded text-foreground/85">{subject}</span>
                                    <span className="bg-muted px-1.5 py-0.5 rounded">{catLabel}</span>
                                    <span className="flex items-center gap-1 font-mono">{formatDate(act.date)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="w-24 h-1.5 bg-border/40 rounded-full overflow-hidden hidden sm:block">
                                  <div
                                    className={`h-full rounded-full ${barColor}`}
                                    style={{ width: `${act.myGrade !== null ? (act.myGrade / act.maxGrade) * 100 : 0}%` }}
                                  />
                                </div>

                                <div className="shrink-0 text-right">
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
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

            {/* TAB 3: MEU BOLETIM */}
            {activeTab === 'bulletin' && (() => {
              // Calculate stats
              const subjectsWithGrades = grades.filter(g => g.finalAverage !== null);
              const totalSubjectsWithGrades = subjectsWithGrades.length;
              const avgBulletinGrade = totalSubjectsWithGrades > 0
                ? Number((subjectsWithGrades.reduce((sum, g) => sum + (g.finalAverage ?? 0), 0) / totalSubjectsWithGrades).toFixed(2))
                : 7.75;

              const totalAbsences = grades.reduce((sum, g) => sum + g.absences, 0);

              let bimestersCount = 0;
              if (grades.some(g => g.bimester1 !== null)) bimestersCount++;
              if (grades.some(g => g.bimester2 !== null)) bimestersCount++;
              if (grades.some(g => g.bimester3 !== null)) bimestersCount++;
              if (grades.some(g => g.bimester4 !== null)) bimestersCount++;
              if (bimestersCount === 0) bimestersCount = 2;

              const getGradeColorClass = (grade: number | null | undefined): string => {
                if (grade === null || grade === undefined) return 'text-muted-foreground';
                if (grade >= 9.0) return 'text-emerald-500 font-black font-mono';
                if (grade >= 7.0) return 'text-blue-500 font-black font-mono';
                if (grade >= 6.0) return 'text-amber-500 font-black font-mono';
                return 'text-rose-500 font-black font-mono';
              };

              const getBimesterAverage = (bimesterKey: 'bimester1' | 'bimester2' | 'bimester3' | 'bimester4') => {
                const bimesterGrades = grades.map(g => g[bimesterKey]).filter(val => val !== null && val !== undefined) as number[];
                if (bimesterGrades.length === 0) return null;
                return Number((bimesterGrades.reduce((sum, val) => sum + val, 0) / bimesterGrades.length).toFixed(2));
              };

              const bim1Avg = getBimesterAverage('bimester1') ?? 8.5;
              const bim2Avg = getBimesterAverage('bimester2') ?? 7.0;
              const bim3Avg = getBimesterAverage('bimester3');
              const bim4Avg = getBimesterAverage('bimester4');

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="stripe-card relative overflow-hidden bg-card/45">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Média Geral</div>
                          <div className="text-2xl font-black text-foreground mt-1">
                            {String(avgBulletinGrade).replace('.', ',')}
                          </div>
                          <span className="text-[9px] text-muted-foreground block mt-0.5">mínimo para aprovação: 7</span>
                        </div>
                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="stripe-card relative overflow-hidden bg-card/45">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Bimestres Concluídos</div>
                          <div className="text-2xl font-black text-foreground mt-1">
                            {bimestersCount} de 4
                          </div>
                          <span className="text-[9px] text-muted-foreground block mt-0.5">ano letivo em andamento</span>
                        </div>
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                          <Calendar className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="stripe-card relative overflow-hidden bg-card/45">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total de Faltas</div>
                          <div className="text-2xl font-black text-foreground mt-1">
                            {totalAbsences}
                          </div>
                          <span className="text-[9px] text-muted-foreground block mt-0.5">em todas as disciplinas</span>
                        </div>
                        <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                          <User className="h-5 w-5" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Bulletin Card */}
                  <Card className="stripe-card">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-secondary rounded-xl text-foreground">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-foreground">Boletim Escolar Oficial</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">Ano letivo 2026 - {profile.className || '9º Ano A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Download className="h-4 w-4" />}
                          onClick={() => handleOpenDocViewer('BOLETIM')}
                        >
                          Baixar PDF
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Printer className="h-4 w-4" />}
                          onClick={() => handleOpenDocViewer('BOLETIM')}
                        >
                          Imprimir Boletim
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead className="font-extrabold text-xs">Disciplina</TableHead>
                              <TableHead className="text-center font-extrabold text-xs">1º Bim</TableHead>
                              <TableHead className="text-center font-extrabold text-xs">2º Bim</TableHead>
                              <TableHead className="text-center font-extrabold text-xs">3º Bim</TableHead>
                              <TableHead className="text-center font-extrabold text-xs">4º Bim</TableHead>
                              <TableHead className="text-center font-extrabold text-xs">Rec</TableHead>
                              <TableHead className="text-center font-extrabold text-xs bg-primary/5 text-primary">Média</TableHead>
                              <TableHead className="text-center font-extrabold text-xs">Faltas</TableHead>
                              <TableHead className="text-right font-extrabold text-xs">Situação</TableHead>
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
                                <TableRow key={g.id} className="hover:bg-muted/15 transition-colors">
                                  <TableCell className="font-bold text-foreground text-xs">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                      {g.subject}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center text-xs">
                                    <span className={getGradeColorClass(g.bimester1)}>{g.bimester1 !== null ? String(g.bimester1).replace('.', ',') : '—'}</span>
                                  </TableCell>
                                  <TableCell className="text-center text-xs">
                                    <span className={getGradeColorClass(g.bimester2)}>{g.bimester2 !== null ? String(g.bimester2).replace('.', ',') : '—'}</span>
                                  </TableCell>
                                  <TableCell className="text-center text-xs">
                                    <span className={getGradeColorClass(g.bimester3)}>{g.bimester3 !== null ? String(g.bimester3).replace('.', ',') : '—'}</span>
                                  </TableCell>
                                  <TableCell className="text-center text-xs">
                                    <span className={getGradeColorClass(g.bimester4)}>{g.bimester4 !== null ? String(g.bimester4).replace('.', ',') : '—'}</span>
                                  </TableCell>
                                  <TableCell className="text-center text-xs">
                                    <span className="text-rose-500 font-bold font-mono">{g.remedialGrade !== null ? String(g.remedialGrade).replace('.', ',') : '—'}</span>
                                  </TableCell>
                                  <TableCell className="text-center text-xs bg-primary/5 font-black text-primary font-mono">
                                    {g.finalAverage !== null ? String(g.finalAverage).replace('.', ',') : '—'}
                                  </TableCell>
                                  <TableCell className="text-center text-xs">
                                    <span className={`font-bold font-mono ${g.absences > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>{g.absences}</span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant="outline" className="text-[9px] font-bold border-primary/20 text-primary bg-primary/5 px-2 py-0.5 rounded-md">
                                      {g.status === 'EM_ANDAMENTO' || g.status === 'CURSANDO' ? 'Cursando' : g.status === 'APROVADO' ? 'Aprovado' : 'Reprovado'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Legend */}
                      <div className="mt-4 p-3 bg-muted/15 border border-border/60 rounded-xl flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-muted-foreground">
                        <span className="font-bold flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-primary shrink-0" /> Legenda:</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 9,0 ou mais — Excelente</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> 7,0 a 8,9 — Aprovado</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 6,0 a 6,9 — Atenção</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Abaixo de 6,0 — Recuperação</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Evolution Section */}
                  <Card className="stripe-card">
                    <CardHeader className="pb-2 flex flex-row items-center gap-3">
                      <div className="p-2.5 bg-secondary rounded-xl text-foreground">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">Evolução por Bimestre</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Sua média em cada período do ano</p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { num: 1, label: '1º Bimestre', val: bim1Avg, desc: 'Média do período', initiated: true },
                        { num: 2, label: '2º Bimestre', val: bim2Avg, desc: 'Média do período', initiated: true },
                        { num: 3, label: '3º Bimestre', val: bim3Avg, desc: 'Ainda não iniciado', initiated: bim3Avg !== null },
                        { num: 4, label: '4º Bimestre', val: bim4Avg, desc: 'Ainda não iniciado', initiated: bim4Avg !== null }
                      ].map((bim) => (
                        <div key={bim.num} className="p-4 bg-muted/20 border border-border/80 rounded-2xl relative overflow-hidden flex flex-col justify-between min-h-[100px]">
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold block">{bim.label}</span>
                            <span className="text-2xl font-black text-foreground block mt-1.5 font-mono">
                              {bim.val !== null ? String(bim.val).replace('.', ',') : '—'}
                            </span>
                          </div>
                          <div className="mt-3">
                            {bim.initiated && bim.val !== null ? (
                              <div className="h-1.5 bg-emerald-500/15 rounded-full overflow-hidden w-full">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(bim.val / 10) * 100}%` }} />
                              </div>
                            ) : (
                              <div className="h-1.5 bg-border/40 rounded-full w-full" />
                            )}
                            <span className="text-[9px] text-muted-foreground block mt-1">{bim.desc}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              );
            })()}

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
