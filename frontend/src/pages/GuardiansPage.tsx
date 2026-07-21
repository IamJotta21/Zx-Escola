import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  Mail,
  MapPin,
  Check,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { isValidEmail, isValidPhone } from '../utils/validators';
import { maskPhone, unmask } from '../utils/masks';

import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Alert } from '../components/ui/Alert';
import { SkeletonTable } from '../components/ui/Skeleton';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

interface StudentShort {
  id: string;
  user: {
    profile: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    } | null;
  };
}

interface GuardianListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  relationship: string | null;
  isFinancial: boolean;
  students: {
    student: StudentShort;
  }[];
}

interface GuardianMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'Pai', label: 'Pai' },
  { value: 'Mãe', label: 'Mãe' },
  { value: 'Tio', label: 'Tio' },
  { value: 'Tia', label: 'Tia' },
  { value: 'Avô', label: 'Avô' },
  { value: 'Avó', label: 'Avó' },
  { value: 'Outro', label: 'Outro/Tutor' },
];

export const GuardiansPage: React.FC = () => {
  const { addToast } = useToast();

  // ── States ──────────────────────────────────────────────────────────────────
  const [guardians, setGuardians] = useState<GuardianListItem[]>([]);
  const [meta, setMeta] = useState<GuardianMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [relFilter, setRelFilter] = useState('');
  const [finFilter, setFinFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // All students for linkage selection
  const [allStudents, setAllStudents] = useState<StudentShort[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<GuardianListItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [relationship, setRelationship] = useState('Mãe');
  const [isFinancial, setIsFinancial] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Delete modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

  // ── Actions ─────────────────────────────────────────────────────────────────
  const fetchGuardians = useCallback(
    async (page = currentPage) => {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: '10' };
        if (search) params.search = search;
        if (relFilter) params.relationship = relFilter;
        if (finFilter) params.isFinancial = finFilter;

        const res = await api.get('/guardians', { params });
        setGuardians(res.data.data.guardians);
        setMeta(res.data.data.meta);
      } catch {
        addToast({ type: 'error', message: 'Falha ao carregar responsáveis.' });
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search, relFilter, finFilter, addToast]
  );

  // Fetch all students for checkbox selection
  const fetchAllStudents = useCallback(async () => {
    try {
      const res = await api.get('/students', { params: { limit: '100' } });
      setAllStudents(res.data.data.students);
    } catch {
      // Fail silently
    }
  }, []);

  useEffect(() => {
    fetchGuardians(1);
    setCurrentPage(1);
  }, [relFilter, finFilter, fetchGuardians]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      fetchGuardians(1);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, fetchGuardians]);

  useEffect(() => {
    fetchGuardians(currentPage);
  }, [currentPage, fetchGuardians]);

  useEffect(() => {
    fetchAllStudents();
  }, [fetchAllStudents]);

  // ── Open Modals ─────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingGuardian(null);
    setName('');
    setEmail('');
    setPhone('');
    setWhatsapp('');
    setAddress('');
    setRelationship('Mãe');
    setIsFinancial(false);
    setSelectedStudentIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (g: GuardianListItem) => {
    setEditingGuardian(g);
    setName(g.name);
    setEmail(g.email || '');
    setPhone(g.phone ? maskPhone(g.phone) : '');
    setWhatsapp(g.whatsapp ? maskPhone(g.whatsapp) : '');
    setAddress(g.address || '');
    setRelationship(g.relationship || 'Mãe');
    setIsFinancial(g.isFinancial);
    setSelectedStudentIds(g.students.map((s) => s.student.id));
    setIsModalOpen(true);
  };

  // Checkbox student link toggle
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      addToast({ type: 'warning', message: 'O nome do responsável é obrigatório.' });
      return;
    }

    if (email && !isValidEmail(email)) {
      addToast({ type: 'warning', message: 'Formato de e-mail inválido.' });
      return;
    }

    const rawPhone = phone ? unmask(phone) : null;
    if (rawPhone && !isValidPhone(rawPhone)) {
      addToast({ type: 'warning', message: 'Telefone inválido.' });
      return;
    }

    const rawWhatsapp = whatsapp ? unmask(whatsapp) : null;
    if (rawWhatsapp && !isValidPhone(rawWhatsapp)) {
      addToast({ type: 'warning', message: 'WhatsApp inválido.' });
      return;
    }

    setSaving(true);
    try {
      const body = {
        name,
        email: email || null,
        phone: rawPhone,
        whatsapp: rawWhatsapp,
        address: address || null,
        relationship,
        isFinancial,
        studentIds: selectedStudentIds,
      };

      if (editingGuardian) {
        await api.put(`/guardians/${editingGuardian.id}`, body);
        addToast({
          type: 'success',
          title: 'Responsável Atualizado',
          message: 'Dados atualizados com sucesso.',
        });
      } else {
        await api.post('/guardians', body);
        addToast({
          type: 'success',
          title: 'Responsável Cadastrado',
          message: `"${name}" foi registrado como responsável.`,
        });
      }
      setIsModalOpen(false);
      fetchGuardians(currentPage);
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
      await api.delete(`/guardians/${deleteTargetId}`);
      addToast({
        type: 'success',
        title: 'Responsável Excluído',
        message: 'O cadastro do responsável foi removido.',
      });
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
      fetchGuardians(currentPage);
    } catch {
      addToast({ type: 'error', message: 'Falha ao excluir responsável.' });
    } finally {
      setDeleting(false);
    }
  };

  // Filter student list in modal select by input text
  const filteredStudents = allStudents.filter((st) => {
    const fullName =
      `${st.user.profile?.firstName || ''} ${st.user.profile?.lastName || ''}`.toLowerCase();
    return fullName.includes(studentSearch.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-foreground">
            Gestão de Responsáveis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta.total} responsável(is) cadastrado(s) no sistema
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openCreateModal}
          id="btn-novo-responsavel"
        >
          Cadastrar Responsável
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
                placeholder="Pesquisar por nome, telefone ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Select
              options={[{ value: '', label: 'Todos os Parentescos' }, ...RELATIONSHIP_OPTIONS]}
              value={relFilter}
              onChange={(e) => setRelFilter(e.target.value)}
              containerClassName="w-48"
            />
            <Select
              options={[
                { value: '', label: 'Todos os Status Financeiros' },
                { value: 'true', label: 'Apenas Responsável Financeiro' },
                { value: 'false', label: 'Apenas Responsável Pedagógico' },
              ]}
              value={finFilter}
              onChange={(e) => setFinFilter(e.target.value)}
              containerClassName="w-56"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchGuardians(currentPage)}
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
          ) : guardians.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 opacity-20 mb-3" />
              <p className="font-semibold">Nenhum responsável encontrado</p>
              <p className="text-sm mt-1">Ajuste os filtros ou cadastre um novo.</p>
              <Button
                className="mt-4"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={openCreateModal}
              >
                Cadastrar Responsável
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Parentesco / Financ.</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Alunos Vinculados</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guardians.map((g) => (
                  <TableRow key={g.id} className="group">
                    <TableCell>
                      <div className="font-semibold text-foreground text-sm">{g.name}</div>
                      {g.email && <div className="text-xs text-muted-foreground">{g.email}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline">{g.relationship || 'Não informado'}</Badge>
                        {g.isFinancial ? (
                          <Badge variant="success">Financ.</Badge>
                        ) : (
                          <Badge variant="secondary">Pedag.</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-foreground">
                        {g.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {g.phone}
                          </div>
                        )}
                        {g.whatsapp && (
                          <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-500">
                            <span className="text-[10px] bg-emerald-500/10 px-1 py-0.2 rounded">
                              WA
                            </span>
                            {g.whatsapp}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {g.students.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Nenhum aluno</span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {g.students.map(({ student }) => {
                            const studentName =
                              `${student.user.profile?.firstName || ''} ${student.user.profile?.lastName || ''}`.trim();
                            const avatar = student.user.profile?.avatarUrl;
                            return (
                              <div
                                key={student.id}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-border bg-secondary/40 text-xs font-medium"
                                title={studentName}
                              >
                                <div className="h-4.5 w-4.5 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                                  {avatar ? (
                                    <img
                                      src={
                                        avatar.startsWith('data:') ? avatar : `${API_BASE}${avatar}`
                                      }
                                      alt={studentName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <GraduationCap className="h-2.5 w-2.5 text-primary" />
                                  )}
                                </div>
                                <span className="max-w-[120px] truncate">{studentName}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Editar"
                          onClick={() => openEditModal(g)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Excluir"
                          onClick={() => {
                            setDeleteTargetId(g.id);
                            setIsDeleteModalOpen(true);
                          }}
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
        title={editingGuardian ? 'Editar Responsável' : 'Cadastrar Novo Responsável'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input
                label="Nome do Responsável *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              leftIcon={<Mail className="h-4 w-4" />}
            />
            <Select
              label="Parentesco *"
              options={RELATIONSHIP_OPTIONS}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            />
            <Input
              label="Telefone"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              leftIcon={<Phone className="h-4 w-4" />}
            />
            <Input
              label="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              leftIcon={<Phone className="h-4 w-4" />}
            />

            <div className="col-span-2">
              <Input
                label="Endereço Residencial"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, Número, Bairro, CEP"
                leftIcon={<MapPin className="h-4 w-4" />}
              />
            </div>
            <div className="col-span-2 py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFinancial}
                  onChange={(e) => setIsFinancial(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-ring"
                />
                <span className="text-sm font-medium text-foreground">
                  Definir como Responsável Financeiro (para emissão de boletos e contratos)
                </span>
              </label>
            </div>
          </div>

          {/* Student Linkage */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Vincular Alunos Associados
            </p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar aluno..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="max-h-[160px] overflow-y-auto border border-border rounded-lg p-2 space-y-1.5 bg-secondary/10">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">
                  Nenhum aluno correspondente.
                </p>
              ) : (
                filteredStudents.map((st) => {
                  const studentName =
                    `${st.user.profile?.firstName || ''} ${st.user.profile?.lastName || ''}`.trim();
                  const isChecked = selectedStudentIds.includes(st.id);
                  return (
                    <div
                      key={st.id}
                      onClick={() => toggleStudentSelection(st.id)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-primary/10 text-primary hover:bg-primary/15'
                          : 'hover:bg-secondary/40 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <div className="h-6 w-6 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                          {st.user.profile?.avatarUrl ? (
                            <img
                              src={
                                st.user.profile.avatarUrl.startsWith('data:')
                                  ? st.user.profile.avatarUrl
                                  : `${API_BASE}${st.user.profile.avatarUrl}`
                              }
                              alt={studentName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <GraduationCap className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        {studentName}
                      </div>
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
            {selectedStudentIds.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">
                {selectedStudentIds.length} aluno(s) selecionado(s) para vinculação.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              Salvar Alterações
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
            O responsável será removido permanentemente do sistema. Isso removerá seus vínculos com
            todos os alunos, mas NÃO apagará os dados dos alunos associados.
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
export default GuardiansPage;
