import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Plus,
  BookOpen,
  ClipboardList,
  Award,
  ArrowLeft,
  Trash2,
  RefreshCw,
  Edit2,
  Save,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
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

interface Profile {
  firstName: string;
  lastName: string;
}

interface UserProfile {
  profile: Profile | null;
}

interface StudentItem {
  id: string;
  user: UserProfile;
}

interface ClassDetail {
  id: string;
  name: string;
  gradeYear: string;
  schoolYear: string;
  teacher: {
    subjects: string | null;
  } | null;
  students: StudentItem[];
}

interface ContentItem {
  id: string;
  date: string;
  title: string;
  description: string | null;
}

interface ActivityItem {
  id: string;
  title: string;
  maxGrade: number;
  date: string;
  grades: {
    studentId: string;
    value: number;
  }[];
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
}

export const ClassDiaryPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'attendance' | 'content' | 'activities' | 'grades'>(
    'attendance'
  );
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Subjects lists
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  // ── 1. Attendance state ──────────────────────────────────────────────────────
  const [attendanceDate, setAttendanceDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'PRESENTE' | 'FALTA'>>(
    {}
  );
  const [savingAttendance, setSavingAttendance] = useState(false);

  // ── 2. Content state ─────────────────────────────────────────────────────────
  const [contentDate, setContentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [contentTitle, setContentTitle] = useState('');
  const [contentDesc, setContentDesc] = useState('');
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [savingContent, setSavingContent] = useState(false);

  // ── 3. Activities state ──────────────────────────────────────────────────────
  const [activityList, setActivityList] = useState<ActivityItem[]>([]);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [savingActivity, setSavingActivity] = useState(false);
  const [actTitle, setActTitle] = useState('');
  const [actMaxGrade, setActMaxGrade] = useState('10.0');
  const [actDate, setActDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Activity Grades Modal
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [gradesInput, setGradesInput] = useState<Record<string, string>>({});
  const [savingGrades, setSavingGrades] = useState(false);

  // ── 4. Consolidated Report Cards state ───────────────────────────────────────
  const [reportCards, setReportCards] = useState<ReportCardItem[]>([]);
  const [isAveragesModalOpen, setIsAveragesModalOpen] = useState(false);
  const [selectedStudentForAvg, setSelectedStudentForAvg] = useState<StudentItem | null>(null);
  const [savingAverage, setSavingAverage] = useState(false);

  // Averages Fields
  const [b1, setB1] = useState('');
  const [b2, setB2] = useState('');
  const [b3, setB3] = useState('');
  const [b4, setB4] = useState('');
  const [recVal, setRecVal] = useState('');

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const fetchClassDetail = useCallback(async () => {
    try {
      const res = await api.get(`/classes/${classId}`);
      const data = res.data.data;
      if (data && data.students) {
        data.students.sort((a: any, b: any) => {
          const nameA = a.user?.profile ? `${a.user.profile.firstName} ${a.user.profile.lastName}` : a.name || a.email || '';
          const nameB = b.user?.profile ? `${b.user.profile.firstName} ${b.user.profile.lastName}` : b.name || b.email || '';
          return nameA.localeCompare(nameB, 'pt-BR');
        });
      }
      setClassDetail(data);

      // Parse subjects
      if (data.teacher?.subjects) {
        const list = data.teacher.subjects.split(',').map((s: string) => s.trim());
        setSubjects(list);
        if (list.length > 0) setSelectedSubject(list[0]);
      } else {
        setSubjects(['Geral']);
        setSelectedSubject('Geral');
      }
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar detalhes da turma.' });
    }
  }, [classId, addToast]);

  const fetchContents = useCallback(async () => {
    try {
      const res = await api.get('/academic/contents', { params: { classId } });
      setContentList(res.data.data);
    } catch {
      // Fail silently
    }
  }, [classId]);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await api.get('/academic/activities', { params: { classId } });
      setActivityList(res.data.data);
    } catch {
      // Fail silently
    }
  }, [classId]);

  const fetchReportCards = useCallback(async () => {
    try {
      const res = await api.get('/academic/report-cards', { params: { classId } });
      setReportCards(res.data.data);
    } catch {
      // Fail silently
    }
  }, [classId]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await fetchClassDetail();
    await Promise.all([fetchContents(), fetchActivities(), fetchReportCards()]);
    setLoading(false);
  }, [fetchClassDetail, fetchContents, fetchActivities, fetchReportCards]);

  useEffect(() => {
    fetchAllData();
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial populate attendance records when student lists load or date changes
  useEffect(() => {
    if (classDetail) {
      const initial: Record<string, 'PRESENTE' | 'FALTA'> = {};
      classDetail.students.forEach((st) => {
        initial[st.id] = 'PRESENTE'; // Defaults to Present
      });
      setAttendanceRecords(initial);
    }
  }, [classDetail, attendanceDate]);

  // ── 1. Attendance Logic ──────────────────────────────────────────────────────
  const handleToggleAttendance = (studentId: string, status: 'PRESENTE' | 'FALTA') => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await api.post('/academic/attendance', {
        classId,
        date: attendanceDate,
        subject: selectedSubject,
        records,
      });

      addToast({
        type: 'success',
        title: 'Frequência Salva',
        message: 'Lista de presença do dia foi registrada.',
      });
      fetchReportCards();
    } catch {
      addToast({ type: 'error', message: 'Falha ao salvar diário de presença.' });
    } finally {
      setSavingAttendance(false);
    }
  };

  // ── 2. Content Logic ─────────────────────────────────────────────────────────
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTitle) return;
    setSavingContent(true);
    try {
      await api.post('/academic/contents', {
        classId,
        date: contentDate,
        title: contentTitle,
        description: contentDesc,
      });

      addToast({
        type: 'success',
        title: 'Conteúdo Registrado',
        message: 'Anotações da aula salvas com sucesso.',
      });
      setContentTitle('');
      setContentDesc('');
      fetchContents();
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar conteúdo.' });
    } finally {
      setSavingContent(false);
    }
  };

  // ── 3. Activity & Grades Logic ───────────────────────────────────────────────
  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle) return;
    setSavingActivity(true);
    try {
      await api.post('/academic/activities', {
        classId,
        title: actTitle,
        maxGrade: parseFloat(actMaxGrade),
        date: actDate,
      });

      addToast({
        type: 'success',
        title: 'Atividade Criada',
        message: 'Atividade adicionada ao quadro de notas.',
      });
      setIsActivityModalOpen(false);
      setActTitle('');
      setActMaxGrade('10.0');
      fetchActivities();
    } catch {
      addToast({ type: 'error', message: 'Erro ao criar atividade.' });
    } finally {
      setSavingActivity(false);
    }
  };

  const handleDeleteActivity = async (actId: string) => {
    if (
      !confirm('Deseja realmente remover esta atividade? Todas as notas associadas serão perdidas.')
    )
      return;
    try {
      await api.delete(`/academic/activities/${actId}`);
      addToast({ type: 'success', message: 'Atividade excluída.' });
      fetchActivities();
    } catch {
      addToast({ type: 'error', message: 'Falha ao excluir atividade.' });
    }
  };

  const openGradesModal = (act: ActivityItem) => {
    setSelectedActivity(act);
    const inputs: Record<string, string> = {};
    classDetail?.students.forEach((st) => {
      const match = act.grades.find((g) => g.studentId === st.id);
      inputs[st.id] = match ? String(match.value) : '';
    });
    setGradesInput(inputs);
    setIsGradesModalOpen(true);
  };

  const handleSaveGrades = async () => {
    if (!selectedActivity) return;
    setSavingGrades(true);
    try {
      const gradesList = Object.entries(gradesInput).map(([studentId, value]) => ({
        studentId,
        value: value === '' ? 0 : parseFloat(value),
      }));

      await api.post('/academic/grades', {
        activityId: selectedActivity.id,
        grades: gradesList,
      });

      addToast({
        type: 'success',
        title: 'Notas Lançadas',
        message: 'Notas consolidadas da atividade.',
      });
      setIsGradesModalOpen(false);
      fetchActivities();
    } catch {
      addToast({ type: 'error', message: 'Falha ao lançar notas.' });
    } finally {
      setSavingGrades(false);
    }
  };

  // ── 4. Consolidated Report Card Logic ───────────────────────────────────────
  const openAveragesModal = (student: StudentItem) => {
    setSelectedStudentForAvg(student);
    const matched = reportCards.find(
      (r) => r.studentId === student.id && r.subject === selectedSubject
    );

    setB1(
      matched?.bimester1 !== null && matched?.bimester1 !== undefined
        ? String(matched.bimester1)
        : ''
    );
    setB2(
      matched?.bimester2 !== null && matched?.bimester2 !== undefined
        ? String(matched.bimester2)
        : ''
    );
    setB3(
      matched?.bimester3 !== null && matched?.bimester3 !== undefined
        ? String(matched.bimester3)
        : ''
    );
    setB4(
      matched?.bimester4 !== null && matched?.bimester4 !== undefined
        ? String(matched.bimester4)
        : ''
    );
    setRecVal(
      matched?.remedialGrade !== null && matched?.remedialGrade !== undefined
        ? String(matched.remedialGrade)
        : ''
    );

    setIsAveragesModalOpen(true);
  };

  const handleSaveAverages = async () => {
    if (!selectedStudentForAvg) return;
    setSavingAverage(true);
    try {
      const parseVal = (val: string) => (val === '' ? null : parseFloat(val));

      await api.post('/academic/report-cards', {
        studentId: selectedStudentForAvg.id,
        subject: selectedSubject,
        schoolYear: classDetail?.schoolYear || '2026',
        bimester1: parseVal(b1),
        bimester2: parseVal(b2),
        bimester3: parseVal(b3),
        bimester4: parseVal(b4),
        remedialGrade: parseVal(recVal),
      });

      addToast({
        type: 'success',
        title: 'Médias Atualizadas',
        message: 'Boletim do aluno atualizado.',
      });
      setIsAveragesModalOpen(false);
      fetchReportCards();
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar médias do boletim.' });
    } finally {
      setSavingAverage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADO':
        return <Badge variant="success">Aprovado</Badge>;
      case 'REPROVADO':
        return <Badge variant="destructive">Reprovado</Badge>;
      case 'EM_RECUPERACAO':
        return <Badge variant="warning">Recuperação</Badge>;
      default:
        return <Badge variant="outline">Cursando</Badge>;
    }
  };

  if (loading || !classDetail) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => navigate('/turmas')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold font-sans text-foreground">
              Diário de Classe: {classDetail.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {classDetail.gradeYear} • Ano Letivo: {classDetail.schoolYear}
            </p>
          </div>
        </div>

        {/* Global Subject Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground whitespace-nowrap">Matéria:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {subjects.map((sub, idx) => (
              <option key={idx} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'attendance'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Frequência (Chamada)
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'content'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Conteúdo Programático
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'activities'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Atividades & Notas
        </button>
        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'grades'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Award className="h-4 w-4" />
          Boletim Consolidado
        </button>
      </div>

      {/* ── 1. Attendance Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <Card className="stripe-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/20 p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Data da Chamada:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <Button
                onClick={handleSaveAttendance}
                isLoading={savingAttendance}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Salvar Chamada
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudante</TableHead>
                  <TableHead className="text-right">Frequência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classDetail.students.map((st) => {
                  const name = `${st.user.profile?.firstName || ''} ${st.user.profile?.lastName || ''}`;
                  const currentStatus = attendanceRecords[st.id] || 'PRESENTE';
                  return (
                    <TableRow key={st.id}>
                      <TableCell className="font-semibold text-foreground">{name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant={currentStatus === 'PRESENTE' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleAttendance(st.id, 'PRESENTE')}
                            className="h-8 text-xs"
                          >
                            Presente
                          </Button>
                          <Button
                            variant={currentStatus === 'FALTA' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleAttendance(st.id, 'FALTA')}
                            className="h-8 text-xs"
                          >
                            Falta
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

      {/* ── 2. Content Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'content' && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="stripe-card h-fit">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-foreground">Registrar Nova Aula</h2>
              <form onSubmit={handleSaveContent} className="space-y-4">
                <Input
                  label="Data *"
                  type="date"
                  value={contentDate}
                  onChange={(e) => setContentDate(e.target.value)}
                  required
                />
                <Input
                  label="Título da Aula / Conteúdo *"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="Ex: Introdução às Matrizes"
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Descrição do Conteúdo
                  </label>
                  <textarea
                    value={contentDesc}
                    onChange={(e) => setContentDesc(e.target.value)}
                    rows={4}
                    placeholder="Tópicos ministrados, lição de casa..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full animate-pulse"
                  isLoading={savingContent}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Registrar Aula
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <Card className="stripe-card md:col-span-2">
            <CardContent className="p-6">
              <h2 className="text-sm font-bold text-foreground mb-4">Registro Diário de Aulas</h2>
              {contentList.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-12">
                  Nenhuma aula registrada nesta turma.
                </p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {contentList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-border bg-secondary/10 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
                        <Badge variant="outline">{item.date}</Badge>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── 3. Activities Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'activities' && (
        <Card className="stripe-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-foreground">Grade de Avaliações</h2>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsActivityModalOpen(true)}
                size="sm"
              >
                Nova Atividade
              </Button>
            </div>

            {activityList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-12">
                Nenhuma atividade cadastrada para esta turma.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Data de Aplicação</TableHead>
                    <TableHead>Nota Máxima</TableHead>
                    <TableHead>Notas Lançadas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityList.map((act) => (
                    <TableRow key={act.id} className="group">
                      <TableCell className="font-semibold text-foreground">{act.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{act.date}</Badge>
                      </TableCell>
                      <TableCell>{act.maxGrade.toFixed(1)} / 10</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            act.grades.length === classDetail.students.length
                              ? 'success'
                              : 'outline'
                          }
                        >
                          {act.grades.length} / {classDetail.students.length} alunos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            leftIcon={<Edit2 className="h-3 w-3" />}
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => openGradesModal(act)}
                          >
                            Digitar Notas
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDeleteActivity(act.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── 4. Consolidated Report Card Tab ─────────────────────────────────────── */}
      {activeTab === 'grades' && (
        <Card className="stripe-card">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-foreground mb-4">
              Boletim Escolar Consolidado - Bimestres & Situação
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudante</TableHead>
                  <TableHead>1º Bim</TableHead>
                  <TableHead>2º Bim</TableHead>
                  <TableHead>3º Bim</TableHead>
                  <TableHead>4º Bim</TableHead>
                  <TableHead>Média Anual</TableHead>
                  <TableHead>Recuperação</TableHead>
                  <TableHead>Média Final</TableHead>
                  <TableHead>Faltas</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classDetail.students.map((st) => {
                  const name = `${st.user.profile?.firstName || ''} ${st.user.profile?.lastName || ''}`;
                  const rc = reportCards.find(
                    (r) => r.studentId === st.id && r.subject === selectedSubject
                  );

                  return (
                    <TableRow key={st.id}>
                      <TableCell className="font-semibold text-foreground">{name}</TableCell>
                      <TableCell className="font-semibold">
                        {rc?.bimester1 !== null && rc?.bimester1 !== undefined
                          ? rc.bimester1.toFixed(1)
                          : '—'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {rc?.bimester2 !== null && rc?.bimester2 !== undefined
                          ? rc.bimester2.toFixed(1)
                          : '—'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {rc?.bimester3 !== null && rc?.bimester3 !== undefined
                          ? rc.bimester3.toFixed(1)
                          : '—'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {rc?.bimester4 !== null && rc?.bimester4 !== undefined
                          ? rc.bimester4.toFixed(1)
                          : '—'}
                      </TableCell>
                      <TableCell className="font-bold text-foreground">
                        {rc?.finalAverage !== null &&
                        rc?.finalAverage !== undefined &&
                        !rc?.remedialGrade
                          ? rc.finalAverage.toFixed(1)
                          : '—'}
                      </TableCell>
                      <TableCell className="font-semibold text-amber-600">
                        {rc?.remedialGrade !== null && rc?.remedialGrade !== undefined
                          ? rc.remedialGrade.toFixed(1)
                          : '—'}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {rc?.finalAverage !== null &&
                        rc?.finalAverage !== undefined &&
                        rc?.remedialGrade
                          ? rc.finalAverage.toFixed(1)
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rc?.absences && rc.absences >= 10 ? 'destructive' : 'outline'}
                        >
                          {rc?.absences || 0} faltas
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rc?.status ? (
                          getStatusBadge(rc.status)
                        ) : (
                          <Badge variant="outline">Cursando</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openAveragesModal(st)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Create Activity Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Nova Atividade Avaliativa"
        size="sm"
      >
        <form onSubmit={handleSaveActivity} className="space-y-4">
          <Input
            label="Título da Avaliação *"
            value={actTitle}
            onChange={(e) => setActTitle(e.target.value)}
            placeholder="Ex: Trabalho Semestral, Prova 2"
            required
          />
          <Input
            label="Nota Máxima"
            type="number"
            step="0.1"
            value={actMaxGrade}
            onChange={(e) => setActMaxGrade(e.target.value)}
          />
          <Input
            label="Data de Aplicação *"
            type="date"
            value={actDate}
            onChange={(e) => setActDate(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsActivityModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={savingActivity}>
              Salvar Atividade
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Launch Grades Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isGradesModalOpen}
        onClose={() => setIsGradesModalOpen(false)}
        title={selectedActivity ? `Lançar Notas: ${selectedActivity.title}` : 'Lançar Notas'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Lançamento de notas para os alunos desta turma. Valor máximo:{' '}
            {selectedActivity?.maxGrade.toFixed(1)}.
          </p>

          <div className="max-h-[300px] overflow-y-auto border border-border rounded-lg p-2 space-y-2 bg-secondary/15">
            {classDetail.students.map((st) => {
              const name = `${st.user.profile?.firstName || ''} ${st.user.profile?.lastName || ''}`;
              return (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background border border-border"
                >
                  <span className="text-xs font-semibold text-foreground">{name}</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={selectedActivity?.maxGrade}
                    value={gradesInput[st.id] || ''}
                    onChange={(e) =>
                      setGradesInput((prev) => ({
                        ...prev,
                        [st.id]: e.target.value,
                      }))
                    }
                    className="w-20 h-9 rounded-lg border border-border bg-background px-3 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="0.0"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsGradesModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGrades} isLoading={savingGrades}>
              Confirmar Notas
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Launch Averages/Bimesters Modal ────────────────────────────────────── */}
      <Modal
        isOpen={isAveragesModalOpen}
        onClose={() => setIsAveragesModalOpen(false)}
        title={
          selectedStudentForAvg
            ? `Lançar Boletim: ${selectedStudentForAvg.user.profile?.firstName} ${selectedStudentForAvg.user.profile?.lastName}`
            : 'Lançar Boletim'
        }
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Lançamento direto de médias bimestrais e recuperação para a disciplina **
            {selectedSubject}**.
          </p>

          <div className="grid grid-cols-2 gap-3 bg-secondary/15 p-4 rounded-xl border border-border">
            <Input
              label="1º Bimestre"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={b1}
              onChange={(e) => setB1(e.target.value)}
              placeholder="—"
            />
            <Input
              label="2º Bimestre"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={b2}
              onChange={(e) => setB2(e.target.value)}
              placeholder="—"
            />
            <Input
              label="3º Bimestre"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={b3}
              onChange={(e) => setB3(e.target.value)}
              placeholder="—"
            />
            <Input
              label="4º Bimestre"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={b4}
              onChange={(e) => setB4(e.target.value)}
              placeholder="—"
            />
            <div className="col-span-2 pt-2 border-t border-border">
              <Input
                label="Nota da Recuperação (Rec)"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={recVal}
                onChange={(e) => setRecVal(e.target.value)}
                placeholder="Disponível caso média anual seja < 6.0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAveragesModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAverages} isLoading={savingAverage}>
              Confirmar Boletim
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ClassDiaryPage;
