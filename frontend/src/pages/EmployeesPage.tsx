import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  Mail,
  RefreshCw,
  Contact,
  Building,
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

interface EmployeeListItem {
  id: string;
  department: string | null;
  notes: string | null;
  user: {
    email: string;
    role: string;
    profile: {
      firstName: string;
      lastName: string;
      phone: string | null;
    } | null;
  };
}

interface EmployeeMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  DIRETOR: { label: 'Diretor(a)', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  STAFF: {
    label: 'Secretaria/Staff',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  FINANCEIRO: { label: 'Financeiro', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
};

export const EmployeesPage: React.FC = () => {
  const { addToast } = useToast();

  // ── Lists state ─────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [meta, setMeta] = useState<EmployeeMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Modal Create/Edit ────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeListItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('STAFF');
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');

  // Delete modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(
    async (page = currentPage) => {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: '10' };
        if (search) params.search = search;

        const res = await api.get('/employees', { params });
        setEmployees(res.data.data?.employees || []);
        setMeta(res.data.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
      } catch {
        addToast({ type: 'error', message: 'Erro ao carregar funcionários.' });
      } finally {
        setLoading(false);
      }
    },
    [currentPage, search, addToast]
  );

  useEffect(() => {
    fetchEmployees(1);
    setCurrentPage(1);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchEmployees(currentPage);
  }, [currentPage, fetchEmployees]);

  // ── Open Modals ─────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingEmployee(null);
    setEmail('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setRole('STAFF');
    setDepartment('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: EmployeeListItem) => {
    setEditingEmployee(emp);
    setEmail(emp.user.email);
    setFirstName(emp.user.profile?.firstName || '');
    setLastName(emp.user.profile?.lastName || '');
    setPhone(emp.user.profile?.phone ? maskPhone(emp.user.profile.phone) : '');
    setRole(emp.user.role);
    setDepartment(emp.department || '');
    setNotes(emp.notes || '');
    setIsModalOpen(true);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName || !role) {
      addToast({ type: 'warning', message: 'Campos obrigatórios ausentes.' });
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
        role,
        department: department || null,
        notes: notes || null,
      };

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, body);
        addToast({
          type: 'success',
          title: 'Funcionário Atualizado',
          message: 'Dados salvos com sucesso.',
        });
      } else {
        await api.post('/employees', body);
        addToast({
          type: 'success',
          title: 'Funcionário Registrado',
          message: `"${firstName}" cadastrado com sucesso. Senha padrão: 123456`,
        });
      }
      setIsModalOpen(false);
      fetchEmployees(currentPage);
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
      await api.delete(`/employees/${deleteTargetId}`);
      addToast({
        type: 'success',
        title: 'Funcionário Excluído',
        message: 'O cadastro do funcionário foi removido.',
      });
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
      fetchEmployees(currentPage);
    } catch {
      addToast({ type: 'error', message: 'Falha ao excluir funcionário.' });
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
            Quadro Administrativo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta.total} funcionário(s) cadastrado(s)
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
          Adicionar Funcionário
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
                placeholder="Pesquisar por nome, departamento ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEmployees(currentPage)}
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
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Briefcase className="h-12 w-12 opacity-20 mb-3" />
              <p className="font-semibold">Nenhum funcionário cadastrado</p>
              <p className="text-sm mt-1">Clique para registrar o primeiro.</p>
              <Button
                className="mt-4"
                size="sm"
                onClick={openCreateModal}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Adicionar Funcionário
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nível de Acesso (Cargo)</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const empName = emp.user.profile
                    ? `${emp.user.profile.firstName} ${emp.user.profile.lastName}`
                    : 'Sem nome';
                  const badge = roleLabels[emp.user.role] || {
                    label: emp.user.role,
                    color: 'bg-secondary text-foreground',
                  };
                  return (
                    <TableRow key={emp.id} className="group">
                      <TableCell>
                        <div className="font-semibold text-foreground text-sm">{empName}</div>
                        <div className="text-xs text-muted-foreground">{emp.user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.color}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {emp.department ? (
                          <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                            <Building className="h-3.5 w-3.5 text-muted-foreground" />
                            {emp.department}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Não especificado
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          {emp.user.profile?.phone && (
                            <div className="flex items-center gap-1 text-foreground">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {emp.user.profile.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {emp.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(emp)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => {
                              setDeleteTargetId(emp.id);
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
        title={editingEmployee ? 'Editar Funcionário' : 'Adicionar Novo Funcionário'}
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
              <Select
                label="Cargo / Nível no Portal *"
                options={[
                  { value: 'STAFF', label: 'Secretaria / Staff Administrativo' },
                  { value: 'FINANCEIRO', label: 'Operador Financeiro' },
                  { value: 'DIRETOR', label: 'Diretoria Executiva' },
                ]}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Departamento de Trabalho"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: Recursos Humanos, Secretaria Acadêmica"
                leftIcon={<Contact className="h-4 w-4" />}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Observações Internas
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anotações gerais..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving}>
              Salvar Cadastro
            </Button>
          </div>
        </form>
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
            Tem certeza que deseja excluir este funcionário? Isso revogará o acesso administrativo
            de sua conta imediatamente.
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
export default EmployeesPage;
