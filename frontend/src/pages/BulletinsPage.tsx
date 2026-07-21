import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  User,
  GraduationCap,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Printer,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import StudentDetailsDrawer from '../components/layout/StudentDetailsDrawer';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
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

interface StudentShort {
  id: string;
  userId: string;
  classId: string | null;
  class?: {
    name: string;
  } | null;
  user: {
    email: string;
    profile: Profile | null;
  };
}

interface ReportCardListItem {
  id: string;
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
  student: StudentShort;
}

export const BulletinsPage: React.FC = () => {
  const { addToast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [reportCards, setReportCards] = useState<ReportCardListItem[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Linked students dropdown (useful if guardian has multiple children)
  const [children, setChildren] = useState<StudentShort[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');

  // Class and Student selection (useful if user is TEACHER, ADMIN, DIRETOR, or STAFF)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [classesList, setClassesList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // ── Fetch Operations ────────────────────────────────────────────────────────
  const fetchReportCards = useCallback(
    async (studentId?: string) => {
      // If administrative or teacher and no studentId is passed, do not execute
      if (user && ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'].includes(user.role) && !studentId) {
        return;
      }
      setLoading(true);
      try {
        const params: Record<string, string> = { schoolYear: '2026' };
        if (studentId) {
          params.studentId = studentId;
        }

        const res = await api.get('/academic/report-cards', { params });
        setReportCards(res.data.data);
      } catch {
        addToast({ type: 'error', message: 'Erro ao carregar dados do boletim.' });
      } finally {
        setLoading(false);
      }
    },
    [addToast, user]
  );

  const fetchChildren = useCallback(async () => {
    try {
      // If user is GUARDIAN, retrieve their list of linked children
      if (user?.role === 'GUARDIAN') {
        const res = await api.get('/guardians', { params: { limit: '100' } });
        // Find current guardian record that matches user's email
        interface StudentRelation {
          student: StudentShort;
        }
        interface GuardianItem {
          user: { email: string };
          students: StudentRelation[];
        }
        const list = res.data.data.guardians;
        const currentG = (list as GuardianItem[]).find((g) => g.user?.email === user.email);

        if (currentG && currentG.students) {
          const mappedChildren = currentG.students.map((stRel) => stRel.student);
          setChildren(mappedChildren);
          if (mappedChildren.length > 0) {
            setSelectedChildId(mappedChildren[0].id);
            fetchReportCards(mappedChildren[0].id);
            return;
          }
        }
      } else if (user && ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'].includes(user.role)) {
        // Load classes first
        const endpoint = user.role === 'TEACHER' ? '/portal/teacher/classes' : '/classes';
        const res = await api.get(endpoint);
        const classesData = res.data.data;
        setClassesList(classesData);

        if (classesData.length > 0) {
          const firstClass = classesData[0];
          setSelectedClassId(firstClass.id);

          const students = firstClass.students || [];
          setStudentsList(students);

          if (students.length > 0) {
            const firstStudent = students[0];
            setSelectedStudentId(firstStudent.id);
            fetchReportCards(firstStudent.id);
            return;
          }
        }
        // If no classes or students, clear reportCards and don't fetch
        setReportCards([]);
        return;
      }
      // If student or other roles, just call fetch without studentId filtering
      fetchReportCards();
    } catch {
      fetchReportCards();
    }
  }, [user, fetchReportCards]);

  useEffect(() => {
    fetchChildren();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedChildId(val);
    fetchReportCards(val);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClassId(classId);

    const matchedClass = classesList.find((c) => c.id === classId);
    const students = matchedClass?.students || [];
    setStudentsList(students);

    if (students.length > 0) {
      const studentId = students[0].id;
      setSelectedStudentId(studentId);
      fetchReportCards(studentId);
    } else {
      setSelectedStudentId('');
      setReportCards([]);
    }
  };

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value;
    setSelectedStudentId(studentId);
    fetchReportCards(studentId);
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

  const handlePrint = () => {
    window.print();
  };

  // Student header info to show
  const activeStudent =
    reportCards.length > 0
      ? reportCards[0].student
      : user?.role === 'GUARDIAN'
        ? children.find((c) => c.id === selectedChildId)
        : studentsList.find((s) => s.id === selectedStudentId);

  const studentName = activeStudent?.name
    ? activeStudent.name
    : activeStudent?.user?.profile
      ? `${activeStudent.user.profile.firstName} ${activeStudent.user.profile.lastName}`
      : activeStudent?.user?.email ||
        (user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Estudante');

  const className =
    activeStudent?.class?.name ||
    classesList.find((c) => c.id === selectedClassId)?.name ||
    'Não enturmado';

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-foreground">
            Boletim de Notas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Notas por bimestre, médias consolidadas, faltas acumuladas e situação.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'GUARDIAN' && children.length > 1 && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                Filho:
              </span>
              <select
                value={selectedChildId}
                onChange={handleChildChange}
                className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {children.map((child) => {
                  const name = child.user.profile
                    ? `${child.user.profile.firstName} ${child.user.profile.lastName}`
                    : child.user.email;
                  return (
                    <option key={child.id} value={child.id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {user &&
            ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'].includes(user.role) &&
            classesList.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 mr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                    Turma:
                  </span>
                  <select
                    value={selectedClassId}
                    onChange={handleClassChange}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {classesList.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                    Estudante:
                  </span>
                  <select
                    value={selectedStudentId}
                    onChange={handleStudentChange}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {studentsList.length === 0 ? (
                      <option value="">Sem estudantes</option>
                    ) : (
                      studentsList.map((st) => {
                        const name = st.name
                          ? st.name
                          : st.user?.profile
                            ? `${st.user.profile.firstName} ${st.user.profile.lastName}`
                            : st.user?.email || st.email || 'Estudante';
                        return (
                          <option key={st.id} value={st.id}>
                            {name}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>
            )}
          <Button
            leftIcon={<Printer className="h-4 w-4" />}
            variant="outline"
            onClick={handlePrint}
          >
            Imprimir
          </Button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block border-b-2 border-primary pb-4 mb-4">
        <h1 className="text-xl font-extrabold text-foreground">Boletim Escolar Oficial</h1>
        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
          <div>
            <strong>Aluno:</strong> {studentName}
          </div>
          <div>
            <strong>Turma:</strong> {className}
          </div>
          <div>
            <strong>Ano Letivo:</strong> 2026
          </div>
          <div>
            <strong>Instituição:</strong> Zx-Escola
          </div>
        </div>
      </div>

      {/* Profile Info Summary Card */}
      <Card className="stripe-card print:hidden">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                if (activeStudent?.id) {
                  setIsDetailsOpen(true);
                }
              }}
              className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 hover:bg-primary/20 hover:scale-105 transition-all cursor-pointer"
              title="Visualizar ficha completa do aluno"
            >
              <User className="h-5 w-5" />
            </button>
            <div>
              <div className="text-sm font-extrabold text-foreground">{studentName}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Turma: {className}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-foreground bg-secondary/30 px-3 py-1.5 rounded-lg border border-border">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Ano Letivo: <strong>2026</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table Bulletin Card */}
      <Card className="stripe-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          ) : reportCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 opacity-20 mb-3" />
              <p className="font-semibold">Nenhuma nota ou frequência lançada</p>
              <p className="text-sm mt-1">Aguardando digitação dos professores.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>1º Bim</TableHead>
                  <TableHead>2º Bim</TableHead>
                  <TableHead>3º Bim</TableHead>
                  <TableHead>4º Bim</TableHead>
                  <TableHead>Média Anual</TableHead>
                  <TableHead>Recuperação</TableHead>
                  <TableHead>Média Final</TableHead>
                  <TableHead>Faltas</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportCards.map((rc) => (
                  <TableRow key={rc.id}>
                    <TableCell className="font-bold text-foreground">{rc.subject}</TableCell>
                    <TableCell>
                      {rc.bimester1 !== null && rc.bimester1 !== undefined
                        ? rc.bimester1.toFixed(1)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {rc.bimester2 !== null && rc.bimester2 !== undefined
                        ? rc.bimester2.toFixed(1)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {rc.bimester3 !== null && rc.bimester3 !== undefined
                        ? rc.bimester3.toFixed(1)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {rc.bimester4 !== null && rc.bimester4 !== undefined
                        ? rc.bimester4.toFixed(1)
                        : '—'}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {rc.finalAverage !== null &&
                      rc.finalAverage !== undefined &&
                      !rc.remedialGrade
                        ? rc.finalAverage.toFixed(1)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-amber-600 font-semibold">
                      {rc.remedialGrade !== null && rc.remedialGrade !== undefined
                        ? rc.remedialGrade.toFixed(1)
                        : '—'}
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      {rc.finalAverage !== null && rc.finalAverage !== undefined && rc.remedialGrade
                        ? rc.finalAverage.toFixed(1)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rc.absences >= 10 ? 'destructive' : 'outline'}>
                        {rc.absences} faltas
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(rc.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Warning/Info Footer */}
      <Card className="stripe-card border-l-4 border-l-amber-500 bg-amber-500/5 print:hidden">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-foreground space-y-1">
            <div className="font-bold text-amber-800">Instruções Acadêmicas</div>
            <p className="leading-relaxed text-muted-foreground">
              A média mínima para aprovação direta em cada disciplina é **6.0**. Caso o aluno atinja
              uma média anual inferior a 6.0, deverá realizar o exame de recuperação. O limite de
              faltas acumuladas permitido por ano para não reprovar por frequência é **20 faltas**.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Student Details Drawer */}
      {activeStudent?.id && (
        <StudentDetailsDrawer
          studentId={activeStudent.id}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}
    </div>
  );
};
export default BulletinsPage;
