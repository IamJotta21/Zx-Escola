import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Building,
  User,
  Check,
  Search,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
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

interface TeacherShort {
  id: string;
  user: {
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

interface RoomShort {
  id: string;
  name: string;
  capacity: number;
}

interface StudentShort {
  id: string;
  classId: string | null;
  user: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

interface ClassListItem {
  id: string;
  name: string;
  gradeYear: string;
  schoolYear: string;
  roomId: string | null;
  room: RoomShort | null;
  teacherId: string | null;
  teacher: TeacherShort | null;
  students: StudentShort[];
}

export const ClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user && ['ADMIN', 'DIRETOR', 'STAFF'].includes(user.role);
  const [activeTab, setActiveTab] = useState<'classes' | 'rooms'>('classes');

  // ── Lists state ─────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [rooms, setRooms] = useState<RoomShort[]>([]);
  const [teachers, setTeachers] = useState<TeacherShort[]>([]);
  const [students, setStudents] = useState<StudentShort[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Class Modal ──────────────────────────────────────────────────────────────
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassListItem | null>(null);
  const [classSaving, setClassSaving] = useState(false);
  const [cName, setCName] = useState('');
  const [cGradeYear, setCGradeYear] = useState('');
  const [cSchoolYear, setCSchoolYear] = useState('2026');
  const [cRoomId, setCRoomId] = useState('');
  const [cTeacherId, setCTeacherId] = useState('');

  // ── Room Modal ───────────────────────────────────────────────────────────────
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomShort | null>(null);
  const [roomSaving, setRoomSaving] = useState(false);
  const [rName, setRName] = useState('');
  const [rCapacity, setRCapacity] = useState('30');

  // ── Student Allocation Modal ─────────────────────────────────────────────────
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocatingClass, setAllocatingClass] = useState<ClassListItem | null>(null);
  const [allocSaving, setAllocSaving] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'class' | 'room' } | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch Operations ────────────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.data);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar turmas.' });
    }
  }, [addToast]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data.data);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar salas.' });
    }
  }, [addToast]);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get('/teachers', { params: { limit: '100' } });
      setTeachers(res.data.data.teachers);
    } catch {
      // Fail silently
    }
  }, []);

  const fetchAllStudents = useCallback(async () => {
    try {
      const res = await api.get('/students', { params: { limit: '200' } });
      setStudents(res.data.data.students);
    } catch {
      // Fail silently
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchClasses(), fetchRooms(), fetchTeachers(), fetchAllStudents()]);
    setLoading(false);
  }, [fetchClasses, fetchRooms, fetchTeachers, fetchAllStudents]);

  useEffect(() => {
    fetchData();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Class Actions ────────────────────────────────────────────────────────────
  const openCreateClassModal = () => {
    setEditingClass(null);
    setCName('');
    setCGradeYear('');
    setCSchoolYear('2026');
    setCRoomId('');
    setCTeacherId('');
    setIsClassModalOpen(true);
  };

  const openEditClassModal = (c: ClassListItem) => {
    setEditingClass(c);
    setCName(c.name);
    setCGradeYear(c.gradeYear);
    setCSchoolYear(c.schoolYear);
    setCRoomId(c.roomId || '');
    setCTeacherId(c.teacherId || '');
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cGradeYear || !cSchoolYear) {
      addToast({ type: 'warning', message: 'Preencha os campos obrigatórios.' });
      return;
    }
    setClassSaving(true);
    try {
      const body = {
        name: cName,
        gradeYear: cGradeYear,
        schoolYear: cSchoolYear,
        roomId: cRoomId || null,
        teacherId: cTeacherId || null,
      };

      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, body);
        addToast({
          type: 'success',
          title: 'Turma Atualizada',
          message: 'Dados da turma salvos com sucesso.',
        });
      } else {
        await api.post('/classes', body);
        addToast({
          type: 'success',
          title: 'Turma Criada',
          message: 'Turma registrada no portal.',
        });
      }
      setIsClassModalOpen(false);
      fetchClasses();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Falha ao salvar turma.';
      addToast({ type: 'error', title: 'Erro', message: msg });
    } finally {
      setClassSaving(false);
    }
  };

  // ── Room Actions ─────────────────────────────────────────────────────────────
  const openCreateRoomModal = () => {
    setEditingRoom(null);
    setRName('');
    setRCapacity('30');
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (r: RoomShort) => {
    setEditingRoom(r);
    setRName(r.name);
    setRCapacity(String(r.capacity));
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName) {
      addToast({ type: 'warning', message: 'Nome da sala é obrigatório.' });
      return;
    }

    const cap = parseInt(rCapacity);
    if (isNaN(cap) || cap <= 0) {
      addToast({
        type: 'warning',
        message: 'Capacidade da sala deve ser um número positivo maior que zero.',
      });
      return;
    }

    setRoomSaving(true);
    try {
      const body = {
        name: rName,
        capacity: cap,
      };

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, body);
        addToast({
          type: 'success',
          title: 'Sala Atualizada',
          message: 'Dados salvos com sucesso.',
        });
      } else {
        await api.post('/rooms', body);
        addToast({ type: 'success', title: 'Sala Registrada', message: 'Sala física adicionada.' });
      }
      setIsRoomModalOpen(false);
      fetchRooms();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Falha ao salvar sala.';
      addToast({ type: 'error', title: 'Erro', message: msg });
    } finally {
      setRoomSaving(false);
    }
  };

  // ── Student Allocation Actions ────────────────────────────────────────────────
  const openAllocModal = (c: ClassListItem) => {
    setAllocatingClass(c);
    setSelectedStudentIds(c.students.map((st) => st.id));
    setStudentSearch('');
    setIsAllocModalOpen(true);
  };

  const handleSaveAllocation = async () => {
    if (!allocatingClass) return;
    setAllocSaving(true);
    try {
      await api.post(`/classes/${allocatingClass.id}/students`, {
        studentIds: selectedStudentIds,
      });
      addToast({
        type: 'success',
        title: 'Estudantes Alocados',
        message: `Turma "${allocatingClass.name}" atualizada com sucesso.`,
      });
      setIsAllocModalOpen(false);
      fetchClasses();
    } catch {
      addToast({ type: 'error', message: 'Falha ao alocar estudantes.' });
    } finally {
      setAllocSaving(false);
    }
  };

  const toggleStudentInClass = (sid: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]
    );
  };

  // ── Delete Actions ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'class') {
        await api.delete(`/classes/${deleteTarget.id}`);
        addToast({
          type: 'success',
          title: 'Turma Excluída',
          message: 'Cadastro da turma removido.',
        });
        fetchClasses();
      } else {
        await api.delete(`/rooms/${deleteTarget.id}`);
        addToast({
          type: 'success',
          title: 'Sala Excluída',
          message: 'Cadastro da sala removido.',
        });
        fetchRooms();
      }
      setIsDeleteModalOpen(false);
    } catch {
      addToast({ type: 'error', message: 'Erro ao remover cadastro.' });
    } finally {
      setDeleting(false);
    }
  };

  // Filters for student selection
  const filteredStudents = students
    .filter((st) => {
      const name =
        `${st.user.profile?.firstName || ''} ${st.user.profile?.lastName || ''}`.toLowerCase();
      const matchesSearch = name.includes(studentSearch.toLowerCase());
      // Show either students already in this class, OR students who have NO class assigned (not in any other class)
      const isUnassignedOrInThisClass = !st.classId || st.classId === allocatingClass?.id;
      return matchesSearch && isUnassignedOrInThisClass;
    })
    .sort((a, b) => {
      const nameA = `${a.user.profile?.firstName || ''} ${a.user.profile?.lastName || ''}`.trim() || a.user.email;
      const nameB = `${b.user.profile?.firstName || ''} ${b.user.profile?.lastName || ''}`.trim() || b.user.email;
      return nameA.localeCompare(nameB, 'pt-BR');
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-foreground">
            Turmas & Recursos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerenciamento de turmas acadêmicas, séries letivas e salas físicas.
          </p>
        </div>
        {isAdmin && (
          <div>
            {activeTab === 'classes' ? (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateClassModal}>
                Nova Turma
              </Button>
            ) : (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateRoomModal}>
                Nova Sala
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'classes'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Turmas Acadêmicas
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'rooms'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building className="h-4 w-4" />
          Salas de Aula
        </button>
      </div>

      {/* Main Table Grid */}
      <Card className="stripe-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : activeTab === 'classes' ? (
            /* Classes list */
            classes.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="h-10 w-10 opacity-30 mx-auto mb-2" />
                <p>Nenhuma turma acadêmica cadastrada.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Série / Ano Letivo</TableHead>
                    <TableHead>Professor Conselheiro</TableHead>
                    <TableHead>Sala Fís.</TableHead>
                    <TableHead>Alunos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((c) => {
                    const profName = c.teacher?.user.profile
                      ? `${c.teacher.user.profile.firstName} ${c.teacher.user.profile.lastName}`
                      : 'Não atribuído';
                    return (
                      <TableRow key={c.id} className="group">
                        <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>{c.gradeYear}</div>
                            <div className="text-muted-foreground font-mono mt-0.5">
                              {c.schoolYear}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {profName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {c.room ? (
                            <Badge variant="outline">{c.room.name}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sem sala</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">{c.students.length} alunos</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-primary border-primary/20 hover:bg-primary/5"
                              onClick={() => navigate(`/turmas/${c.id}/diario`)}
                            >
                              Diário
                            </Button>
                            {isAdmin && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => openAllocModal(c)}
                                >
                                  Alunos
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openEditClassModal(c)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive"
                                  onClick={() => {
                                    setDeleteTarget({ id: c.id, type: 'class' });
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          ) : /* Rooms list */
          rooms.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Building className="h-10 w-10 opacity-30 mx-auto mb-2" />
              <p>Nenhuma sala cadastrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificação</TableHead>
                  <TableHead>Capacidade Máxima</TableHead>
                  {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((r) => (
                  <TableRow key={r.id} className="group">
                    <TableCell className="font-semibold text-foreground">{r.name}</TableCell>
                    <TableCell>{r.capacity} alunos</TableCell>
                    <TableCell className="text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditRoomModal(r)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => {
                              setDeleteTarget({ id: r.id, type: 'room' });
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Class Modal ────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title={editingClass ? 'Editar Turma' : 'Criar Nova Turma'}
        size="md"
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <Input
            label="Identificação da Turma *"
            value={cName}
            onChange={(e) => setCName(e.target.value)}
            placeholder="Ex: 1º Ano A"
            required
          />
          <Input
            label="Série / Ano Acadêmico *"
            value={cGradeYear}
            onChange={(e) => setCGradeYear(e.target.value)}
            placeholder="Ex: Ensino Médio 1º Ano"
            required
          />
          <Input
            label="Ano Letivo *"
            value={cSchoolYear}
            onChange={(e) => setCSchoolYear(e.target.value)}
            placeholder="Ex: 2026"
            required
          />
          <Select
            label="Sala de Aula Física"
            options={[
              { value: '', label: 'Selecione uma sala...' },
              ...rooms.map((r) => ({ value: r.id, label: `${r.name} (Capac: ${r.capacity})` })),
            ]}
            value={cRoomId}
            onChange={(e) => setCRoomId(e.target.value)}
          />
          <Select
            label="Professor Conselheiro"
            options={[
              { value: '', label: 'Selecione um professor...' },
              ...teachers.map((t) => {
                const name = t.user.profile
                  ? `${t.user.profile.firstName} ${t.user.profile.lastName}`
                  : '—';
                return { value: t.id, label: name };
              }),
            ]}
            value={cTeacherId}
            onChange={(e) => setCTeacherId(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsClassModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={classSaving}>
              Salvar Turma
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Room Modal ─────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title={editingRoom ? 'Editar Sala' : 'Adicionar Nova Sala'}
        size="sm"
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <Input
            label="Identificação da Sala *"
            value={rName}
            onChange={(e) => setRName(e.target.value)}
            placeholder="Ex: Sala 101"
            required
          />
          <Input
            label="Capacidade de Alunos"
            type="number"
            value={rCapacity}
            onChange={(e) => setRCapacity(e.target.value)}
            placeholder="30"
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsRoomModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={roomSaving}>
              Salvar Sala
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Student Allocation Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={isAllocModalOpen}
        onClose={() => setIsAllocModalOpen(false)}
        title={allocatingClass ? `Alunos da Turma: ${allocatingClass.name}` : 'Alocar Alunos'}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Selecione quais alunos fazem parte desta classe. Alunos que já estão matriculados em
            outras turmas não aparecerão aqui para evitar duplicidade.
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar aluno..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="max-h-[220px] overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-secondary/10">
            {filteredStudents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                Nenhum aluno disponível.
              </p>
            ) : (
              filteredStudents.map((st) => {
                const name =
                  `${st.user.profile?.firstName || ''} ${st.user.profile?.lastName || ''}`.trim();
                const isChecked = selectedStudentIds.includes(st.id);
                return (
                  <div
                    key={st.id}
                    onClick={() => toggleStudentInClass(st.id)}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-primary/10 text-primary hover:bg-primary/15'
                        : 'hover:bg-secondary/40 text-foreground'
                    }`}
                  >
                    <div className="text-xs font-semibold">{name}</div>
                    {isChecked ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAllocModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAllocation} isLoading={allocSaving}>
              Salvar Enturmação
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Remoção"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Tem certeza que deseja excluir esta entrada? Esta ação é permanente e pode desvincular
            relacionamentos.
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
export default ClassesPage;
