import React, { useState, useRef, useCallback } from 'react';
import {
  User,
  FileText,
  Clock,
  Upload,
  Download,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Heart,
  MessageCircle,
  StickyNote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Save,
} from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentDocument {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string | null;
  createdAt: string;
}

export interface StudentHistoryItem {
  id: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface StudentFull {
  id: string;
  cpf: string | null;
  rg: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  whatsapp: string | null;
  guardianName: string | null; // Legado
  fatherName: string | null;
  motherName: string | null;
  status: string;
  notes: string | null;
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
  documents: StudentDocument[];
  history: StudentHistoryItem[];
  guardians: {
    guardian: {
      id: string;
      name: string;
      phone: string | null;
      relationship: string | null;
      isFinancial: boolean;
    };
  }[];
}

interface StudentDetailsDrawerProps {
  studentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStudentUpdated?: () => void;
}

// ─── Helper Fns ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const statusLabels: Record<string, { label: string; color: string }> = {
  LISTA_DE_ESPERA: {
    label: 'Lista de Espera',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/25',
  },
  MATRICULADO: {
    label: 'Matriculado',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
  },
  REMATRICULADO: {
    label: 'Rematriculado',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/25',
  },
  TRANSFERIDO: {
    label: 'Transferido',
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/25',
  },
  CANCELADO: { label: 'Cancelado', color: 'bg-rose-500/10 text-rose-600 border-rose-500/25' },
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const actionLabels: Record<string, { label: string; color: string }> = {
  MATRICULA: {
    label: 'Matrícula',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  ALTERACAO_DADOS: {
    label: 'Alteração de Dados',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  DOCUMENTO_ENVIADO: {
    label: 'Documento Enviado',
    color: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  },
  EXCLUSAO: { label: 'Exclusão', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

// ─── Main Component ────────────────────────────────────────────────────────────

const StudentDetailsDrawer: React.FC<StudentDetailsDrawerProps> = ({
  studentId,
  isOpen,
  onClose,
  onStudentUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'dados' | 'documentos' | 'historico'>('dados');
  const [student, setStudent] = useState<StudentFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [docName, setDocName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    cpf: '',
    rg: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    whatsapp: '',
    fatherName: '',
    motherName: '',
    status: 'MATRICULADO',
    notes: '',
  });

  const canEdit = currentUser && ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'].includes(currentUser.role);

  const fetchStudentData = useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    api
      .get(`/students/${studentId}`)
      .then((r) => {
        const data: StudentFull = r.data.data;
        setStudent(data);
        setEditForm({
          firstName: data.user.profile?.firstName || '',
          lastName: data.user.profile?.lastName || '',
          email: data.user.email || '',
          phone: data.user.profile?.phone || '',
          birthDate: data.user.profile?.birthDate
            ? new Date(data.user.profile.birthDate).toISOString().split('T')[0]
            : '',
          cpf: data.cpf || '',
          rg: data.rg || '',
          gender: data.gender || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          cep: data.cep || '',
          whatsapp: data.whatsapp || '',
          fatherName: data.fatherName || '',
          motherName: data.motherName || '',
          status: data.status || 'MATRICULADO',
          notes: data.notes || '',
        });
      })
      .catch(() => addToast({ type: 'error', message: 'Falha ao carregar dados do aluno.' }))
      .finally(() => setLoading(false));
  }, [studentId, addToast]);

  // Load student details when drawer opens
  React.useEffect(() => {
    if (isOpen && studentId) {
      setLoading(true);
      setActiveTab('dados');
      setIsEditing(false);
      fetchStudentData();
    } else {
      setStudent(null);
      setIsEditing(false);
    }
  }, [isOpen, studentId, fetchStudentData]);

  // Save Edit Handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    setSaveLoading(true);
    try {
      await api.put(`/students/${studentId}`, editForm);
      addToast({
        type: 'success',
        title: 'Aluno Atualizado',
        message: 'As informações do aluno foram salvas com sucesso!',
      });
      setIsEditing(false);
      fetchStudentData();
      onStudentUpdated?.();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Falha ao atualizar dados do aluno.';
      addToast({ type: 'error', message: msg });
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Document Upload Handler ─────────────────────────────────────────────────
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      addToast({ type: 'warning', message: 'Selecione um arquivo antes de enviar.' });
      return;
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', docName || file.name);

    setUploadLoading(true);
    try {
      const res = await api.post(`/students/${studentId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newDoc: StudentDocument = res.data.data;
      setStudent((prev) =>
        prev
          ? {
              ...prev,
              documents: [...prev.documents, newDoc],
              history: [
                {
                  id: Date.now().toString(),
                  action: 'DOCUMENTO_ENVIADO',
                  details: `Documento "${newDoc.name}" anexado.`,
                  createdAt: new Date().toISOString(),
                },
                ...prev.history,
              ],
            }
          : prev
      );

      addToast({
        type: 'success',
        title: 'Arquivo Enviado',
        message: `"${newDoc.name}" foi anexado com sucesso.`,
      });
      setDocName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onStudentUpdated?.();
    } catch {
      addToast({ type: 'error', message: 'Falha ao enviar o arquivo.' });
    } finally {
      setUploadLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const fullName = student
    ? `${student.user.profile?.firstName || ''} ${student.user.profile?.lastName || ''}`.trim()
    : '';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={loading ? 'Carregando...' : `Ficha: ${fullName}`}
      size="lg"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm">Carregando ficha do aluno...</span>
        </div>
      ) : student ? (
        <div className="flex flex-col h-full">
          {/* ── Header Card ── */}
          <div className="flex items-center justify-between p-4 mb-2 rounded-xl bg-secondary/40 border border-border">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {student.user.profile?.avatarUrl ? (
                  <img
                    src={`${API_BASE}${student.user.profile.avatarUrl}`}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-primary/60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground text-lg leading-tight">{fullName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{student.user.email}</div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant={student.user.isActive ? 'success' : 'secondary'}>
                    {student.user.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={statusLabels[student.status]?.color || 'bg-secondary text-foreground'}
                  >
                    {statusLabels[student.status]?.label || student.status}
                  </Badge>
                  {student.gender && (
                    <Badge variant="outline" className="text-xs">
                      {student.gender}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {canEdit && (
              <Button
                variant={isEditing ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) setActiveTab('dados');
                }}
                leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                className="shrink-0"
              >
                {isEditing ? 'Visualizar' : 'Editar Dados'}
              </Button>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-border mb-4">
            {(
              [
                { key: 'dados', label: 'Dados Gerais', icon: User },
                { key: 'documentos', label: 'Documentação', icon: FileText },
                { key: 'historico', label: 'Histórico', icon: Clock },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* ─ Dados Gerais Tab ─ */}
            {activeTab === 'dados' && (
              isEditing ? (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs font-semibold text-primary flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Modo de Edição Ativo — Altere os campos desejados e clique em Salvar Alterações.
                  </div>

                  {/* Nome e Sobrenome */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Nome *</label>
                      <input
                        type="text"
                        required
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Sobrenome *</label>
                      <input
                        type="text"
                        required
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Documentos & Nascimento */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">CPF</label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={editForm.cpf}
                        onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">RG</label>
                      <input
                        type="text"
                        value={editForm.rg}
                        onChange={(e) => setEditForm({ ...editForm, rg: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Nascimento</label>
                      <input
                        type="date"
                        value={editForm.birthDate}
                        onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* E-mail, Telefone, WhatsApp, Sexo */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">E-mail *</label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Sexo / Gênero</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Selecione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Telefone</label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">WhatsApp</label>
                      <input
                        type="text"
                        value={editForm.whatsapp}
                        onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Logradouro / Endereço</label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Cidade</label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Estado (UF)</label>
                      <input
                        type="text"
                        value={editForm.state}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Filiação */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Nome do Pai</label>
                      <input
                        type="text"
                        value={editForm.fatherName}
                        onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Nome da Mãe</label>
                      <input
                        type="text"
                        value={editForm.motherName}
                        onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Status Acadêmico & Anotações */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Status Acadêmico</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="MATRICULADO">Matriculado</option>
                        <option value="REMATRICULADO">Rematriculado</option>
                        <option value="LISTA_DE_ESPERA">Lista de Espera</option>
                        <option value="TRANSFERIDO">Transferido</option>
                        <option value="CANCELADO">Cancelado</option>
                        <option value="CONCLUIDO">Concluído</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Observações / Anotações Gerais</label>
                      <textarea
                        rows={3}
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" isLoading={saveLoading} leftIcon={<Save className="h-4 w-4" />}>
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                {/* Personal info */}
                <section>
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">
                    Informações Pessoais
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoRow icon={CreditCard} label="CPF" value={student.cpf} />
                    <InfoRow icon={FileText} label="RG" value={student.rg} />
                    <InfoRow
                      icon={Calendar}
                      label="Nascimento"
                      value={formatDate(student.user.profile?.birthDate)}
                    />
                    <InfoRow icon={Heart} label="Sexo" value={student.gender} />
                  </div>
                </section>

                {/* Contact */}
                <section>
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">
                    Contato
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <InfoRow icon={Mail} label="E-mail" value={student.user.email} />
                    <InfoRow icon={Phone} label="Telefone" value={student.user.profile?.phone} />
                    <InfoRow icon={MessageCircle} label="WhatsApp" value={student.whatsapp} />
                  </div>
                </section>

                {/* Address */}
                <section>
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">
                    Endereço
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <InfoRow icon={MapPin} label="Logradouro" value={student.address} />
                    </div>
                    <InfoRow icon={MapPin} label="Cidade" value={student.city} />
                    <InfoRow icon={MapPin} label="Estado" value={student.state} />
                    <InfoRow icon={MapPin} label="CEP" value={student.cep} />
                  </div>
                </section>

                {/* Filiation */}
                <section>
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">
                    Filiação (Pai / Mãe)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoRow icon={User} label="Nome do Pai" value={student.fatherName} />
                    <InfoRow icon={User} label="Nome da Mãe" value={student.motherName} />
                  </div>
                </section>

                {/* Linked Guardians */}
                <section>
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">
                    Responsáveis Vinculados ({student.guardians?.length || 0})
                  </h3>
                  {student.guardians?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic bg-secondary/10 p-3 rounded-lg border border-border">
                      Nenhum responsável vinculado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {student.guardians.map(({ guardian }) => (
                        <div
                          key={guardian.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/35 transition-colors"
                        >
                          <div className="text-xs">
                            <p className="font-semibold text-foreground">{guardian.name}</p>
                            <p className="text-muted-foreground mt-0.5">
                              {guardian.relationship || 'Responsável'}{' '}
                              {guardian.phone ? `• ${guardian.phone}` : ''}
                            </p>
                          </div>
                          {guardian.isFinancial ? (
                            <Badge variant="success" className="text-[10px]">
                              Financeiro
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Pedagógico
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Notes */}
                <section>
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">
                    Observações
                  </h3>
                  <div className="space-y-3">
                    {student.notes ? (
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <div className="flex items-start gap-2">
                          <StickyNote className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-amber-600 mb-1">
                              Anotações Gerais
                            </p>
                            <p className="text-xs text-foreground leading-relaxed">
                              {student.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Nenhuma observação registrada.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            )
          )}

            {/* ─ Documentos Tab ─ */}
            {activeTab === 'documentos' && (
              <div className="space-y-5">
                {/* Upload form */}
                <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 space-y-3">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    Enviar Novo Documento
                  </p>
                  <form onSubmit={handleUpload} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nome do documento (ex: RG, CPF, Histórico)"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                      className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: PNG, JPG, PDF, DOC, DOCX (máx. 10MB)
                    </p>
                    <Button
                      type="submit"
                      size="sm"
                      isLoading={uploadLoading}
                      leftIcon={<Upload className="h-3.5 w-3.5" />}
                      className="w-full"
                    >
                      Enviar Arquivo
                    </Button>
                  </form>
                </div>

                {/* Document list */}
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">
                    Documentos Anexados ({student.documents.length})
                  </p>
                  {student.documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum documento enviado ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {student.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                        >
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(doc.createdAt)}
                            </p>
                          </div>
                          <a
                            href={`${API_BASE}${doc.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                            title="Visualizar/Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─ Histórico Tab ─ */}
            {activeTab === 'historico' && (
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">
                  Linha do Tempo Acadêmica ({student.history.length} eventos)
                </p>
                {student.history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum registro histórico.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

                    <div className="space-y-4 pl-10">
                      {student.history.map((item) => {
                        const meta = actionLabels[item.action] || {
                          label: item.action,
                          color: 'bg-secondary text-foreground border-border',
                        };
                        const isGood = [
                          'MATRICULA',
                          'DOCUMENTO_ENVIADO',
                          'ALTERACAO_DADOS',
                        ].includes(item.action);
                        return (
                          <div key={item.id} className="relative">
                            {/* Timeline dot */}
                            <div
                              className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                isGood
                                  ? 'border-primary bg-primary/10'
                                  : 'border-destructive bg-destructive/10'
                              }`}
                            >
                              {isGood ? (
                                <CheckCircle2 className="h-2.5 w-2.5 text-primary" />
                              ) : (
                                <AlertCircle className="h-2.5 w-2.5 text-destructive" />
                              )}
                            </div>

                            <div className="p-3 rounded-lg border border-border bg-secondary/20">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${meta.color}`}
                                >
                                  {meta.label}
                                </span>
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">
                                {item.details}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDateTime(item.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="pt-4 mt-4 border-t border-border">
            <Button variant="outline" className="w-full" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
          <AlertCircle className="h-8 w-8 opacity-40" />
          <p className="text-sm">Aluno não encontrado.</p>
        </div>
      )}
    </Drawer>
  );
};

// ─── InfoRow subcomponent ─────────────────────────────────────────────────────
const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) => (
  <div className="flex items-start gap-2.5">
    <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  </div>
);

export default StudentDetailsDrawer;
