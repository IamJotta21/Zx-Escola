import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  BookOpen,
  MessageSquare,
  User,
  Clock,
  Phone,
  Users,
  Award,
  Save,
  Plus,
  Search,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';

interface TeacherProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  subjects: string | null;
  workload: number;
  schedule: string | null;
}

interface StudentShort {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface ClassItem {
  id: string;
  name: string;
  gradeYear: string;
  schoolYear: string;
  room: { name: string; capacity: number } | null;
  studentsCount: number;
  students: StudentShort[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface DashboardData {
  stats: {
    totalClasses: number;
    totalStudents: number;
    totalSubjects: number;
    workload: number;
    subjects: string[];
  };
  announcements: Announcement[];
}

interface ContentItem {
  id: string;
  date: string;
  title: string;
  description: string | null;
}

interface ReportCardItem {
  id?: string;
  studentId: string;
  subject: string;
  bimester1: number | null;
  bimester2: number | null;
  bimester3: number | null;
  bimester4: number | null;
  remedialGrade: number | null;
  finalAverage: number | null;
  status: string;
  absences: number;
  student?: {
    user: {
      profile: {
        firstName: string;
        lastName: string;
      } | null;
    };
  };
}

export const TeacherPortalPage: React.FC = () => {
  const { addToast } = useToast();

  // Navigation & Page State
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'classes'
    | 'subjects'
    | 'diary'
    | 'attendance'
    | 'grades'
    | 'announcements'
    | 'profile'
  >('dashboard');

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Global selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // ── 1. Dashboard State ──────────────────────────────────────────────────────
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);

  // ── 2. Class Content (Diário de Classe) State ──────────────────────────────
  const [contentDate, setContentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [contentTitle, setContentTitle] = useState('');
  const [contentDesc, setContentDesc] = useState('');
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [savingContent, setSavingContent] = useState(false);
  const [contentSearch, setContentSearch] = useState('');
  const [contentPage, setContentPage] = useState(1);
  const contentsPerPage = 5;

  // ── 3. Attendance (Frequência) State ─────────────────────────────────────────
  const [attendanceDate, setAttendanceDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, 'PRESENTE' | 'FALTA' | 'JUSTIFICADA' | 'ATRASO'>
  >({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // ── 4. Grades (Lançamento de Notas) State ────────────────────────────────────
  const [gradesInput, setGradesInput] = useState<
    Record<
      string,
      {
        b1: string;
        b2: string;
        b3: string;
        b4: string;
        rec: string;
      }
    >
  >({});
  const [savingGrades, setSavingGrades] = useState<Record<string, boolean>>({});
  const [gradesSearch, setGradesSearch] = useState('');

  // ── 5. Announcements (Comunicados) State ──────────────────────────────────────
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnTargetClass, setNewAnnTargetClass] = useState('ALL');
  const [postingAnn, setPostingAnn] = useState(false);

  // Fetch initial profile and dashboard statistics
  const fetchProfileAndDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch each endpoint independently so one failure doesn't block the rest
      let profileData: TeacherProfile | null = null;
      let dashData: DashboardData | null = null;
      let classesData: ClassItem[] = [];

      try {
        const res = await api.get('/portal/teacher/profile');
        profileData = res.data.data;
        setProfile(profileData);
      } catch (e) {
        console.error('[TeacherPortal] Erro ao carregar perfil:', e);
      }

      try {
        const res = await api.get('/portal/teacher/dashboard');
        dashData = res.data.data;
        setDashboard(dashData);
        setRecentAnnouncements(dashData?.announcements ?? []);
      } catch (e) {
        console.error('[TeacherPortal] Erro ao carregar dashboard:', e);
      }

      try {
        const res = await api.get('/portal/teacher/classes');
        classesData = res.data.data ?? [];
        setClasses(classesData);

        if (classesData.length > 0) {
          setSelectedClassId(classesData[0].id);
        }
      } catch (e) {
        console.error('[TeacherPortal] Erro ao carregar turmas:', e);
      }

      // Set subjects from profile or dashboard
      const subjectsStr = profileData?.subjects ?? dashData?.stats?.subjects?.join(', ') ?? '';
      if (subjectsStr) {
        const parsed = subjectsStr
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (parsed.length > 0) {
          setSelectedSubject(parsed[0]);
        }
      } else {
        setSelectedSubject('Geral');
      }

      // If ALL three failed, show error toast
      if (!profileData && !dashData && classesData.length === 0) {
        addToast({
          type: 'error',
          message: 'Erro ao carregar dados do portal do professor. Tente recarregar a página.',
        });
      }
    } catch (e) {
      console.error('[TeacherPortal] Erro crítico:', e);
      addToast({
        type: 'error',
        message: 'Erro crítico ao carregar o portal. Verifique o console.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProfileAndDashboard();
  }, [fetchProfileAndDashboard]);

  // Load Class Contents for selected class
  const loadClassContents = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      const res = await api.get('/academic/contents', { params: { classId: selectedClassId } });
      setContentList(res.data.data || []);
    } catch {
      // Silent error
    }
  }, [selectedClassId]);

  // Load Attendance Records for selected class and date
  const loadAttendance = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      const res = await api.get('/academic/attendance', {
        params: { classId: selectedClassId, date: attendanceDate },
      });

      const records = res.data.data || [];
      const currentClass = classes.find((c) => c.id === selectedClassId);

      const tempRecords: Record<string, 'PRESENTE' | 'FALTA' | 'JUSTIFICADA' | 'ATRASO'> = {};

      // Default all class students to PRESENTE
      if (currentClass) {
        currentClass.students.forEach((st) => {
          tempRecords[st.id] = 'PRESENTE';
        });
      }

      // Overwrite with existing DB entries
      records.forEach(
        (rec: { studentId: string; status: 'PRESENTE' | 'FALTA' | 'JUSTIFICADA' | 'ATRASO' }) => {
          tempRecords[rec.studentId] = rec.status;
        }
      );

      setAttendanceRecords(tempRecords);
    } catch {
      // Silent error
    }
  }, [selectedClassId, attendanceDate, classes]);

  // Load Report Cards/Grades for selected class
  const loadGrades = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      const res = await api.get('/academic/report-cards', { params: { classId: selectedClassId } });
      const cards: ReportCardItem[] = res.data.data || [];

      // Populate localized grades input inputs
      const currentClass = classes.find((c) => c.id === selectedClassId);
      const tempInputs: Record<
        string,
        { b1: string; b2: string; b3: string; b4: string; rec: string }
      > = {};

      if (currentClass) {
        currentClass.students.forEach((st) => {
          const matchedCard = cards.find(
            (rc) => rc.studentId === st.id && rc.subject === selectedSubject
          );
          tempInputs[st.id] = {
            b1:
              matchedCard?.bimester1 !== null && matchedCard?.bimester1 !== undefined
                ? String(matchedCard.bimester1)
                : '',
            b2:
              matchedCard?.bimester2 !== null && matchedCard?.bimester2 !== undefined
                ? String(matchedCard.bimester2)
                : '',
            b3:
              matchedCard?.bimester3 !== null && matchedCard?.bimester3 !== undefined
                ? String(matchedCard.bimester3)
                : '',
            b4:
              matchedCard?.bimester4 !== null && matchedCard?.bimester4 !== undefined
                ? String(matchedCard.bimester4)
                : '',
            rec:
              matchedCard?.remedialGrade !== null && matchedCard?.remedialGrade !== undefined
                ? String(matchedCard.remedialGrade)
                : '',
          };
        });
      }
      setGradesInput(tempInputs);
    } catch {
      // Silent error
    }
  }, [selectedClassId, selectedSubject, classes]);

  // Loaders triggered on Tab/Selection change
  useEffect(() => {
    if (activeTab === 'diary') {
      loadClassContents();
    } else if (activeTab === 'attendance') {
      loadAttendance();
    } else if (activeTab === 'grades') {
      loadGrades();
    }
  }, [activeTab, selectedClassId, loadClassContents, loadAttendance, loadGrades]);

  // Trigger loadGrades when selected subject changes
  useEffect(() => {
    if (activeTab === 'grades') {
      loadGrades();
    }
  }, [selectedSubject, activeTab, loadGrades]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  // Save Class Content (Diary entry)
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !contentDate || !contentTitle) {
      addToast({ type: 'warning', message: 'Por favor, preencha os campos obrigatórios (*).' });
      return;
    }

    setSavingContent(true);
    try {
      // Save content with prefixed subject for better organization
      const formattedTitle = `${selectedSubject}: ${contentTitle}`;
      await api.post('/academic/contents', {
        classId: selectedClassId,
        date: contentDate,
        title: formattedTitle,
        description: contentDesc,
      });

      addToast({
        type: 'success',
        title: 'Sucesso',
        message: 'Diário de classe registrado com sucesso.',
      });
      setContentTitle('');
      setContentDesc('');
      loadClassContents();
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar conteúdo.' });
    } finally {
      setSavingContent(false);
    }
  };

  // Auto-Save Content Draft in local storage as safety measure
  useEffect(() => {
    if (contentTitle || contentDesc) {
      const draft = { title: contentTitle, desc: contentDesc, classId: selectedClassId };
      localStorage.setItem(`diary_draft_${profile?.id}`, JSON.stringify(draft));
    }
  }, [contentTitle, contentDesc, selectedClassId, profile]);

  // Restore Draft if exists
  const restoreDraft = () => {
    const raw = localStorage.getItem(`diary_draft_${profile?.id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.classId === selectedClassId) {
          setContentTitle(parsed.title);
          setContentDesc(parsed.desc);
          addToast({ type: 'success', message: 'Rascunho de conteúdo restaurado.' });
        }
      } catch {
        // Fail silently
      }
    }
  };

  // Save Attendance (Frequency)
  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;
    setSavingAttendance(true);

    try {
      const recordsPayload = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await api.post('/academic/attendance', {
        classId: selectedClassId,
        date: attendanceDate,
        subject: selectedSubject,
        records: recordsPayload,
      });

      addToast({
        type: 'success',
        title: 'Frequência Salva',
        message: 'Chamada registrada e integrada ao boletim.',
      });
      loadAttendance();
    } catch {
      addToast({ type: 'error', message: 'Falha ao salvar lista de chamada.' });
    } finally {
      setSavingAttendance(false);
    }
  };

  // Calculate real-time grades average and status on client
  const calculateLocalResults = (studentId: string) => {
    const inputs = gradesInput[studentId];
    if (!inputs) return { average: '—', status: 'Cursando', badge: 'outline' };

    const parseNum = (val: string) => {
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    const n1 = parseNum(inputs.b1);
    const n2 = parseNum(inputs.b2);
    const n3 = parseNum(inputs.b3);
    const n4 = parseNum(inputs.b4);
    const rec = parseNum(inputs.rec);

    const bimesters = [n1, n2, n3, n4];
    const completed = bimesters.filter((b) => b !== null) as number[];

    if (completed.length === 4) {
      const annualAvg = completed.reduce((acc, v) => acc + v, 0) / 4;
      if (annualAvg >= 6.0) {
        return { average: annualAvg.toFixed(1), status: 'Aprovado', badge: 'success' };
      } else {
        if (rec !== null) {
          const postRec = (annualAvg + rec) / 2;
          return {
            average: postRec.toFixed(1),
            status: postRec >= 5.0 ? 'Aprovado' : 'Reprovado',
            badge: postRec >= 5.0 ? 'success' : 'destructive',
          };
        } else {
          return { average: annualAvg.toFixed(1), status: 'Recuperação', badge: 'warning' };
        }
      }
    } else if (completed.length > 0) {
      const runningAvg = completed.reduce((acc, v) => acc + v, 0) / completed.length;
      return { average: runningAvg.toFixed(1), status: 'Cursando', badge: 'outline' };
    }

    return { average: '—', status: 'Cursando', badge: 'outline' };
  };

  // Save Single Student Grades
  const handleSaveStudentGrades = async (studentId: string) => {
    const inputs = gradesInput[studentId];
    if (!inputs) return;

    setSavingGrades((prev) => ({ ...prev, [studentId]: true }));
    try {
      const parseVal = (v: string) => (v === '' ? null : parseFloat(v));

      await api.post('/academic/report-cards', {
        studentId,
        subject: selectedSubject,
        schoolYear: '2026',
        bimester1: parseVal(inputs.b1),
        bimester2: parseVal(inputs.b2),
        bimester3: parseVal(inputs.b3),
        bimester4: parseVal(inputs.b4),
        remedialGrade: parseVal(inputs.rec),
      });

      addToast({
        type: 'success',
        title: 'Notas Lançadas',
        message: 'Boletim do estudante atualizado com sucesso.',
      });
      loadGrades();
    } catch {
      addToast({ type: 'error', message: 'Erro ao registrar as notas.' });
    } finally {
      setSavingGrades((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  // Post Announcement (Comunicado)
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) {
      addToast({ type: 'warning', message: 'Preencha o título e conteúdo do comunicado.' });
      return;
    }

    setPostingAnn(true);
    try {
      await api.post('/communication/announcements', {
        title: newAnnTitle,
        content: newAnnContent,
        target: newAnnTargetClass === 'ALL' ? 'TEACHERS' : 'CLASS',
        classId: newAnnTargetClass === 'ALL' ? null : newAnnTargetClass,
      });

      addToast({
        type: 'success',
        title: 'Comunicado Enviado',
        message: 'Aviso publicado nos painéis correspondentes.',
      });
      setNewAnnTitle('');
      setNewAnnContent('');

      // Reload announcements
      const res = await api.get('/portal/teacher/announcements');
      setRecentAnnouncements(res.data.data);
    } catch {
      addToast({ type: 'error', message: 'Erro ao postar comunicado.' });
    } finally {
      setPostingAnn(false);
    }
  };

  // Helper Badge styling
  const getStatusBadgeElement = (status: string, variant: string) => {
    switch (variant) {
      case 'success':
        return <Badge variant="success">{status}</Badge>;
      case 'destructive':
        return <Badge variant="destructive">{status}</Badge>;
      case 'warning':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Pagination filters & searches
  const currentClassObj = classes.find((c) => c.id === selectedClassId);

  // Content Filtering (Diary)
  const filteredContents = contentList.filter((c) => {
    const term = contentSearch.toLowerCase();
    // Match search query against subject name and content details
    return (
      c.title.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  });

  const totalContentPages = Math.ceil(filteredContents.length / contentsPerPage) || 1;
  const paginatedContents = filteredContents.slice(
    (contentPage - 1) * contentsPerPage,
    contentPage * contentsPerPage
  );

  // Attendance Filtering
  const filteredAttendanceStudents =
    (currentClassObj?.students || [])
      .filter((st) => st.name.toLowerCase().includes(attendanceSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  // Calculate dynamic stats for currently loaded attendance
  const totalLoaded = filteredAttendanceStudents.length;
  const totalAbsences = Object.entries(attendanceRecords).filter(
    ([id, status]) => filteredAttendanceStudents.some((s) => s.id === id) && status === 'FALTA'
  ).length;
  const attendancePercentage =
    totalLoaded > 0 ? Math.round(((totalLoaded - totalAbsences) / totalLoaded) * 100) : 100;

  // Grades Filtering
  const filteredGradesStudents =
    (currentClassObj?.students || [])
      .filter((st) => st.name.toLowerCase().includes(gradesSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Profile Greetings Banner */}
      {profile && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <span className="text-xs font-bold text-primary tracking-widest uppercase">
              Portal do Docente
            </span>
            <h1 className="text-2xl font-black">Olá, Prof. {profile.name}!</h1>
            <p className="text-sm text-slate-300">
              Gerencie suas turmas, registre chamadas, lance notas bimestrais e adicione conteúdos
              programáticos.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
            <Award className="h-8 w-8 text-primary shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Carga Semanal
              </div>
              <div className="text-xs font-extrabold">{profile.workload} horas / semana</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        profile && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left panel: Teacher quick summary info */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="stripe-card">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-3xl border-4 border-primary/20 overflow-hidden">
                      {profile.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-4 border-background" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-foreground">{profile.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-around text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Turmas</div>
                      <div className="text-lg font-black text-foreground">{classes.length}</div>
                    </div>
                    <div className="w-px bg-border my-1" />
                    <div>
                      <div className="text-xs text-muted-foreground">Carga Horária</div>
                      <div className="text-lg font-black text-foreground">{profile.workload}h</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card className="stripe-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Acesso Rápido
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-xs font-bold h-9"
                    leftIcon={<Users className="h-4 w-4" />}
                    onClick={() => setActiveTab('classes')}
                  >
                    Minhas Turmas
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-xs font-bold h-9"
                    leftIcon={<BookOpen className="h-4 w-4" />}
                    onClick={() => setActiveTab('diary')}
                  >
                    Lançar Diário
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-xs font-bold h-9"
                    leftIcon={<Clock className="h-4 w-4" />}
                    onClick={() => setActiveTab('attendance')}
                  >
                    Efetuar Chamada
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-xs font-bold h-9"
                    leftIcon={<FileSpreadsheet className="h-4 w-4" />}
                    onClick={() => setActiveTab('grades')}
                  >
                    Lançar Notas
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right panel: Tabs and content screens */}
            <div className="lg:col-span-3 space-y-6">
              {/* Tabs List */}
              <div className="flex border-b border-border overflow-x-auto pb-px scrollbar-none">
                {[
                  {
                    key: 'dashboard',
                    label: 'Painel',
                    icon: <GraduationCap className="h-4 w-4" />,
                  },
                  { key: 'classes', label: 'Minhas Turmas', icon: <Users className="h-4 w-4" /> },
                  {
                    key: 'subjects',
                    label: 'Minhas Disciplinas',
                    icon: <Award className="h-4 w-4" />,
                  },
                  {
                    key: 'diary',
                    label: 'Diário de Classe',
                    icon: <BookOpen className="h-4 w-4" />,
                  },
                  { key: 'attendance', label: 'Frequência', icon: <Clock className="h-4 w-4" /> },
                  {
                    key: 'grades',
                    label: 'Lançar Notas',
                    icon: <FileSpreadsheet className="h-4 w-4" />,
                  },
                  {
                    key: 'announcements',
                    label: 'Comunicados',
                    icon: <MessageSquare className="h-4 w-4" />,
                  },
                  { key: 'profile', label: 'Meu Perfil', icon: <User className="h-4 w-4" /> },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() =>
                      setActiveTab(
                        tab.key as
                          | 'dashboard'
                          | 'classes'
                          | 'contents'
                          | 'attendance'
                          | 'grades'
                          | 'announcements'
                          | 'profile'
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

              {/* TAB: DASHBOARD */}
              {activeTab === 'dashboard' && dashboard && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Stats Grid */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    <Card className="stripe-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Minhas Turmas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-black text-foreground">
                          {dashboard.stats.totalClasses} Turmas
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Turmas letivas ativas
                        </span>
                      </CardContent>
                    </Card>

                    <Card className="stripe-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Total de Alunos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-black text-foreground">
                          {dashboard.stats.totalStudents} Alunos
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Estudantes alocados
                        </span>
                      </CardContent>
                    </Card>

                    <Card className="stripe-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Disciplinas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-black text-foreground">
                          {dashboard.stats.totalSubjects} Matérias
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Disciplinas registradas
                        </span>
                      </CardContent>
                    </Card>

                    <Card className="stripe-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Carga Horária
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-black text-foreground">
                          {dashboard.stats.workload} horas
                        </div>
                        <span className="text-[10px] text-muted-foreground">Dedicação semanal</span>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Dashboard Announcements List */}
                  <Card className="stripe-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-foreground">
                        Avisos e Comunicados Importantes
                      </CardTitle>
                      <CardDescription>
                        Comunicações do conselho escolar e avisos pedagógicos.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {recentAnnouncements.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-4">
                          Nenhum comunicado recente disponível.
                        </p>
                      ) : (
                        recentAnnouncements.map((ann) => (
                          <div
                            key={ann.id}
                            className="p-4 rounded-xl border border-border bg-secondary/5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-foreground">{ann.title}</h4>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(ann.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {ann.content}
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB: MINHAS TURMAS */}
              {activeTab === 'classes' && (
                <div className="grid gap-4 md:grid-cols-2 animate-in fade-in duration-300">
                  {classes.length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-muted-foreground text-xs italic">
                      Nenhuma turma sob sua responsabilidade.
                    </div>
                  ) : (
                    classes.map((c) => (
                      <Card key={c.id} className="stripe-card">
                        <CardHeader className="pb-3 border-b border-border">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm font-extrabold text-foreground">
                                {c.name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-0.5">
                                {c.gradeYear}
                              </CardDescription>
                            </div>
                            <Badge variant="success">{c.studentsCount} alunos</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground font-bold">Sala Física:</span>
                              <div className="font-semibold text-foreground mt-0.5">
                                {c.room ? c.room.name : 'Não vinculada'}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground font-bold">Ano Letivo:</span>
                              <div className="font-semibold text-foreground mt-0.5">
                                {c.schoolYear}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-border/65 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-8"
                              onClick={() => {
                                setSelectedClassId(c.id);
                                setActiveTab('diary');
                              }}
                            >
                              Diário
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-8"
                              onClick={() => {
                                setSelectedClassId(c.id);
                                setActiveTab('attendance');
                              }}
                            >
                              Chamada
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-[10px] h-8"
                              onClick={() => {
                                setSelectedClassId(c.id);
                                setActiveTab('grades');
                              }}
                            >
                              Notas
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* TAB: MINHAS DISCIPLINAS */}
              {activeTab === 'subjects' && (
                <Card className="stripe-card animate-in fade-in duration-300">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Disciplinas Atribuídas
                    </CardTitle>
                    <CardDescription>
                      Lista de matérias que você está autorizado a lecionar no sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {dashboard && dashboard.stats.subjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        Nenhuma disciplina cadastrada.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {dashboard?.stats.subjects.map((sub, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/5 font-sans"
                          >
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-foreground block">{sub}</span>
                              <span className="text-[10px] text-muted-foreground">
                                Classe Acadêmica
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* TAB: DIÁRIO DE CLASSE */}
              {activeTab === 'diary' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <Card className="stripe-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-foreground">
                        Registrar Conteúdo Ministrado
                      </CardTitle>
                      <CardDescription>
                        Lance novas atividades ou matérias aplicadas nesta turma.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={handleSaveContent} className="space-y-4">
                        <div className="grid sm:grid-cols-3 gap-4">
                          <Select
                            label="Selecione a Turma *"
                            options={classes.map((c) => ({ value: c.id, label: c.name }))}
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                          />
                          <Select
                            label="Selecione a Disciplina *"
                            options={
                              dashboard
                                ? dashboard.stats.subjects.map((s) => ({ value: s, label: s }))
                                : []
                            }
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                          />
                          <Input
                            label="Data *"
                            type="date"
                            value={contentDate}
                            onChange={(e) => setContentDate(e.target.value)}
                          />
                        </div>
                        <Input
                          label="Título do Conteúdo *"
                          placeholder="Ex: Funções Afins e Gráficos"
                          value={contentTitle}
                          onChange={(e) => setContentTitle(e.target.value)}
                          required
                        />
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1 block">
                            Descrição Detalhada / Observações
                          </label>
                          <textarea
                            placeholder="Digite aqui um detalhamento ou observações da aula ministrada..."
                            value={contentDesc}
                            onChange={(e) => setContentDesc(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-[10px]"
                            onClick={restoreDraft}
                          >
                            Restaurar Rascunho
                          </Button>
                          <Button
                            type="submit"
                            isLoading={savingContent}
                            leftIcon={<Save className="h-4 w-4" />}
                          >
                            Salvar Conteúdo
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Contents History list */}
                  <Card className="stripe-card">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">
                          Histórico de Conteúdos
                        </CardTitle>
                        <CardDescription>
                          Visualização das aulas anteriormente registradas.
                        </CardDescription>
                      </div>
                      <div className="relative w-full sm:w-60">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Pesquisar conteúdo..."
                          value={contentSearch}
                          onChange={(e) => {
                            setContentSearch(e.target.value);
                            setContentPage(1);
                          }}
                          className="w-full h-8.5 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedContents.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center py-6 text-xs italic text-muted-foreground"
                              >
                                Nenhum conteúdo correspondente encontrado.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedContents.map((c) => (
                              <TableRow key={c.id}>
                                <TableCell className="font-mono text-xs whitespace-nowrap">
                                  {c.date}
                                </TableCell>
                                <TableCell className="font-bold text-xs">{c.title}</TableCell>
                                <TableCell
                                  className="text-xs text-muted-foreground max-w-xs truncate"
                                  title={c.description || ''}
                                >
                                  {c.description || '—'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      {totalContentPages > 1 && (
                        <div className="p-4 border-t border-border">
                          <Pagination
                            currentPage={contentPage}
                            totalPages={totalContentPages}
                            onPageChange={(page) => setContentPage(page)}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB: FREQUÊNCIA */}
              {activeTab === 'attendance' && (
                <Card className="stripe-card animate-in fade-in duration-300">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">
                          Efetuar Chamada Diária
                        </CardTitle>
                        <CardDescription>
                          Lance faltas, presenças ou atrasos com cálculo de média de presença local.
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<RefreshCw className="h-4 w-4" />}
                          onClick={loadAttendance}
                        >
                          Recarregar
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Save className="h-4 w-4" />}
                          onClick={handleSaveAttendance}
                          isLoading={savingAttendance}
                        >
                          Salvar Chamada
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <div className="p-4 bg-secondary/10 border-b border-border flex flex-col sm:flex-row gap-3">
                    <div className="grid sm:grid-cols-2 gap-3 flex-1">
                      <Select
                        label="Turma"
                        options={classes.map((c) => ({ value: c.id, label: c.name }))}
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                      />
                      <Input
                        label="Data da Chamada"
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                      />
                    </div>
                    <div className="relative self-end w-full sm:w-60">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Pesquisar aluno..."
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        className="w-full h-8.5 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <CardContent className="p-0">
                    {/* Dynamic mini-bar attendance stats */}
                    {filteredAttendanceStudents.length > 0 && (
                      <div className="p-4 bg-slate-500/5 border-b border-border flex justify-between text-xs font-semibold px-6">
                        <div className="text-muted-foreground">
                          Estudantes Filtrados:{' '}
                          <span className="text-foreground">{totalLoaded}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Total de Faltas: <span className="text-rose-500">{totalAbsences}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Média Presença:{' '}
                          <span
                            className={
                              attendancePercentage >= 75 ? 'text-emerald-500' : 'text-rose-500'
                            }
                          >
                            {attendancePercentage}%
                          </span>
                        </div>
                      </div>
                    )}

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estudante</TableHead>
                          <TableHead className="text-right">Marcar Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAttendanceStudents.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              className="text-center py-8 text-xs italic text-muted-foreground"
                            >
                              Nenhum estudante disponível nesta turma.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAttendanceStudents.map((st) => {
                            const currentStatus = attendanceRecords[st.id] || 'PRESENTE';
                            return (
                              <TableRow key={st.id} className="group">
                                <TableCell className="font-bold text-xs">{st.name}</TableCell>
                                <TableCell className="text-right">
                                  <div className="inline-flex gap-1.5">
                                    {[
                                      { key: 'PRESENTE', label: 'Presente', variant: 'success' },
                                      { key: 'FALTA', label: 'Falta', variant: 'destructive' },
                                      {
                                        key: 'JUSTIFICADA',
                                        label: 'Justificada',
                                        variant: 'warning',
                                      },
                                      { key: 'ATRASO', label: 'Atraso', variant: 'outline' },
                                    ].map((opt) => (
                                      <button
                                        key={opt.key}
                                        onClick={() =>
                                          setAttendanceRecords((prev) => ({
                                            ...prev,
                                            [st.id]: opt.key as
                                              'PRESENTE' | 'FALTA' | 'JUSTIFICADA' | 'ATRASO',
                                          }))
                                        }
                                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                                          currentStatus === opt.key
                                            ? opt.variant === 'success'
                                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                              : opt.variant === 'destructive'
                                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                                : opt.variant === 'warning'
                                                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                                  : 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
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

              {/* TAB: LANÇAMENTO DE NOTAS */}
              {activeTab === 'grades' && (
                <Card className="stripe-card animate-in fade-in duration-300">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Lançamento de Notas Bimestrais
                    </CardTitle>
                    <CardDescription>
                      Digite as notas parciais (0.0 a 10.0) de cada estudante. A média final e
                      situação são calculadas em tempo real.
                    </CardDescription>
                  </CardHeader>
                  <div className="p-4 bg-secondary/10 border-b border-border flex flex-col sm:flex-row gap-3">
                    <div className="grid sm:grid-cols-2 gap-3 flex-1">
                      <Select
                        label="Selecionar Turma"
                        options={classes.map((c) => ({ value: c.id, label: c.name }))}
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                      />
                      <Select
                        label="Selecionar Disciplina"
                        options={
                          dashboard
                            ? dashboard.stats.subjects.map((s) => ({ value: s, label: s }))
                            : []
                        }
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                      />
                    </div>
                    <div className="relative self-end w-full sm:w-60">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Filtrar aluno..."
                        value={gradesSearch}
                        onChange={(e) => setGradesSearch(e.target.value)}
                        className="w-full h-8.5 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <CardContent className="p-0 overflow-x-auto">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Estudante</TableHead>
                          <TableHead className="text-center w-16">Nota 1</TableHead>
                          <TableHead className="text-center w-16">Nota 2</TableHead>
                          <TableHead className="text-center w-16">Nota 3</TableHead>
                          <TableHead className="text-center w-16">Nota 4</TableHead>
                          <TableHead className="text-center w-16 text-rose-500">Recup</TableHead>
                          <TableHead className="text-center w-16">Média</TableHead>
                          <TableHead className="text-center w-28">Situação</TableHead>
                          <TableHead className="text-right w-24">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGradesStudents.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="text-center py-8 text-xs italic text-muted-foreground"
                            >
                              Nenhum estudante para esta turma.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredGradesStudents.map((st) => {
                            const local = calculateLocalResults(st.id);
                            const input = gradesInput[st.id] || {
                              b1: '',
                              b2: '',
                              b3: '',
                              b4: '',
                              rec: '',
                            };
                            const isSaving = savingGrades[st.id] || false;

                            const updateField = (
                              field: 'b1' | 'b2' | 'b3' | 'b4' | 'rec',
                              value: string
                            ) => {
                              // Grade inputs validation (allow only valid decimals up to 10)
                              const num = parseFloat(value);
                              if (value !== '' && (isNaN(num) || num < 0 || num > 10)) {
                                return; // Disallow invalid inputs
                              }
                              setGradesInput((prev) => ({
                                ...prev,
                                [st.id]: {
                                  ...prev[st.id],
                                  [field]: value,
                                },
                              }));
                            };

                            return (
                              <TableRow key={st.id} className="group">
                                <TableCell className="font-bold text-xs whitespace-nowrap">
                                  {st.name}
                                </TableCell>
                                {[
                                  { key: 'b1', val: input.b1 },
                                  { key: 'b2', val: input.b2 },
                                  { key: 'b3', val: input.b3 },
                                  { key: 'b4', val: input.b4 },
                                ].map((b) => (
                                  <TableCell key={b.key} className="p-1">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="10"
                                      value={b.val}
                                      onChange={(e) =>
                                        updateField(
                                          b.key as 'b1' | 'b2' | 'b3' | 'b4' | 'rec',
                                          e.target.value
                                        )
                                      }
                                      placeholder="—"
                                      className="w-14 mx-auto text-center py-1 rounded border border-border bg-background font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                  </TableCell>
                                ))}
                                <TableCell className="p-1">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    value={input.rec}
                                    onChange={(e) => updateField('rec', e.target.value)}
                                    placeholder="—"
                                    className="w-14 mx-auto text-center py-1 rounded border border-rose-200 dark:border-rose-900/50 bg-background font-mono text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-rose-500"
                                  />
                                </TableCell>
                                <TableCell className="text-center font-black font-mono text-xs text-foreground">
                                  {local.average}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getStatusBadgeElement(local.status, local.badge)}
                                </TableCell>
                                <TableCell className="text-right p-2">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    className="h-8 text-[10px] w-20 justify-center"
                                    onClick={() => handleSaveStudentGrades(st.id)}
                                    isLoading={isSaving}
                                  >
                                    Salvar
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

              {/* TAB: COMUNICADOS */}
              {activeTab === 'announcements' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <Card className="stripe-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold text-foreground">
                        Postar Comunicado
                      </CardTitle>
                      <CardDescription>
                        Crie comunicados direcionados a professores ou a turmas específicas.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={handlePostAnnouncement} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input
                            label="Título do Comunicado *"
                            placeholder="Ex: Plantão de Dúvidas de Matemática"
                            value={newAnnTitle}
                            onChange={(e) => setNewAnnTitle(e.target.value)}
                            required
                          />
                          <Select
                            label="Destinatários"
                            options={[
                              { value: 'ALL', label: 'Todos os Professores' },
                              ...classes.map((c) => ({
                                value: c.id,
                                label: `Alunos da Turma ${c.name}`,
                              })),
                            ]}
                            value={newAnnTargetClass}
                            onChange={(e) => setNewAnnTargetClass(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground mb-1 block">
                            Conteúdo
                          </label>
                          <textarea
                            placeholder="Digite o texto de comunicado de forma clara..."
                            value={newAnnContent}
                            onChange={(e) => setNewAnnContent(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            required
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button
                            type="submit"
                            isLoading={postingAnn}
                            leftIcon={<Plus className="h-4 w-4" />}
                          >
                            Postar Comunicado
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB: MEU PERFIL */}
              {activeTab === 'profile' && (
                <Card className="stripe-card animate-in fade-in duration-300">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-foreground">
                      Informações Funcionais
                    </CardTitle>
                    <CardDescription>
                      Detalhes do cadastro e carga de trabalho registrada.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl border border-border bg-secondary/5 space-y-1">
                        <span className="text-muted-foreground font-semibold">
                          Identificação Geral
                        </span>
                        <div className="font-extrabold text-foreground text-sm">{profile.name}</div>
                        <div className="text-muted-foreground mt-0.5">{profile.email}</div>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-secondary/5 space-y-1">
                        <span className="text-muted-foreground font-semibold">
                          Contato Registrado
                        </span>
                        <div className="font-extrabold text-foreground text-sm">
                          {profile.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {profile.phone}
                            </div>
                          ) : (
                            'Nenhum telefone registrado'
                          )}
                        </div>
                        <div className="text-muted-foreground mt-0.5">
                          Telefone de contato do portal
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-secondary/5 space-y-2 text-xs">
                      <span className="text-muted-foreground font-semibold">
                        Grade Horária Registrada
                      </span>
                      {profile.schedule ? (
                        <p className="text-foreground leading-relaxed font-mono bg-background p-3 rounded-lg border border-border">
                          {profile.schedule}
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic leading-relaxed">
                          Nenhuma grade horária cadastrada administrativamente.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default TeacherPortalPage;
