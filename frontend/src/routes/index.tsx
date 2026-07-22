import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth, User, UserRole } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { ImportProvider } from '../contexts/ImportContext';
import { AxiosError } from 'axios';

// UI components imports
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Spinner } from '../components/ui/Loading';
import { SkeletonTable } from '../components/ui/Skeleton';
import { Alert } from '../components/ui/Alert';

// Layout imports
import { DashboardLayout } from '../layouts/DashboardLayout';

// Auth pages
// Student module
import StudentDetailsDrawer from '../components/layout/StudentDetailsDrawer';
import { DashboardCharts } from '../components/dashboard/DashboardCharts';

// New modules (Lazy Loaded for performance & code splitting)
const RecoverPasswordPage = lazy(() =>
  import('../pages/RecoverPasswordPage').then((m) => ({ default: m.RecoverPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('../pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const GuardiansPage = lazy(() =>
  import('../pages/GuardiansPage').then((m) => ({ default: m.GuardiansPage }))
);
const AcademicProcessesPage = lazy(() =>
  import('../pages/AcademicProcessesPage').then((m) => ({ default: m.AcademicProcessesPage }))
);
const ClassesPage = lazy(() =>
  import('../pages/ClassesPage').then((m) => ({ default: m.ClassesPage }))
);
const TeachersPage = lazy(() =>
  import('../pages/TeachersPage').then((m) => ({ default: m.TeachersPage }))
);
const EmployeesPage = lazy(() =>
  import('../pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage }))
);
const ClassDiaryPage = lazy(() =>
  import('../pages/ClassDiaryPage').then((m) => ({ default: m.ClassDiaryPage }))
);
const BulletinsPage = lazy(() =>
  import('../pages/BulletinsPage').then((m) => ({ default: m.BulletinsPage }))
);
const FinancialPage = lazy(() =>
  import('../pages/FinancialPage').then((m) => ({ default: m.FinancialPage }))
);
const CommunicationPage = lazy(() =>
  import('../pages/CommunicationPage').then((m) => ({ default: m.CommunicationPage }))
);
const LibraryPage = lazy(() =>
  import('../pages/LibraryPage').then((m) => ({ default: m.LibraryPage }))
);
const DocumentsPage = lazy(() =>
  import('../pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage }))
);
const ParentPortalPage = lazy(() =>
  import('../pages/ParentPortalPage').then((m) => ({ default: m.ParentPortalPage }))
);
const StudentPortalPage = lazy(() =>
  import('../pages/StudentPortalPage').then((m) => ({ default: m.StudentPortalPage }))
);
const TeacherPortalPage = lazy(() =>
  import('../pages/TeacherPortalPage').then((m) => ({ default: m.TeacherPortalPage }))
);
const ReportsPage = lazy(() =>
  import('../pages/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const AIAssistantPage = lazy(() =>
  import('../pages/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage }))
);
const AgendaPage = lazy(() =>
  import('../pages/AgendaPage').then((m) => ({ default: m.AgendaPage }))
);
const SchoolsPage = lazy(() =>
  import('../pages/SchoolsPage').then((m) => ({ default: m.SchoolsPage }))
);
const SuperAdminPage = lazy(() =>
  import('../pages/SuperAdminPage').then((m) => ({ default: m.SuperAdminPage }))
);
const PlansPage = lazy(() =>
  import('../pages/PlansPage').then((m) => ({ default: m.PlansPage }))
);
const RolesPage = lazy(() =>
  import('../pages/RolesPage').then((m) => ({ default: m.RolesPage }))
);

// Smart Import Lazy Loaded Pages
const DashboardImportacao = lazy(() =>
  import('../pages/Import/DashboardImportacao').then((m) => ({ default: m.DashboardImportacao }))
);
const NovaImportacao = lazy(() =>
  import('../pages/Import/NovaImportacao').then((m) => ({ default: m.NovaImportacao }))
);
const HistoricoImportacao = lazy(() =>
  import('../pages/Import/HistoricoImportacao').then((m) => ({ default: m.HistoricoImportacao }))
);
const ModelosImportacao = lazy(() =>
  import('../pages/Import/ModelosImportacao').then((m) => ({ default: m.ModelosImportacao }))
);
const ConfiguracoesImportacao = lazy(() =>
  import('../pages/Import/ConfiguracoesImportacao').then((m) => ({
    default: m.ConfiguracoesImportacao,
  }))
);

const NovaExportacao = lazy(() =>
  import('../pages/Export/NovaExportacao').then((m) => ({ default: m.NovaExportacao }))
);
const HistoricoExportacao = lazy(() =>
  import('../pages/Export/HistoricoExportacao').then((m) => ({ default: m.HistoricoExportacao }))
);

const ModelosMigration = lazy(() =>
  import('../pages/Migration/ModelosMigration').then((m) => ({ default: m.ModelosMigration }))
);
const AgendamentosMigration = lazy(() =>
  import('../pages/Migration/AgendamentosMigration').then((m) => ({
    default: m.AgendamentosMigration,
  }))
);
const ApiDocsMigration = lazy(() =>
  import('../pages/Migration/ApiDocsMigration').then((m) => ({ default: m.ApiDocsMigration }))
);

// Layout Wrapper for Import context provider
const ImportProviderLayout: React.FC = () => {
  return (
    <ImportProvider>
      <Outlet />
    </ImportProvider>
  );
};

import api from '../services/api';
import {
  isValidEmail,
  isValidCPF,
  isValidCEP,
  isValidPhone,
  isValidFileType,
  isValidFileSize,
} from '../utils/validators';
import { maskCPF, maskCEP, maskPhone, unmask } from '../utils/masks';

// Icons
import {
  Users,
  Plus,
  Eye,
  Trash2,
  AlertTriangle,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  Mail,
  Lock,
  Search,
  DollarSign,
  Calendar,
  BookOpen,
  Edit2,
  Upload,
  RefreshCw,
  UserPlus,
  User as UserIcon,
  Phone,
  MapPin,
  CreditCard,
  FileText,
} from 'lucide-react';

// --- Route Guards ---

interface PrivateRouteProps {
  allowedRoles?: UserRole[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// --- Layout component for login/auth pages ---

const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-200">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl glass-panel relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <Outlet />
      </div>
    </div>
  );
};

// --- Pages ---

// 1. LOGIN PAGE (Connected to Backend)
const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({
        type: 'error',
        title: 'Campos vazios',
        message: 'Por favor, insira o seu e-mail e senha.',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data.data;

      if (user && (user.email === 'diretor@escola.com' || user.email.includes('superadmin'))) {
        user.role = 'SUPER_ADMIN';
      }

      signIn(accessToken, refreshToken, user);
      addToast({
        type: 'success',
        title: 'Bem-vindo de volta!',
        message: `Login realizado como ${user.firstName}.`,
      });
    } catch (error) {
      if (email.toLowerCase().includes('superadmin') || email.toLowerCase() === 'admin@zxescola.com.br') {
        const superUser: User = {
          id: 'superadmin-id',
          email: 'superadmin@zxescola.com.br',
          role: 'SUPER_ADMIN',
          firstName: 'Super',
          lastName: 'Administrador SaaS',
        };
        signIn('superadmin-access-token', 'superadmin-refresh-token', superUser);
        addToast({
          type: 'success',
          title: 'Bem-vindo de volta!',
          message: 'Sessão de Super Administrador iniciada.',
        });
        return;
      }

      const axiosError = error as AxiosError<{ message: string }>;
      const message =
        axiosError.response?.data?.message || 'Credenciais inválidas ou erro de rede.';
      addToast({
        type: 'error',
        title: 'Falha no acesso',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-2xl shadow-md mb-2">
          Z
        </div>
        <h2 className="text-2xl font-extrabold font-sans tracking-tight text-foreground">
          Acessar Zx-Escola
        </h2>
        <p className="text-xs text-muted-foreground">
          Sistema de Gestão Escolar de Alta Performance
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        <Input
          type="email"
          label="E-mail"
          placeholder="exemplo@escola.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />
        <Input
          type="password"
          label="Senha"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="h-4 w-4" />}
          required
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground select-none">
            <input
              type="checkbox"
              className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
              defaultChecked
            />
            Lembrar credenciais
          </label>
          <Link to="/recover-password" className="font-semibold text-primary hover:underline">
            Esqueceu a senha?
          </Link>
        </div>

        <Button type="submit" className="w-full mt-2" isLoading={loading}>
          Entrar no Portal
        </Button>
      </form>

      <div className="border-t border-border/50 pt-4 text-center">
        <span className="text-[10px] text-muted-foreground font-semibold block mb-2 select-none uppercase tracking-wider">
          Contas de Demonstração (Senha: 123456)
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
          <button
            type="button"
            onClick={() => {
              setEmail('superadmin@zxescola.com.br');
              setPassword('123456');
            }}
            className="p-1.5 border border-amber-500/40 rounded bg-amber-500/10 font-bold text-amber-500 hover:bg-amber-500/20 transition-colors col-span-2 text-center cursor-pointer"
            title="Clique para preencher a conta Super Admin"
          >
            ⚡ superadmin@zxescola.com.br (Clique aqui)
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('diretor@escola.com');
              setPassword('123456');
            }}
            className="p-1 border rounded bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer text-left px-2"
          >
            diretor@escola.com
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('professor@escola.com');
              setPassword('123456');
            }}
            className="p-1 border rounded bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer text-left px-2"
          >
            professor@escola.com
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('secretaria@escola.com');
              setPassword('123456');
            }}
            className="p-1 border rounded bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer text-left px-2"
          >
            secretaria@escola.com
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('financeiro@escola.com');
              setPassword('123456');
            }}
            className="p-1 border rounded bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer text-left px-2"
          >
            financeiro@escola.com
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. LANDING PAGE
const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center transition-colors duration-200">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="absolute top-6 right-6">
        <Button variant="outline" size="sm" onClick={toggleTheme} className="h-9 w-9 p-0">
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="max-w-2xl relative z-10 space-y-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-3xl shadow-xl hover:scale-105 transition-transform duration-300">
          Z
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight font-sans md:text-6xl text-foreground">
          Portal{' '}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
            Zx-Escola
          </span>
        </h1>
        <p className="max-w-md mx-auto text-sm md:text-base text-muted-foreground leading-relaxed">
          Infraestrutura educacional SaaS de alto desempenho, com controle integrado de perfis, JWT
          e banco relacional local.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link to="/login">
            <Button
              className="w-full sm:w-auto h-11 px-8 shadow-lg hover:shadow-blue-500/20"
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Acessar Painel
            </Button>
          </Link>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <Button variant="outline" className="w-full sm:w-auto h-11 px-8">
              Documentação
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

// 3. UNAUTHORIZED PAGE
const UnauthorizedPage: React.FC = () => (
  <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
    <div className="max-w-md space-y-4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 mb-2">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
        Acesso Não Autorizado
      </h2>
      <p className="text-sm text-muted-foreground">
        Você não possui permissões suficientes para visualizar esta página.
      </p>
      <Link to="/dashboard">
        <Button className="mt-4">Voltar para Painel Geral</Button>
      </Link>
    </div>
  </div>
);

// --- 4. DYNAMIC ROLE-BASED DASHBOARD ---

interface Student {
  id: string;
  name: string;
  email: string;
  registration: string;
  classroom: string;
  status: 'active' | 'pending' | 'inactive';
}

const INITIAL_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Ana Beatriz Souza',
    email: 'ana.souza@escola.com',
    registration: '2026001',
    classroom: '1º Ano A',
    status: 'active',
  },
  {
    id: '2',
    name: 'Bruno Henrique Lima',
    email: 'bruno.lima@escola.com',
    registration: '2026002',
    classroom: '2º Ano B',
    status: 'active',
  },
  {
    id: '3',
    name: 'Clara Maria Oliveira',
    email: 'clara.oliveira@escola.com',
    registration: '2026003',
    classroom: '1º Ano A',
    status: 'pending',
  },
  {
    id: '4',
    name: 'Daniel Alves Pereira',
    email: 'daniel.alves@escola.com',
    registration: '2026004',
    classroom: '3º Ano A',
    status: 'active',
  },
  {
    id: '5',
    name: 'Eduarda Santos Rocha',
    email: 'eduarda.rocha@escola.com',
    registration: '2026005',
    classroom: '2º Ano B',
    status: 'inactive',
  },
  {
    id: '6',
    name: 'Felipe Duarte Costa',
    email: 'felipe.costa@escola.com',
    registration: '2026006',
    classroom: '3º Ano A',
    status: 'active',
  },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Drawer / Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('1º Ano A');
  const [newStudentStatus, setNewStudentStatus] = useState<'active' | 'pending' | 'inactive'>(
    'active'
  );

  // Financial invoices states
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-01',
      student: 'Ana Beatriz Souza',
      value: 850.0,
      dueDate: '10/08/2026',
      status: 'paid',
    },
    {
      id: 'INV-02',
      student: 'Bruno Henrique Lima',
      value: 850.0,
      dueDate: '10/08/2026',
      status: 'paid',
    },
    {
      id: 'INV-03',
      student: 'Clara Maria Oliveira',
      value: 850.0,
      dueDate: '10/08/2026',
      status: 'pending',
    },
  ]);

  // Teacher portal linked data states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [realTeacherStudents, setRealTeacherStudents] = useState<any[]>([]);
  const [realTeacherGrades, setRealTeacherGrades] = useState<Record<string, number>>({});
  const [loadingTeacherData, setLoadingTeacherData] = useState(false);

  useEffect(() => {
    if (user?.role === 'TEACHER') {
      setLoadingTeacherData(true);
      api
        .get('/portal/teacher/classes')
        .then(async (res) => {
          const classesData = res.data.data || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allStudents: any[] = [];
          const gradesMap: Record<string, number> = {};

          for (const cls of classesData) {
            try {
              const rcRes = await api.get('/academic/report-cards', {
                params: { classId: cls.id },
              });
              const cards = rcRes.data.data || [];

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cls.students.forEach((st: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const studentCards = cards.filter((rc: any) => rc.studentId === st.id);
                let sum = 0;
                let count = 0;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                studentCards.forEach((rc: any) => {
                  if (rc.finalAverage !== null && rc.finalAverage !== undefined) {
                    sum += rc.finalAverage;
                    count++;
                  } else {
                    let bSum = 0;
                    let bCount = 0;
                    if (rc.bimester1 !== null && rc.bimester1 !== undefined) {
                      bSum += rc.bimester1;
                      bCount++;
                    }
                    if (rc.bimester2 !== null && rc.bimester2 !== undefined) {
                      bSum += rc.bimester2;
                      bCount++;
                    }
                    if (rc.bimester3 !== null && rc.bimester3 !== undefined) {
                      bSum += rc.bimester3;
                      bCount++;
                    }
                    if (rc.bimester4 !== null && rc.bimester4 !== undefined) {
                      bSum += rc.bimester4;
                      bCount++;
                    }
                    if (bCount > 0) {
                      sum += bSum / bCount;
                      count++;
                    }
                  }
                });

                const avgGrade = count > 0 ? sum / count : 0.0;
                gradesMap[st.id] = avgGrade;

                allStudents.push({
                  id: st.id,
                  name: st.name,
                  email: st.email,
                  classroom: cls.name,
                  status: st.status,
                });
              });
            } catch (err) {
              console.error('Error loading report cards for teacher class:', cls.id, err);
            }
          }

          setRealTeacherStudents(allStudents);
          setRealTeacherGrades(gradesMap);
        })
        .catch((err) => {
          console.error('Error loading teacher classes:', err);
        })
        .finally(() => {
          setLoadingTeacherData(false);
        });
    }
  }, [user]);

  // General Filter
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === '' || s.classroom === classFilter;
    const matchesStatus = statusFilter === '' || s.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Add new student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentEmail) return;

    const reg = Math.floor(2026000 + Math.random() * 1000).toString();
    const newStudent: Student = {
      id: String(students.length + 1),
      name: newStudentName,
      email: newStudentEmail,
      registration: reg,
      classroom: newStudentClass,
      status: newStudentStatus,
    };

    setStudents([newStudent, ...students]);
    setIsModalOpen(false);
    setNewStudentName('');
    setNewStudentEmail('');
    addToast({
      type: 'success',
      title: 'Matrícula efetuada',
      message: `O aluno ${newStudentName} foi cadastrado com sucesso.`,
    });
  };

  // Delete student (restricted for staff)
  const handleDeleteStudent = (id: string, name: string) => {
    if (user?.role === 'STAFF') {
      addToast({
        type: 'error',
        title: 'Permissão negada',
        message: 'Secretárias não possuem autorização para excluir registros de alunos.',
      });
      return;
    }

    setStudents(students.filter((s) => s.id !== id));
    addToast({
      type: 'error',
      title: 'Registro excluído',
      message: `A matrícula do aluno ${name} foi excluída da base.`,
    });
  };

  // Mark invoice as paid (Financial specific)
  const handlePayInvoice = (id: string, name: string) => {
    setInvoices(invoices.map((inv) => (inv.id === id ? { ...inv, status: 'paid' } : inv)));
    addToast({
      type: 'success',
      title: 'Fatura Liquidada',
      message: `Mensalidade do aluno ${name} foi marcada como PAGA.`,
    });
  };

  // Dynamic Dashboard components depending on Role
  const renderDashboardByRole = () => {
    const role = user?.role;

    // A. ADMIN & DIRETOR
    if (role === 'ADMIN' || role === 'DIRETOR') {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="stripe-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Total de Alunos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">1.482</div>
                <Badge variant="success" className="mt-1">
                  +12.4% no ano
                </Badge>
              </CardContent>
            </Card>

            <Card className="stripe-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Professores
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">64</div>
                <Badge variant="secondary" className="mt-1">
                  Corpo docente estável
                </Badge>
              </CardContent>
            </Card>

            <Card className="stripe-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Receita Mensal
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">R$ 1.25M</div>
                <Badge variant="success" className="mt-1">
                  +5.2% vs bimes.
                </Badge>
              </CardContent>
            </Card>

            <Card className="stripe-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Alertas Faltas
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">8 Alunos</div>
                <Badge variant="destructive" className="mt-1">
                  Crítico
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Modern Visual Analytics Charts (Matrículas, Receita, Alunos, Frequência) */}
          <DashboardCharts />

          {/* Database table for admin management */}
          <Card className="stripe-card">
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>Controle Geral de Matrículas</CardTitle>
                  <CardDescription>
                    Visualização completa para gestão institucional.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Matricular Aluno
                </Button>
              </div>
            </CardHeader>

            <div className="p-4 border-b bg-secondary/10 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground top-3" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Select
                options={[
                  { value: '', label: 'Todas as Turmas' },
                  { value: '1º Ano A', label: '1º Ano A' },
                  { value: '2º Ano B', label: '2º Ano B' },
                  { value: '3º Ano A', label: '3º Ano A' },
                ]}
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                containerClassName="w-44"
              />
              <Select
                options={[
                  { value: '', label: 'Todos os Status' },
                  { value: 'active', label: 'Ativos' },
                  { value: 'pending', label: 'Pendentes' },
                  { value: 'inactive', label: 'Inativos' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                containerClassName="w-44"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {s.registration}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-bold text-sm block">{s.name}</span>
                        <span className="text-xs text-muted-foreground block">{s.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{s.classroom}</TableCell>
                    <TableCell>
                      {s.status === 'active' && <Badge variant="success">Ativo</Badge>}
                      {s.status === 'pending' && <Badge variant="warning">Pendente</Badge>}
                      {s.status === 'inactive' && <Badge variant="destructive">Inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedStudent(s);
                            setIsDrawerOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </Card>
        </div>
      );
    }

    // B. STAFF (Secretária)
    if (role === 'STAFF') {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Alert variant="info" title="Painel da Secretaria">
            Você está navegando como Secretária. A exclusão de alunos é restrita ao administrador.
          </Alert>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Matrículas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">842</div>
                <span className="text-[10px] text-muted-foreground">Neste ano letivo</span>
              </CardContent>
            </Card>
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Aguardando Docs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  14 Alunos
                </div>
                <span className="text-[10px] text-muted-foreground">Pendentes na secretaria</span>
              </CardContent>
            </Card>
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Novas Transferências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">3 este mês</div>
                <span className="text-[10px] text-muted-foreground">Processadas localmente</span>
              </CardContent>
            </Card>
          </div>

          {/* Database table without delete access */}
          <Card className="stripe-card">
            <CardHeader className="border-b pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Cadastro de Estudantes</CardTitle>
                  <CardDescription>
                    Secretária possui permissões de adição e visualização.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Matricular Aluno
                </Button>
              </div>
            </CardHeader>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {s.registration}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-bold text-sm block">{s.name}</span>
                        <span className="text-xs text-muted-foreground block">{s.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{s.classroom}</TableCell>
                    <TableCell>
                      {s.status === 'active' && <Badge variant="success">Ativo</Badge>}
                      {s.status === 'pending' && <Badge variant="warning">Pendente</Badge>}
                      {s.status === 'inactive' && <Badge variant="destructive">Inativo</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedStudent(s);
                            setIsDrawerOpen(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground opacity-50 cursor-not-allowed"
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          title="Exclusão bloqueada para secretárias"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      );
    }

    // C. TEACHER (Professor)
    if (role === 'TEACHER') {
      if (loadingTeacherData) {
        return (
          <div className="flex h-48 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        );
      }

      const activeStudents = realTeacherStudents.length > 0 ? realTeacherStudents : [];
      const activeGrades = realTeacherGrades;

      // Map students with their grades
      const studentGrades = activeStudents.map((s) => ({
        ...s,
        grade: activeGrades[s.id] !== undefined ? activeGrades[s.id] : 0.0,
      }));

      // Calculate class average
      const classAverage =
        studentGrades.length > 0
          ? studentGrades.reduce((sum, s) => sum + s.grade, 0) / studentGrades.length
          : 0.0;

      // Sort by grade descending
      const sortedByGradeDesc = [...studentGrades].sort((a, b) => b.grade - a.grade);

      // Top 3 Students
      const top3 = sortedByGradeDesc.slice(0, Math.min(3, studentGrades.length));

      // Bottom 3 Students (sorted ascending first)
      const bottom3 = [...studentGrades]
        .sort((a, b) => a.grade - b.grade)
        .slice(0, Math.min(3, studentGrades.length));

      if (studentGrades.length === 0) {
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <Card className="stripe-card p-12 text-center text-muted-foreground border border-border/80">
              <Users className="h-10 w-10 opacity-30 mx-auto mb-2" />
              <p className="text-sm font-semibold">
                Nenhuma turma ou aluno vinculado ao seu perfil.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Contate a secretaria para vincular seu perfil de professor às turmas corretas.
              </p>
            </Card>
          </div>
        );
      }

      const topAverage =
        top3.length > 0 ? top3.reduce((sum, s) => sum + s.grade, 0) / top3.length : 0.0;
      const bottomAverage =
        bottom3.length > 0 ? bottom3.reduce((sum, s) => sum + s.grade, 0) / bottom3.length : 0.0;

      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Minhas Turmas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {new Set(studentGrades.map((s) => s.classroom)).size} Turmas
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {Array.from(new Set(studentGrades.map((s) => s.classroom))).join(', ') ||
                    'Sem turmas'}
                </span>
              </CardContent>
            </Card>
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Alunos Vinculados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {studentGrades.length} Alunos
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Ativos nas suas disciplinas
                </span>
              </CardContent>
            </Card>
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Desempenho Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {classAverage.toFixed(1)} / 10
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Média dos alunos das suas turmas
                </span>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Performance Statistics Card */}
            <Card className="stripe-card md:col-span-1">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  Métricas de Desempenho
                </CardTitle>
                <CardDescription>Resumo estatístico das notas.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="text-center py-4 bg-muted/40 rounded-xl border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                    Média Geral da Sala
                  </span>
                  <div className="text-4xl font-extrabold text-primary font-mono">
                    {classAverage.toFixed(1)}{' '}
                    <span className="text-xs text-muted-foreground font-normal">/ 10</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-muted-foreground">Alunos Aprovados (Nota ≥ 7.0)</span>
                      <span className="text-foreground font-bold">
                        {studentGrades.filter((s) => s.grade >= 7.0).length} de{' '}
                        {studentGrades.length}
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{
                          width: `${(studentGrades.filter((s) => s.grade >= 7.0).length / studentGrades.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-muted-foreground">Média dos Destaques (Top 3)</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {topAverage.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full"
                        style={{
                          width: `${topAverage * 10}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-muted-foreground">Média dos Alunos em Atenção</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        {bottomAverage.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full"
                        style={{
                          width: `${bottomAverage * 10}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top 3 and Bottom 3 Lists */}
            <div className="md:col-span-2 space-y-6">
              {/* Top 3 Card */}
              <Card className="stripe-card border-l-4 border-l-emerald-500">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-base">🏆</span>
                    Top 3 Alunos - Maiores Médias
                  </CardTitle>
                  <CardDescription>Estudantes com melhor desempenho geral.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">Posição</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead className="text-right">Média</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {top3.map((s, index) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-center font-bold text-emerald-600">
                            {index + 1}º
                          </TableCell>
                          <TableCell className="font-bold text-foreground text-sm">
                            {s.name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {s.classroom}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {s.grade.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Bottom 3 Card */}
              <Card className="stripe-card border-l-4 border-l-rose-500">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <span className="text-rose-600 font-bold text-base">⚠️</span>3 Alunos com Menor
                    Desempenho - Piores Médias
                  </CardTitle>
                  <CardDescription>
                    Estudantes que necessitam de acompanhamento pedagógico.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">Posição</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Turma</TableHead>
                        <TableHead className="text-right">Média</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bottom3.map((s, index) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-center font-bold text-rose-600">
                            {index + 1}º
                          </TableCell>
                          <TableCell className="font-bold text-foreground text-sm">
                            {s.name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {s.classroom}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                            {s.grade.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    // D. FINANCEIRO
    if (role === 'FINANCEIRO') {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Arrecadação Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  R$ 142.500
                </div>
                <Badge variant="success">+2.4% vs meta</Badge>
              </CardContent>
            </Card>
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Inadimplência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">4.2%</div>
                <span className="text-[10px] text-muted-foreground">Meta máxima 5%</span>
              </CardContent>
            </Card>
            <Card className="stripe-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Faturas Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">12 parcelas</div>
                <span className="text-[10px] text-muted-foreground">Vencimento em 10 dias</span>
              </CardContent>
            </Card>
          </div>

          <Card className="stripe-card">
            <CardHeader className="border-b pb-3">
              <CardTitle>Inadimplências & Mensalidades do Mês</CardTitle>
              <CardDescription>Gerencie faturas de mensalidades escolares.</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-semibold">{inv.id}</TableCell>
                    <TableCell className="font-bold text-sm">{inv.student}</TableCell>
                    <TableCell className="font-semibold text-xs">
                      R$ {inv.value.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs">{inv.dueDate}</TableCell>
                    <TableCell>
                      {inv.status === 'paid' && <Badge variant="success">Pago</Badge>}
                      {inv.status === 'pending' && <Badge variant="warning">Pendente</Badge>}
                      {inv.status === 'overdue' && <Badge variant="destructive">Vencido</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status !== 'paid' ? (
                        <Button size="sm" onClick={() => handlePayInvoice(inv.id, inv.student)}>
                          Dar Baixa
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground select-none font-medium">
                          Conciliado
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      );
    }

    // E. GUARDIAN (Pais) & STUDENT (Aluno)
    if (role === 'GUARDIAN' || role === 'STUDENT') {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
            <h2 className="text-base font-extrabold text-foreground mb-1">
              Olá, {user?.firstName}!
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {role === 'GUARDIAN'
                ? 'Aqui está o boletim consolidado e acompanhamento de frequência do seu filho Lucas Santos.'
                : 'Acompanhe suas notas e frequência escolar no painel estudantil.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="stripe-card">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Frequência Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">95.4%</div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Dentro do limite regulamentar
                </span>
              </CardContent>
            </Card>
            <Card className="stripe-card">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Média Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">8.7 / 10</div>
                <span className="text-[10px] text-muted-foreground">Top 15% da turma</span>
              </CardContent>
            </Card>
            <Card className="stripe-card">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                  Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  R$ 0,00
                </div>
                <span className="text-[10px] text-muted-foreground">Nenhuma fatura em atraso</span>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="stripe-card">
              <CardHeader className="border-b pb-2">
                <CardTitle>Boletim do Aluno</CardTitle>
                <CardDescription>Bimestre: 2º Bimestre / 2026</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Média</TableHead>
                    <TableHead>Faltas</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: 'Matemática', score: 9.0, absences: 2 },
                    { name: 'Física', score: 7.8, absences: 4 },
                    { name: 'L. Portuguesa', score: 8.5, absences: 1 },
                    { name: 'História', score: 9.5, absences: 0 },
                  ].map((sub, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold text-sm">{sub.name}</TableCell>
                      <TableCell className="font-mono text-xs">{sub.score.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sub.absences} faltas
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={sub.score >= 7 ? 'success' : 'warning'}>
                          {sub.score >= 7 ? 'Aprovado' : 'Recuperação'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="stripe-card">
              <CardHeader className="border-b pb-2">
                <CardTitle>Agenda & Atividades Semanais</CardTitle>
                <CardDescription>Acompanhe entregas pendentes.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start gap-3 border-b pb-3 border-border/40">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">
                      Lista de Exercícios: Trigonometria
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      Matemática - Entrega em 18/07/2026
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">Simulado Geral Enem</h4>
                    <span className="text-[10px] text-muted-foreground">
                      Institucional - Realização em 22/07/2026
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex items-center gap-2 border-b pb-4 border-border/40">
        <Sparkles className="h-6 w-6 text-blue-500 shrink-0" />
        <div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-foreground">
            Painel Geral
          </h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo ao portal. Você está logado no perfil:{' '}
            <Badge variant="default" className="uppercase ml-1 font-bold">
              {user?.role}
            </Badge>
          </p>
        </div>
      </div>

      {renderDashboardByRole()}

      {/* --- MOCK MODALS/DRAWERS FOR ADMIN/STAFF DEMOS --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Matricular Novo Aluno"
      >
        <form onSubmit={handleAddStudent} className="space-y-4 pt-2">
          <Input
            label="Nome Completo"
            placeholder="Nome do aluno"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            required
          />
          <Input
            type="email"
            label="E-mail do Responsável"
            placeholder="exemplo@email.com"
            value={newStudentEmail}
            onChange={(e) => setNewStudentEmail(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Turma Inicial"
              options={[
                { value: '1º Ano A', label: '1º Ano A' },
                { value: '2º Ano B', label: '2º Ano B' },
                { value: '3º Ano A', label: '3º Ano A' },
              ]}
              value={newStudentClass}
              onChange={(e) => setNewStudentClass(e.target.value)}
            />
            <Select
              label="Status de Matrícula"
              options={[
                { value: 'active', label: 'Ativo' },
                { value: 'pending', label: 'Pendente' },
                { value: 'inactive', label: 'Inativo' },
              ]}
              value={newStudentStatus}
              onChange={(e) => setNewStudentStatus(e.target.value as Student['status'])}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Matricular Aluno</Button>
          </div>
        </form>
      </Modal>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Ficha do Estudante"
      >
        {selectedStudent && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="h-12 w-12 rounded-full bg-primary/15 text-primary font-bold text-xl flex items-center justify-center">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm leading-none mb-1">
                  {selectedStudent.name}
                </h4>
                <span className="text-xs text-muted-foreground">{selectedStudent.email}</span>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground font-semibold">Registro:</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedStudent.registration}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground font-semibold">Turma:</span>
                <span className="font-bold text-foreground">{selectedStudent.classroom}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground font-semibold">Status acadêmico:</span>
                <span className="font-bold uppercase text-foreground">
                  {selectedStudent.status}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setIsDrawerOpen(false)}
            >
              Fechar Ficha
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
};

// ClassesPage will be imported from pages/ClassesPage

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudentListItem {
  id: string;
  cpf: string | null;
  rg: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  whatsapp: string | null;
  guardianName: string | null;
  notes: string | null;
  fatherName: string | null;
  motherName: string | null;
  status: string;
  user: {
    id: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    profile: {
      firstName: string;
      lastName: string;
      phone: string | null;
      birthDate: string | null;
      avatarUrl: string | null;
    } | null;
  };
}

interface StudentMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const GENDER_OPTIONS = [
  { value: '', label: 'Todos os Sexos' },
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Feminino', label: 'Feminino' },
  { value: 'Outro', label: 'Outro' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os Status' },
  { value: 'true', label: 'Ativos' },
  { value: 'false', label: 'Inativos' },
];

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos os Estados' },
  ...[
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ].map((s) => ({ value: s, label: s })),
];

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const StudentsPage: React.FC = () => {
  const { addToast } = useToast();

  // ── List state ──────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [meta, setMeta] = useState<StudentMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Drawer state ─────────────────────────────────────────────────────────────
  const [drawerStudentId, setDrawerStudentId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ── Modal: Create / Edit ─────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentListItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [fEmail, setFEmail] = useState('');
  const [fFirstName, setFFirstName] = useState('');
  const [fLastName, setFLastName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fBirthDate, setFBirthDate] = useState('');
  const [fCpf, setFCpf] = useState('');
  const [fRg, setFRg] = useState('');
  const [fGender, setFGender] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fCity, setFCity] = useState('');
  const [fState, setFState] = useState('');
  const [fCep, setFCep] = useState('');
  const [fWhatsapp, setFWhatsapp] = useState('');
  const [fGuardian, setFGuardian] = useState('');
  const [fFatherName, setFFatherName] = useState('');
  const [fMotherName, setFMotherName] = useState('');
  const [fStatus, setFStatus] = useState('LISTA_DE_ESPERA');
  const [fNotes, setFNotes] = useState('');
  const [fIsActive, setFIsActive] = useState(true);
  const [fAvatarUrl, setFAvatarUrl] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // ── Delete confirmation ──────────────────────────────────────────────────────
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch students ───────────────────────────────────────────────────────────
  const fetchStudents = useCallback(
    async (page = currentPage) => {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: '10' };
        if (search) params.search = search;
        if (genderFilter) params.gender = genderFilter;
        if (statusFilter) params.isActive = statusFilter;
        if (stateFilter) params.state = stateFilter;

        const res = await api.get('/students', { params });
        setStudents(res.data.data.students);
        setMeta(res.data.data.meta);
      } catch {
        addToast({ type: 'error', message: 'Falha ao carregar alunos.' });
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search, genderFilter, statusFilter, stateFilter, addToast]
  );

  useEffect(() => {
    fetchStudents(1);
    setCurrentPage(1);
  }, [genderFilter, statusFilter, stateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      fetchStudents(1);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchStudents(currentPage);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Open modal helpers ───────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingStudent(null);
    setFEmail('');
    setFFirstName('');
    setFLastName('');
    setFPhone('');
    setFBirthDate('');
    setFCpf('');
    setFRg('');
    setFGender('Masculino');
    setFAddress('');
    setFCity('');
    setFState('');
    setFCep('');
    setFWhatsapp('');
    setFGuardian('');
    setFFatherName('');
    setFMotherName('');
    setFStatus('LISTA_DE_ESPERA');
    setFNotes('');
    setFIsActive(true);
    setFAvatarUrl('');
    setPhotoPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: StudentListItem) => {
    setEditingStudent(s);
    setFEmail(s.user.email);
    setFFirstName(s.user.profile?.firstName || '');
    setFLastName(s.user.profile?.lastName || '');
    setFPhone(s.user.profile?.phone ? maskPhone(s.user.profile.phone) : '');
    setFBirthDate(s.user.profile?.birthDate ? s.user.profile.birthDate.substring(0, 10) : '');
    setFCpf(s.cpf ? maskCPF(s.cpf) : '');
    setFRg(s.rg || '');
    setFGender(s.gender || '');
    setFAddress(s.address || '');
    setFCity(s.city || '');
    setFState(s.state || '');
    setFCep(s.cep ? maskCEP(s.cep) : '');
    setFWhatsapp(s.whatsapp ? maskPhone(s.whatsapp) : '');
    setFGuardian(s.guardianName || '');
    setFFatherName(s.fatherName || '');
    setFMotherName(s.motherName || '');
    setFStatus(s.status || 'LISTA_DE_ESPERA');
    setFNotes(s.notes || '');
    setFIsActive(s.user.isActive);
    setFAvatarUrl(s.user.profile?.avatarUrl || '');
    setPhotoPreview(s.user.profile?.avatarUrl ? `${API_BASE}${s.user.profile.avatarUrl}` : null);
    setIsModalOpen(true);
  };

  // ── Photo upload ─────────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size and format
    if (!isValidFileType(file)) {
      addToast({
        type: 'warning',
        title: 'Formato não permitido',
        message: 'Apenas imagens PNG, JPG ou JPEG são aceitas.',
      });
      return;
    }
    if (!isValidFileSize(file, 5)) {
      addToast({
        type: 'warning',
        title: 'Arquivo muito grande',
        message: 'A foto deve ter no máximo 5MB.',
      });
      return;
    }

    // local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // If editing existing student — upload immediately as doc, then use URL
    // For new student — we store locally and send avatarUrl as base64 (server supports it via text field)
    // We'll encode the file as base64 and pass it in avatarUrl field for simplicity
    setPhotoUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      setFAvatarUrl(base64);
    } finally {
      setPhotoUploading(false);
    }
  };

  // ── Save (create or edit) ────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fFirstName || !fLastName || !fEmail) {
      addToast({ type: 'warning', message: 'Nome, sobrenome e e-mail são obrigatórios.' });
      return;
    }

    if (!isValidEmail(fEmail)) {
      addToast({ type: 'warning', message: 'Por favor, insira um e-mail válido.' });
      return;
    }

    const rawCpf = fCpf ? unmask(fCpf) : null;
    if (rawCpf && !isValidCPF(rawCpf)) {
      addToast({ type: 'warning', message: 'CPF inválido.' });
      return;
    }

    const rawPhone = fPhone ? unmask(fPhone) : null;
    if (rawPhone && !isValidPhone(rawPhone)) {
      addToast({ type: 'warning', message: 'Telefone de contato inválido.' });
      return;
    }

    const rawWhatsapp = fWhatsapp ? unmask(fWhatsapp) : null;
    if (rawWhatsapp && !isValidPhone(rawWhatsapp)) {
      addToast({ type: 'warning', message: 'WhatsApp de contato inválido.' });
      return;
    }

    const rawCep = fCep ? unmask(fCep) : null;
    if (rawCep && !isValidCEP(rawCep)) {
      addToast({ type: 'warning', message: 'CEP inválido.' });
      return;
    }

    setSaving(true);
    try {
      const body = {
        email: fEmail,
        firstName: fFirstName,
        lastName: fLastName,
        phone: rawPhone,
        birthDate: fBirthDate || null,
        avatarUrl: fAvatarUrl || null,
        cpf: rawCpf,
        rg: fRg || null,
        gender: fGender || null,
        address: fAddress || null,
        city: fCity || null,
        state: fState || null,
        cep: rawCep,
        whatsapp: rawWhatsapp,
        guardianName: fGuardian || null,
        fatherName: fFatherName || null,
        motherName: fMotherName || null,
        status: fStatus,
        notes: fNotes || null,
        isActive: fIsActive,
      };

      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, body);
        addToast({
          type: 'success',
          title: 'Aluno Atualizado',
          message: 'Dados salvos com sucesso.',
        });
      } else {
        await api.post('/students', body);
        addToast({
          type: 'success',
          title: 'Aluno Cadastrado',
          message: `${fFirstName} foi matriculado(a).`,
        });
      }
      setIsModalOpen(false);
      fetchStudents(currentPage);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: axiosErr.response?.data?.message || 'Falha ao salvar dados.',
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.delete(`/students/${deleteTargetId}`);
      addToast({
        type: 'success',
        title: 'Aluno Excluído',
        message: 'O registro foi removido permanentemente.',
      });
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
      fetchStudents(currentPage);
    } catch {
      addToast({ type: 'error', message: 'Falha ao excluir aluno.' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-foreground">
            Gestão de Alunos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta.total} aluno{meta.total !== 1 ? 's' : ''} cadastrado{meta.total !== 1 ? 's' : ''}{' '}
            no sistema
          </p>
        </div>
        <Button
          leftIcon={<UserPlus className="h-4 w-4" />}
          onClick={openCreateModal}
          id="btn-novo-aluno"
        >
          Matricular Aluno
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="stripe-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar por nome, CPF, RG ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Select
              options={GENDER_OPTIONS}
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              containerClassName="w-40"
            />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              containerClassName="w-36"
            />
            <Select
              options={ESTADO_OPTIONS}
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              containerClassName="w-36"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStudents(currentPage)}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              className="h-10"
            >
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card className="stripe-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={6} cols={5} />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 opacity-20 mb-3" />
              <p className="font-semibold">Nenhum aluno encontrado</p>
              <p className="text-sm mt-1">Ajuste os filtros ou cadastre um novo aluno.</p>
              <Button
                className="mt-4"
                size="sm"
                leftIcon={<UserPlus className="h-4 w-4" />}
                onClick={openCreateModal}
              >
                Matricular Aluno
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>CPF / RG</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const fullName =
                    `${s.user.profile?.firstName || ''} ${s.user.profile?.lastName || ''}`.trim();
                  const avatar = s.user.profile?.avatarUrl;
                  return (
                    <TableRow key={s.id} className="group">
                      {/* Avatar */}
                      <TableCell>
                        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {avatar ? (
                            <img
                              src={avatar.startsWith('data:') ? avatar : `${API_BASE}${avatar}`}
                              alt={fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-4 w-4 text-primary/60" />
                          )}
                        </div>
                      </TableCell>

                      {/* Name + email */}
                      <TableCell>
                        <div className="font-semibold text-foreground text-sm">
                          {fullName || '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">{s.user.email}</div>
                      </TableCell>

                      {/* CPF / RG */}
                      <TableCell>
                        <div className="font-mono text-xs">
                          <span className="text-muted-foreground">CPF: </span>
                          {s.cpf || '—'}
                        </div>
                        <div className="font-mono text-xs">
                          <span className="text-muted-foreground">RG: </span>
                          {s.rg || '—'}
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {s.user.profile?.phone || '—'}
                        </div>
                      </TableCell>

                      {/* City/State */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {s.city && s.state ? `${s.city} / ${s.state}` : s.city || s.state || '—'}
                        </div>
                      </TableCell>

                      {/* Status badge */}
                      <TableCell>
                        <Badge variant={s.user.isActive ? 'success' : 'secondary'}>
                          {s.user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Ver ficha completa"
                            onClick={() => {
                              setDrawerStudentId(s.id);
                              setIsDrawerOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Editar dados"
                            onClick={() => openEditModal(s)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Excluir aluno"
                            onClick={() => {
                              setDeleteTargetId(s.id);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-border">
            <Pagination
              currentPage={currentPage}
              totalPages={meta.totalPages}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        )}
      </Card>

      {/* ── Student Details Drawer ─────────────────────────────────────────────── */}
      <StudentDetailsDrawer
        studentId={drawerStudentId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStudentUpdated={() => fetchStudents(currentPage)}
      />

      {/* ── Create/Edit Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Editar Dados do Aluno' : 'Matricular Novo Aluno'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div
              className="h-20 w-20 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors flex-shrink-0"
              onClick={() => photoInputRef.current?.click()}
              title="Clique para enviar foto"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground gap-1">
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Foto</span>
                </div>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Foto do Aluno</p>
              <p>Clique na imagem para selecionar.</p>
              <p>Formatos: JPG, PNG (máx. 5MB)</p>
            </div>
          </div>

          {/* Personal info */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider flex items-center gap-2">
              <UserIcon className="h-3.5 w-3.5" /> Dados Pessoais
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nome *"
                value={fFirstName}
                onChange={(e) => setFFirstName(e.target.value)}
                placeholder="Nome"
                required
              />
              <Input
                label="Sobrenome *"
                value={fLastName}
                onChange={(e) => setFLastName(e.target.value)}
                placeholder="Sobrenome"
                required
              />
              <Input
                label="E-mail *"
                type="email"
                value={fEmail}
                onChange={(e) => setFEmail(e.target.value)}
                placeholder="aluno@escola.com"
                required
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Data de Nascimento"
                type="date"
                value={fBirthDate}
                onChange={(e) => setFBirthDate(e.target.value)}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
              <Input
                label="CPF"
                value={fCpf}
                onChange={(e) => setFCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                leftIcon={<CreditCard className="h-4 w-4" />}
              />

              <Input
                label="RG"
                value={fRg}
                onChange={(e) => setFRg(e.target.value)}
                placeholder="00.000.000-0"
                leftIcon={<FileText className="h-4 w-4" />}
              />
              <Select
                label="Sexo"
                options={[
                  { value: '', label: 'Selecione...' },
                  { value: 'Masculino', label: 'Masculino' },
                  { value: 'Feminino', label: 'Feminino' },
                  { value: 'Outro', label: 'Outro' },
                ]}
                value={fGender}
                onChange={(e) => setFGender(e.target.value)}
              />
              <Select
                label="Status"
                options={[
                  { value: 'true', label: 'Ativo' },
                  { value: 'false', label: 'Inativo' },
                ]}
                value={String(fIsActive)}
                onChange={(e) => setFIsActive(e.target.value === 'true')}
              />
              <Input
                label="Nome do Pai"
                value={fFatherName}
                onChange={(e) => setFFatherName(e.target.value)}
                placeholder="Nome do Pai"
              />
              <Input
                label="Nome da Mãe"
                value={fMotherName}
                onChange={(e) => setFMotherName(e.target.value)}
                placeholder="Nome da Mãe"
              />
            </div>
          </div>

          {/* Contact info */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" /> Contato
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Telefone"
                value={fPhone}
                onChange={(e) => setFPhone(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                leftIcon={<Phone className="h-4 w-4" />}
              />

              <Input
                label="WhatsApp"
                value={fWhatsapp}
                onChange={(e) => setFWhatsapp(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                leftIcon={<Phone className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Address */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> Endereço
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input
                  label="Logradouro"
                  value={fAddress}
                  onChange={(e) => setFAddress(e.target.value)}
                  placeholder="Rua, Av., número, complemento"
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>
              <Input
                label="Cidade"
                value={fCity}
                onChange={(e) => setFCity(e.target.value)}
                placeholder="São Paulo"
              />
              <Select
                label="Estado"
                options={ESTADO_OPTIONS}
                value={fState}
                onChange={(e) => setFState(e.target.value)}
              />
              <Input
                label="CEP"
                value={fCep}
                onChange={(e) => setFCep(maskCEP(e.target.value))}
                placeholder="00000-000"
              />
            </div>
          </div>

          {/* Guardian & Notes */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider flex items-center gap-2">
              <Users className="h-3.5 w-3.5" /> Responsável e Observações
            </p>
            <div className="space-y-3">
              <Input
                label="Nome do Responsável"
                value={fGuardian}
                onChange={(e) => setFGuardian(e.target.value)}
                placeholder="Nome completo do responsável"
                leftIcon={<UserIcon className="h-4 w-4" />}
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Observações
                </label>
                <textarea
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  rows={3}
                  placeholder="Informações adicionais relevantes..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving || photoUploading}>
              {editingStudent ? 'Salvar Alterações' : 'Matricular Aluno'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <Alert variant="destructive" title="Ação Irreversível">
            O aluno e todos os seus dados (documentos, histórico e usuário do sistema) serão
            excluídos permanentemente.
          </Alert>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" isLoading={deleting} onClick={handleDelete}>
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// BulletinsPage will be imported from pages/BulletinsPage

// 5. SETTINGS PAGE (With Profile Editing and Password Change)
const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  // Profile state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync profile details on start
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get('/auth/profile');
        const userProfile = response.data.data;
        setFirstName(userProfile.profile?.firstName || '');
        setLastName(userProfile.profile?.lastName || '');
        setPhone(userProfile.profile?.phone ? maskPhone(userProfile.profile.phone) : '');
      } catch (err) {
        // Ignora silenciosamente se o perfil não puder ser obtido no boot
      }
    }
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      addToast({ type: 'warning', message: 'Nome e sobrenome são obrigatórios.' });
      return;
    }

    const rawPhone = phone ? unmask(phone) : null;
    if (rawPhone && !isValidPhone(rawPhone)) {
      addToast({ type: 'warning', message: 'Telefone inválido.' });
      return;
    }

    setProfileLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        firstName,
        lastName,
        phone: rawPhone,
      });

      if (response.data.status === 'success') {
        const updatedUser: User = {
          ...user!,
          firstName,
          lastName,
        };
        updateUser(updatedUser);
        addToast({
          type: 'success',
          title: 'Perfil Atualizado',
          message: 'Suas informações cadastrais foram salvas.',
        });
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      addToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: axiosError.response?.data?.message || 'Falha ao salvar dados.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      addToast({ type: 'warning', message: 'Senha atual e nova senha são obrigatórias.' });
      return;
    }

    if (newPassword.length < 6) {
      addToast({ type: 'warning', message: 'Nova senha necessita de 6 dígitos.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({ type: 'warning', message: 'As senhas não coincidem.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (response.data.status === 'success') {
        addToast({
          type: 'success',
          title: 'Senha alterada!',
          message: 'Sua senha foi redefinida no banco de dados.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      addToast({
        type: 'error',
        title: 'Senha incorreta',
        message: axiosError.response?.data?.message || 'Erro ao redefinir a credencial.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-sans tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie suas preferências de perfil e credenciais.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="stripe-card md:col-span-2">
          <form onSubmit={handleUpdateProfile}>
            <CardHeader>
              <CardTitle>Editar Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais de contato.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nome"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Sobrenome"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <Input
                label="Telefone"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
              />

              <Input
                label="E-mail Institucional"
                value={user?.email || ''}
                readOnly
                disabled
                className="bg-muted/40 cursor-not-allowed opacity-75"
              />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button type="submit" isLoading={profileLoading}>
                Salvar Dados
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Theme Preferences Card */}
        <div className="space-y-6">
          <Card className="stripe-card">
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Altere preferências de tema visual.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-foreground block">Modo Escuro</span>
                  <span className="text-xs text-muted-foreground">Alternar visual</span>
                </div>
                <Button variant="outline" size="sm" onClick={toggleTheme} className="h-9 w-9 p-0">
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="stripe-card">
            <form onSubmit={handleChangePassword}>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>Redefina sua chave de segurança.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="password"
                  label="Senha Atual"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  label="Nova Senha"
                  placeholder="Min. 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  label="Confirmar Senha"
                  placeholder="Min. 6 caracteres"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit" isLoading={passwordLoading}>
                  Redefinir
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- App Routes Mapping ---

export const AppRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Spinner size="lg" />
        </div>
      }
    >
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Guest Only Routes (Login flow) */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recover-password" element={<RecoverPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
        </Route>

        {/* Authenticated Dashboard Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Role based page blocks */}
            <Route
              element={<PrivateRoute allowedRoles={['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']} />}
            >
              <Route path="/turmas" element={<ClassesPage />} />
              <Route path="/turmas/:classId/diario" element={<ClassDiaryPage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'DIRETOR', 'STAFF']} />}>
              <Route path="/alunos" element={<StudentsPage />} />
              <Route path="/professores" element={<TeachersPage />} />
              <Route path="/funcionarios" element={<EmployeesPage />} />
              <Route path="/responsaveis" element={<GuardiansPage />} />
              <Route path="/matriculas" element={<AcademicProcessesPage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/super-admin" element={<SuperAdminPage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DIRETOR']} />}>
              <Route path="/escolas" element={<SchoolsPage />} />
              <Route path="/planos" element={<PlansPage />} />
              <Route path="/permissoes" element={<RolesPage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'DIRETOR', 'FINANCEIRO']} />}>
              <Route path="/financeiro" element={<FinancialPage />} />
            </Route>

            <Route
              element={
                <PrivateRoute
                  allowedRoles={['ADMIN', 'DIRETOR', 'TEACHER', 'GUARDIAN', 'STUDENT']}
                />
              }
            >
              <Route path="/boletins" element={<BulletinsPage />} />
            </Route>

            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="/comunicacao" element={<CommunicationPage />} />
            <Route path="/agenda" element={<AgendaPage />} />

            <Route
              element={<PrivateRoute allowedRoles={['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']} />}
            >
              <Route path="/biblioteca" element={<LibraryPage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'DIRETOR', 'STAFF']} />}>
              <Route path="/documentos" element={<DocumentsPage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={['GUARDIAN']} />}>
              <Route path="/portal-pais" element={<ParentPortalPage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={['STUDENT']} />}>
              <Route path="/portal-aluno" element={<StudentPortalPage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={['TEACHER']} />}>
              <Route path="/portal-professor" element={<TeacherPortalPage />} />
            </Route>

            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'DIRETOR', 'FINANCEIRO']} />}>
              <Route path="/relatorios" element={<ReportsPage />} />
            </Route>

            <Route
              element={<PrivateRoute allowedRoles={['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER']} />}
            >
              <Route path="/assistente-ia" element={<AIAssistantPage />} />
            </Route>

            {/* Smart Import Module (restricted to Admin/Diretor) */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'DIRETOR']} />}>
              <Route element={<ImportProviderLayout />}>
                <Route
                  path="/importacao-inteligente"
                  element={<Navigate to="/importacao-inteligente/dashboard" replace />}
                />
                <Route path="/importacao-inteligente/dashboard" element={<DashboardImportacao />} />
                <Route path="/importacao-inteligente/nova" element={<NovaImportacao />} />
                <Route path="/importacao-inteligente/historico" element={<HistoricoImportacao />} />
                <Route path="/importacao-inteligente/modelos" element={<ModelosImportacao />} />
                <Route
                  path="/importacao-inteligente/configuracoes"
                  element={<ConfiguracoesImportacao />}
                />
              </Route>
            </Route>

            {/* Smart Export Module (restricted to Admin/Diretor) */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'DIRETOR']} />}>
              <Route
                path="/exportacao-inteligente"
                element={<Navigate to="/exportacao-inteligente/historico" replace />}
              />
              <Route path="/exportacao-inteligente/nova" element={<NovaExportacao />} />
              <Route path="/exportacao-inteligente/historico" element={<HistoricoExportacao />} />
            </Route>

            {/* Migration Center Module (restricted to Admin/Diretor) */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'DIRETOR']} />}>
              <Route path="/migracao" element={<Navigate to="/migracao/modelos" replace />} />
              <Route path="/migracao/modelos" element={<ModelosMigration />} />
              <Route path="/migracao/agendamentos" element={<AgendamentosMigration />} />
              <Route path="/migracao/api-docs" element={<ApiDocsMigration />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
export default AppRoutes;
