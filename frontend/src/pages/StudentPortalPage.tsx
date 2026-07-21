import React, { useState, useEffect, useCallback } from 'react';
import {
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
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
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

export const StudentPortalPage: React.FC = () => {
  const { addToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<
    'grades' | 'activities' | 'calendar' | 'material' | 'announcements' | 'profile'
  >('grades');

  // Loaded Data
  const [grades, setGrades] = useState<StudentReportCard[]>([]);
  const [activities, setActivities] = useState<StudentActivityItem[]>([]);
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [materials, setMaterials] = useState<CalendarItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfileAndData = useCallback(async () => {
    try {
      // Set isLoading to true/false to manage loading status
      setIsLoading(true);
      const profileRes = await api.get('/portal/student/profile');
      setProfile(profileRes.data.data);

      const [gradesRes, activitiesRes, calendarRes, materialsRes, announcementsRes] =
        await Promise.all([
          api.get('/portal/student/grades'),
          api.get('/portal/student/activities'),
          api.get('/portal/student/calendar'),
          api.get('/portal/student/materials'),
          api.get('/portal/student/announcements'),
        ]);

      setGrades(gradesRes.data.data);
      setActivities(activitiesRes.data.data);
      setCalendar(calendarRes.data.data);
      setMaterials(materialsRes.data.data);
      setAnnouncements(announcementsRes.data.data);
      setIsLoading(false);
    } catch (err) {
      addToast({ type: 'error', message: 'Erro ao obter dados do portal do aluno.' });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProfileAndData();
  }, [fetchProfileAndData]);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Student Greeting */}
      {profile && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-1">
            <span className="text-xs font-bold text-primary tracking-widest uppercase">
              Portal do Aluno
            </span>
            <h1 className="text-2xl font-black">Olá, {profile.name}!</h1>
            <p className="text-sm text-slate-300">
              Acompanhe seu rendimento, atividades e cronogramas diários.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Turma
              </div>
              <div className="text-xs font-extrabold">{profile.className || 'Sem Turma'}</div>
            </div>
          </div>
        </div>
      )}

      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left panel: Quick student status */}
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
                    <div className="text-xs text-muted-foreground">Matrícula</div>
                    <div className="text-lg font-black text-foreground">
                      #{profile.id.slice(0, 8).toUpperCase()}
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
          </div>

          {/* Right panel: Tabs and content */}
          <div className="md:col-span-3 space-y-6">
            <div className="flex border-b border-border overflow-x-auto pb-px">
              {[
                {
                  key: 'grades',
                  label: 'Notas / Boletim',
                  icon: <FileSpreadsheet className="h-4 w-4" />,
                },
                {
                  key: 'activities',
                  label: 'Minhas Atividades',
                  icon: <Clock className="h-4 w-4" />,
                },
                {
                  key: 'calendar',
                  label: 'Calendário de Aulas',
                  icon: <Calendar className="h-4 w-4" />,
                },
                {
                  key: 'material',
                  label: 'Conteúdo / Material',
                  icon: <BookOpen className="h-4 w-4" />,
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
                        | 'grades'
                        | 'activities'
                        | 'calendar'
                        | 'material'
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

            {/* TAB CONTENT: GRADES */}
            {activeTab === 'grades' && (
              <Card className="stripe-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground">
                    Boletim Acadêmico Oficial
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
                            Nenhuma nota lançada em boletim.
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

            {/* TAB CONTENT: ACTIVITIES */}
            {activeTab === 'activities' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Atividades Práticas, Trabalhos e Avaliações
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título da Atividade</TableHead>
                        <TableHead>Data Limite</TableHead>
                        <TableHead className="text-center">Nota Máxima</TableHead>
                        <TableHead className="text-right">Minha Nota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground text-xs"
                          >
                            Nenhuma atividade agendada ou lançada.
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
                                <span
                                  className={a.myGrade >= 6 ? 'text-emerald-600' : 'text-rose-500'}
                                >
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

            {/* TAB CONTENT: CALENDAR */}
            {activeTab === 'calendar' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Cronograma de Aulas e Eventos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {calendar.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-xs">
                      Nenhum evento letivo programado.
                    </p>
                  ) : (
                    calendar.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl border border-border bg-slate-500/5 flex items-start gap-4"
                      >
                        <div className="bg-primary/10 text-primary font-bold px-3 py-2 rounded-xl text-center font-mono text-xs">
                          {c.date}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-foreground text-xs">{c.title}</h4>
                          {c.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: MATERIAL */}
            {activeTab === 'material' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Materiais de Aula e Conteúdo Programático
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {materials.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-xs">
                      Nenhum material de aula disponibilizado.
                    </p>
                  ) : (
                    materials.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-border/80 bg-background/50 hover:bg-slate-500/5 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-foreground text-xs">{m.title}</h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {m.date}
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {m.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Comunicados Oficiais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {announcements.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground text-xs">
                      Nenhum aviso no momento.
                    </p>
                  ) : (
                    announcements.map((a) => (
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
            )}

            {/* TAB CONTENT: PROFILE */}
            {activeTab === 'profile' && (
              <Card className="stripe-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Informações Cadastrais Básicas
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
          Carregando dados do portal...
        </div>
      )}
    </div>
  );
};

export default StudentPortalPage;
