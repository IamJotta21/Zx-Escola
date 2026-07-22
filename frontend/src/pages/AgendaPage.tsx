import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  Clock,
  Users,
  Filter,
  Search,
  CheckCircle2,
  Info,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Sparkles,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string | null;
  eventType: 'INICIO_AULAS' | 'FERIAS' | 'RECESSO' | 'FERIADO' | 'EVENTO' | 'REUNIAO' | 'PROVA' | 'RECUPERACAO';
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;
  location?: string | null;
  target: string; // ALL, STUDENTS, TEACHERS, GUARDIANS, CLASS
  classId?: string | null;
  class?: { name: string } | null;
  createdById?: string;
  createdAt: string;
}

interface ClassShort {
  id: string;
  name: string;
}

const EVENT_TYPES = [
  { value: 'INICIO_AULAS', label: 'Início das Aulas', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', badgeVariant: 'success' },
  { value: 'FERIAS', label: 'Férias Escolares', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30', badgeVariant: 'secondary' },
  { value: 'RECESSO', label: 'Recesso Escolar', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', badgeVariant: 'warning' },
  { value: 'FERIADO', label: 'Feriado Nacional / Municipal', color: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30', badgeVariant: 'destructive' },
  { value: 'EVENTO', label: 'Evento Escolar / Cultural', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30', badgeVariant: 'secondary' },
  { value: 'REUNIAO', label: 'Reunião de Pais / Conselho', color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30', badgeVariant: 'secondary' },
  { value: 'PROVA', label: 'Avaliação / Prova', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30', badgeVariant: 'warning' },
  { value: 'RECUPERACAO', label: 'Recuperação Parcial / Final', color: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30', badgeVariant: 'outline' },
];

const TARGET_TYPES = [
  { value: 'ALL', label: 'Toda a Escola' },
  { value: 'STUDENTS', label: 'Todos os Alunos' },
  { value: 'TEACHERS', label: 'Corpo Docente (Professores)' },
  { value: 'GUARDIANS', label: 'Pais e Responsáveis' },
  { value: 'CLASS', label: 'Turma Específica' },
];

export const AgendaPage: React.FC = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const canManageEvents = user && ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'].includes(user.role);

  // View state: 'monthly' | 'weekly' | 'daily'
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily'>('monthly');

  // Selected date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Data state
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [classes, setClasses] = useState<ClassShort[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTarget, setFilterTarget] = useState('');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEventType, setFormEventType] = useState('EVENTO');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formTarget, setFormTarget] = useState('ALL');
  const [formClassId, setFormClassId] = useState('');
  const [formNotifyUsers, setFormNotifyUsers] = useState(true);

  // Fetch operations
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterType) params.eventType = filterType;
      if (filterTarget) params.target = filterTarget;
      const res = await api.get('/calendar/events', { params });
      setEvents(res.data.data || []);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar eventos da agenda escolar.' });
    } finally {
      setLoading(false);
    }
  }, [filterType, filterTarget, addToast]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.data || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchClasses();
  }, [fetchEvents, fetchClasses]);

  // Modal Handlers
  const handleOpenCreateModal = (dateStr?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDescription('');
    setFormEventType('EVENTO');
    setFormStartDate(dateStr || selectedDateStr);
    setFormEndDate('');
    setFormLocation('');
    setFormTarget('ALL');
    setFormClassId('');
    setFormNotifyUsers(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: CalendarEventItem) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormEventType(event.eventType);
    setFormStartDate(event.startDate);
    setFormEndDate(event.endDate || '');
    setFormLocation(event.location || '');
    setFormTarget(event.target);
    setFormClassId(event.classId || '');
    setFormNotifyUsers(false);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formEventType || !formStartDate) {
      addToast({ type: 'warning', message: 'Título, Tipo e Data de Início são obrigatórios.' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formTitle,
        description: formDescription || null,
        eventType: formEventType,
        startDate: formStartDate,
        endDate: formEndDate || null,
        location: formLocation || null,
        target: formTarget,
        classId: formTarget === 'CLASS' ? formClassId : null,
        notifyUsers: formNotifyUsers,
      };

      if (editingEvent) {
        await api.put(`/calendar/events/${editingEvent.id}`, payload);
        addToast({ type: 'success', message: 'Evento atualizado com sucesso!' });
      } else {
        await api.post('/calendar/events', payload);
        addToast({ type: 'success', message: 'Evento cadastrado na agenda!' });
      }

      setIsModalOpen(false);
      fetchEvents();
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar evento.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Deseja realmente remover este evento da agenda?')) return;
    try {
      await api.delete(`/calendar/events/${eventId}`);
      addToast({ type: 'success', message: 'Evento removido com sucesso.' });
      fetchEvents();
    } catch {
      addToast({ type: 'error', message: 'Erro ao excluir evento.' });
    }
  };

  // Helper for Event Badge styling
  const getEventBadge = (type: string) => {
    const found = EVENT_TYPES.find((t) => t.value === type);
    return found ? (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${found.color}`}>
        {found.label}
      </span>
    ) : (
      <Badge variant="outline">{type}</Badge>
    );
  };

  // Date Navigation Controls
  const handlePrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(new Date().toISOString().split('T')[0]);
  };

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Monthly Calendar Generator Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Calendar cells array
  const calendarCells = [];
  // Trailing days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    calendarCells.push({
      dayNumber: prevMonthLastDay - i,
      isCurrentMonth: false,
      dateStr: new Date(year, month - 1, prevMonthLastDay - i + 1).toISOString().split('T')[0],
    });
  }
  // Days of current month
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    calendarCells.push({
      dayNumber: day,
      isCurrentMonth: true,
      dateStr: `${year}-${mStr}-${dStr}`,
    });
  }
  // Leading days for next month to complete 35 or 42 grid
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const mStr = String(month + 2).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    calendarCells.push({
      dayNumber: i,
      isCurrentMonth: false,
      dateStr: `${year}-${mStr}-${dStr}`,
    });
  }

  // Get events on specific date
  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter(
      (e) => e.startDate === dateStr || (e.endDate && dateStr >= e.startDate && dateStr <= e.endDate)
    );
  };

  // Weekly days calculation
  const getWeeklyDays = () => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  const weekDays = getWeeklyDays();

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/20 px-2.5 py-1 rounded-md border border-primary/30">
              Agenda Escolar Oficial
            </span>
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {filteredEvents.length} Evento(s)
            </Badge>
          </div>
          <h1 className="text-2xl font-black">Calendário de Atividades e Eventos</h1>
          <p className="text-sm text-slate-300">
            Acompanhe feriados, provas, reuniões, recesso e eventos da instituição.
          </p>
        </div>

        {canManageEvents && (
          <Button
            variant="default"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => handleOpenCreateModal()}
            className="shadow-md font-bold"
          >
            Novo Evento
          </Button>
        )}
      </div>

      {/* Control Bar: View Switcher, Date Controls & Filters */}
      <Card className="stripe-card">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" /> Mensal
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" /> Semanal
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'daily'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Diária
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handlePrevMonth} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-extrabold text-sm text-foreground min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="text-xs font-bold">
              Hoje
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="w-full sm:w-48">
              <Input
                placeholder="Buscar evento..."
                leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">Todos os Tipos</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EVENT CATEGORIES QUICK LEGEND */}
      <div className="flex flex-wrap gap-2 items-center p-3 bg-card border border-border rounded-xl">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2">
          Categorias:
        </span>
        {EVENT_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilterType(filterType === t.value ? '' : t.value)}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
              filterType === t.value ? 'ring-2 ring-primary scale-105' : ''
            } ${t.color}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* VIEW MODE 1: MONTHLY CALENDAR GRID */}
      {viewMode === 'monthly' && (
        <Card className="stripe-card">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden text-center">
              {/* Day Headers */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName, i) => (
                <div
                  key={i}
                  className="bg-muted/80 py-2 text-xs font-extrabold text-muted-foreground uppercase tracking-wider"
                >
                  {dayName}
                </div>
              ))}

              {/* Grid Cells */}
              {calendarCells.map((cell, idx) => {
                const dateEvents = getEventsForDate(cell.dateStr);
                const isSelected = selectedDateStr === cell.dateStr;
                const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDateStr(cell.dateStr);
                    }}
                    className={`min-h-[110px] p-2 bg-background transition-all flex flex-col justify-between cursor-pointer border border-transparent hover:border-primary/40 ${
                      !cell.isCurrentMonth ? 'opacity-40 bg-muted/20' : ''
                    } ${isSelected ? 'ring-2 ring-primary/60 bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center font-mono ${
                          isToday
                            ? 'bg-primary text-primary-foreground font-black'
                            : 'text-foreground'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {dateEvents.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          {dateEvents.length} ev.
                        </span>
                      )}
                    </div>

                    {/* Event Pill Chips */}
                    <div className="space-y-1 my-1 overflow-hidden max-h-[70px]">
                      {dateEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(cell.dateStr);
                          }}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate border ${
                            EVENT_TYPES.find((t) => t.value === ev.eventType)?.color ||
                            'bg-muted text-foreground'
                          }`}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dateEvents.length > 3 && (
                        <div className="text-[9px] font-bold text-primary">
                          +{dateEvents.length - 3} mais
                        </div>
                      )}
                    </div>

                    {/* Day Action */}
                    {canManageEvents && (
                      <div className="flex justify-end opacity-0 hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreateModal(cell.dateStr);
                          }}
                          className="p-1 rounded text-primary hover:bg-primary/10"
                          title="Adicionar evento neste dia"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* VIEW MODE 2: WEEKLY VIEW */}
      {viewMode === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((dateObj, idx) => {
            const dateStr = dateObj.toISOString().split('T')[0];
            const dayEvents = getEventsForDate(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <Card
                key={idx}
                className={`stripe-card ${isToday ? 'border-primary shadow-md' : ''}`}
              >
                <CardHeader className="p-3 border-b border-border text-center bg-muted/30">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">
                    {dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </div>
                  <div className={`text-base font-black font-mono ${isToday ? 'text-primary' : ''}`}>
                    {dateObj.getDate()} {dateObj.toLocaleDateString('pt-BR', { month: 'short' })}
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-2 min-h-[160px]">
                  {dayEvents.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-6">Sem eventos</p>
                  ) : (
                    dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`p-2 rounded-lg border text-xs space-y-1 ${
                          EVENT_TYPES.find((t) => t.value === ev.eventType)?.color || 'bg-muted'
                        }`}
                      >
                        <div className="font-bold truncate">{ev.title}</div>
                        {ev.location && (
                          <div className="text-[10px] flex items-center gap-1 opacity-80">
                            <MapPin className="h-3 w-3" /> {ev.location}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: DAILY VIEW & SELECTED DAY DETAILS */}
      {(viewMode === 'daily' || selectedDateStr) && (
        <Card className="stripe-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" /> Eventos do Dia {selectedDateStr}
            </CardTitle>
            {canManageEvents && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => handleOpenCreateModal(selectedDateStr)}
              >
                Adicionar Evento Neste Dia
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {getEventsForDate(selectedDateStr).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground space-y-2">
                <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-xs">Nenhum evento agendado para a data selecionada ({selectedDateStr}).</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getEventsForDate(selectedDateStr).map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl border border-border/80 bg-card hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getEventBadge(ev.eventType)}
                        <h3 className="font-extrabold text-foreground text-sm">{ev.title}</h3>
                        <Badge variant="outline" className="text-[10px]">
                          Público: {TARGET_TYPES.find((t) => t.value === ev.target)?.label || ev.target}
                        </Badge>
                      </div>

                      {ev.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {ev.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" /> Data: {ev.startDate}
                          {ev.endDate ? ` até ${ev.endDate}` : ''}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-rose-500" /> {ev.location}
                          </span>
                        )}
                        {ev.class?.name && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" /> Turma: {ev.class.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {canManageEvents && (
                      <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                          onClick={() => handleOpenEditModal(ev)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-500 hover:text-rose-600"
                          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => handleDeleteEvent(ev.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Editar Evento da Agenda' : 'Cadastrar Novo Evento na Agenda'}
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Título do Evento *</label>
            <Input
              placeholder="Ex: Prova de Matemática / Início do 2º Semestre"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Categoria de Evento *</label>
              <Select value={formEventType} onChange={(e) => setFormEventType(e.target.value)}>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Público Alvo *</label>
              <Select value={formTarget} onChange={(e) => setFormTarget(e.target.value)}>
                {TARGET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {formTarget === 'CLASS' && (
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Turma Específica</label>
              <Select value={formClassId} onChange={(e) => setFormClassId(e.target.value)}>
                <option value="">Selecione a turma...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Data de Início *</label>
              <Input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Data de Término (Opcional)</label>
              <Input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Local / Sala (Opcional)</label>
            <Input
              placeholder="Ex: Auditório Principal / Sala de Reuniões"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">Descrição / Detalhes</label>
            <textarea
              className="w-full h-24 rounded-lg border border-input bg-background p-3 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Instruções ou observações relevantes..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="notifyCheck"
              checked={formNotifyUsers}
              onChange={(e) => setFormNotifyUsers(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="notifyCheck" className="text-xs text-foreground font-semibold cursor-pointer">
              Notificar usuários do público-alvo internamente no sistema
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" size="sm" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editingEvent ? 'Atualizar Evento' : 'Salvar na Agenda'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AgendaPage;
