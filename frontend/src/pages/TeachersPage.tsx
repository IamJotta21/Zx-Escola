import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  Clock,
  Phone,
  Mail,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { isValidEmail, isValidPhone } from '../utils/validators';
import { maskPhone, unmask } from '../utils/masks';

import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

interface ClassShort {
  id: string;
  name: string;
}

interface TeacherListItem {
  id: string;
  subjects: string | null;
  workload: number;
  schedule: string | null;
  user: {
    email: string;
    role: string;
    profile: {
      firstName: string;
      lastName: string;
      phone: string | null;
    } | null;
  };
  classes: ClassShort[];
}

interface TeacherMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const TeachersPage: React.FC = () => {
  const { addToast } = useToast();

  // ── Lists state ─────────────────────────────────────────────────────────────
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [meta, setMeta] = useState<TeacherMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal Create/Edit ────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherListItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [subjects, setSubjects] = useState('');
  const [workload, setWorkload] = useState('20');
  const [schedule, setSchedule] = useState('');

  // Delete modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Timetable view modal
  const [isScheduleViewOpen, setIsScheduleViewOpen] = useState(false);
  const [selectedTeacherForSchedule, setSelectedTeacherForSchedule] =
    useState<TeacherListItem | null>(null);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const fetchTeachers = useCallback(
    async (page = currentPage) => {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: '10' };
        if (search) params.search = search;

        const res = await api.get('/teachers', { params });
        setTeachers(res.data.data?.teachers || []);
        setMeta(res.data.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
      } catch {
        addToast({ type: 'error', message: 'Erro ao carregar professores.' });
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search, addToast]
  );

  useEffect(() => {
    fetchTeachers(1);
    setCurrentPage(1);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTeachers(currentPage);
  }, [currentPage, fetchTeachers]);

  // ── Open Modals ─────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingTeacher(null);
    setEmail('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setSubjects('');
    setWorkload('20');
    setSchedule('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: TeacherListItem) => {
    setEditingTeacher(t);
    setEmail(t.user.email);
    setFirstName(t.user.profile?.firstName || '');
    setLastName(t.user.profile?.lastName || '');
    setPhone(t.user.profile?.phone ? maskPhone(t.user.profile.phone) : '');
    setSubjects(t.subjects || '');
    setWorkload(String(t.workload));
    setSchedule(t.schedule || '');
    setIsModalOpen(true);
  };

  const openScheduleView = (t: TeacherListItem) => {
    setSelectedTeacherForSchedule(t);
    setIsScheduleViewOpen(true);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName) {
      addToast({ type: 'warning', message: 'E-mail, nome e sobrenome são obrigatórios.' });
      return;
    }

    if (!isValidEmail(email)) {
      addToast({ type: 'warning', message: 'Formato de e-mail inválido.' });
      return;
    }

    const rawPhone = phone ? unmask(phone) : null;
    if (rawPhone && !isValidPhone(rawPhone)) {
      addToast({ type: 'warning', message: 'Telefone inválido.' });
      return;
    }

    setSaving(true);
    try {
      const body = {
        email,
        firstName,
        lastName,
        phone: rawPhone,
        subjects: subjects || null,
        workload: parseInt(workload),
        schedule: schedule || null,
      };

      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher.id}`, body);
        addToast({
          type: 'success',
          title: 'Professor Atualizado',
          message: 'Dados salvos com sucesso.',
        });
      } else {
        await api.post('/teachers', body);
        addToast({
          type: 'success',
          title: 'Professor Cadastrado',
          message: `"${firstName}" cadastrado com sucesso. Senha padrão: 123456`,
        });
      }
      setIsModalOpen(false);
      fetchTeachers(currentPage);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Falha ao salvar dados.';
      addToast({ type: 'error', title: 'Erro ao salvar', message: msg });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await api.delete(`/teachers/${deleteTargetId}`);
      addToast({
        type: 'success',
        title: 'Professor Excluído',
        message: 'O cadastro do professor foi removido do sistema.',
      });
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
      fetchTeachers(currentPage);
    } catch {
      addToast({ type: 'error', message: 'Falha ao excluir professor.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-foreground">
            Corpo Docente
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta.total} professor(es) alocado(s) na instituição
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
          Cadastrar Professor
        </Button>
      </div>

      {/* Search Filter Card */}
      <Card className="stripe-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar por nome, disciplinas ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTeachers(currentPage)}
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
            <div className="p-6 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Award className="h-12 w-12 opacity-20 mb-3" />
              <p className="font-semibold">Nenhum professor registrado</p>
              <p className="text-sm mt-1">Clique para alocar o primeiro.</p>
              <Button
                className="mt-4"
                size="sm"
                onClick={openCreateModal}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Cadastrar Professor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Disciplinas</TableHead>
                  <TableHead>Carga Horária</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Turmas Atribuídas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((t) => {
                  const tName = t.user.profile
                    ? `${t.user.profile.firstName} ${t.user.profile.lastName}`
                    : 'Sem nome';
                  return (
                    <TableRow key={t.id} className="group">
                      <TableCell>
                        <div className="font-semibold text-foreground text-sm">{tName}</div>
                        <div className="text-xs text-muted-foreground">{t.user.email}</div>
                      </TableCell>
                      <TableCell>
                        {t.subjects ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {t.subjects.split(',').map((subj, idx) => (
                              <Badge key={idx} variant="outline">
                                {subj.trim()}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Não especificado
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {t.workload}h semanais
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          {t.user.profile?.phone && (
                            <div className="flex items-center gap-1 text-foreground">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {t.user.profile.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {t.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {t.classes.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Nenhuma</span>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            {t.classes.map((cls) => (
                              <Badge key={cls.id} variant="success" className="text-[10px]">
                                {cls.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {t.schedule && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-primary border-primary/20 hover:bg-primary/5"
                              onClick={() => openScheduleView(t)}
                            >
                              Agenda
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(t)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => {
                              setDeleteTargetId(t.id);
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

      {/* ── Create/Edit Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Editar Professor' : 'Cadastrar Novo Professor'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nome *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nome"
              required
            />
            <Input
              label="Sobrenome *"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Sobrenome"
              required
            />
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="E-mail *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@escola.com"
                required
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Telefone de Contato"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                leftIcon={<Phone className="h-4 w-4" />}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Disciplinas Lecionadas"
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="Ex: Matemática, Física, Química"
                leftIcon={<BookOpen className="h-4 w-4" />}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Carga Horária Semanal (Horas)"
                type="number"
                value={workload}
                onChange={(e) => setWorkload(e.target.value)}
                placeholder="20"
                leftIcon={<Clock className="h-4 w-4" />}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Agenda / Grade de Horários
              </label>
              <textarea
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                rows={4}
                placeholder="Segunda-feira: 08:00 - 12:00&#10;Terça-feira: 13:00 - 17:00..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              Salvar Professor
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Timetable View Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isScheduleViewOpen}
        onClose={() => setIsScheduleViewOpen(false)}
        title={
          selectedTeacherForSchedule
            ? `Agenda: ${selectedTeacherForSchedule.user.profile?.firstName} ${selectedTeacherForSchedule.user.profile?.lastName}`
            : 'Agenda'
        }
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/30 border border-border text-xs leading-relaxed text-foreground whitespace-pre-line font-medium">
            {selectedTeacherForSchedule?.schedule || 'Nenhum horário cadastrado.'}
          </div>
          <div className="flex justify-end pt-2 border-t border-border">
            <Button onClick={() => setIsScheduleViewOpen(false)}>Fechar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Remoção"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Tem certeza que deseja excluir este professor? Isso desativará seu acesso ao portal e
            removerá seus vínculos com turmas.
          </p>
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
export default TeachersPage;
