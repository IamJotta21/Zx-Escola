import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Printer,
  Download,
  Search,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { isValidFileSize, isValidFileType } from '../utils/validators';

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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StudentShort {
  id: string;
  user: { profile?: { firstName: string; lastName: string } | null };
}
interface SchoolDoc {
  id: string;
  type: string;
  title: string;
  content?: string;
  filePath?: string;
  fileName?: string;
  studentId?: string;
  studentName?: string;
  issuedBy?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const DOC_TYPES = [
  { value: 'DECLARACAO', label: 'Declaração de Matrícula' },
  { value: 'HISTORICO', label: 'Histórico Escolar' },
  { value: 'CONTRATO', label: 'Contrato de Prestação de Serviços' },
  { value: 'ATESTADO', label: 'Atestado de Frequência' },
  { value: 'OUTRO', label: 'Outro Documento' },
];

const TEMPLATES: Record<string, string> = {
  DECLARACAO: `DECLARAÇÃO DE MATRÍCULA\n\nDeclaramos para os devidos fins que o(a) aluno(a) {{NOME_ALUNO}} está regularmente matriculado(a) nesta instituição de ensino no ano letivo de {{ANO_LETIVO}}, cursando o(a) {{SERIE_TURMA}}.\n\nPor ser verdade, emitimos a presente declaração.\n\n__________________________________________\nDireção / Secretaria Escolar`,
  HISTORICO: `HISTÓRICO ESCOLAR\n\nAluno(a): {{NOME_ALUNO}}\nPeríodo: {{ANO_LETIVO}}\n\nDisciplinas cursadas e notas:\n- Português: ___\n- Matemática: ___\n- Ciências: ___\n- História: ___\n- Geografia: ___\n\nSituação Final: ___________\n\n__________________________________________\nDireção`,
  CONTRATO: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS\n\nPartes: ESCOLA _____ e o(a) Responsável pelo(a) aluno(a) {{NOME_ALUNO}}.\nAno Letivo: {{ANO_LETIVO}}\n\nCláusula 1ª – DOS SERVIÇOS: A escola se compromete a prestar serviços de ensino fundamental/médio.\nCláusula 2ª – DA MENSALIDADE: Fica acordado o valor de R$ _____ mensais.\n\nAssinaturas:\n_______________________        _______________________\nResponsável pela Escola          Responsável pelo Aluno`,
  ATESTADO: `ATESTADO DE FREQUÊNCIA\n\nAtestamos que o(a) aluno(a) {{NOME_ALUNO}} apresenta frequência de ___% no período de {{ANO_LETIVO}}, atendendo ao mínimo exigido por lei de 75%.\n\n__________________________________________\nSecretaria Escolar`,
  OUTRO: '',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export const DocumentsPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'upload'>('list');

  // Data
  const [docs, setDocs] = useState<SchoolDoc[]>([]);
  const [students, setStudents] = useState<StudentShort[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form
  const [docForm, setDocForm] = useState({
    type: 'DECLARACAO',
    title: '',
    content: '',
    studentId: '',
    studentName: '',
    issuedBy: '',
    status: 'EMITIDO',
  });
  const [editingDoc, setEditingDoc] = useState<SchoolDoc | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);

  // Print/Preview modal
  const [previewDoc, setPreviewDoc] = useState<SchoolDoc | null>(null);

  // Upload
  const [uploadTarget, setUploadTarget] = useState<SchoolDoc | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDocs = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;
      const r = await api.get('/schooldocs', { params });
      setDocs(r.data.data);
    } catch {
      /* silent */
    }
  }, [filterType, filterStatus, searchTerm]);

  const fetchStudents = useCallback(async () => {
    try {
      const r = await api.get('/students', { params: { limit: '200' } });
      setStudents(r.data.data.students || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchDocs();
    fetchStudents();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Document CRUD ──────────────────────────────────────────────────────────
  const openCreateForm = (doc?: SchoolDoc) => {
    setEditingDoc(doc || null);
    setDocForm(
      doc
        ? {
            type: doc.type,
            title: doc.title,
            content: doc.content || '',
            studentId: doc.studentId || '',
            studentName: doc.studentName || '',
            issuedBy: doc.issuedBy || '',
            status: doc.status,
          }
        : {
            type: 'DECLARACAO',
            title: 'Declaração de Matrícula',
            content: TEMPLATES['DECLARACAO'],
            studentId: '',
            studentName: '',
            issuedBy: '',
            status: 'EMITIDO',
          }
    );
    setActiveTab('create');
  };

  const handleTypeChange = (type: string) => {
    const label = DOC_TYPES.find((d) => d.value === type)?.label || '';
    setDocForm((f) => ({ ...f, type, title: label, content: TEMPLATES[type] || '' }));
  };

  const handleStudentChange = (id: string) => {
    const st = students.find((s) => s.id === id);
    const name = st?.user.profile ? `${st.user.profile.firstName} ${st.user.profile.lastName}` : '';
    setDocForm((f) => ({ ...f, studentId: id, studentName: name }));
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDoc(true);
    try {
      if (editingDoc) {
        await api.put(`/schooldocs/${editingDoc.id}`, docForm);
        addToast({ type: 'success', message: 'Documento atualizado.' });
      } else {
        await api.post('/schooldocs', docForm);
        addToast({ type: 'success', message: 'Documento emitido com sucesso.' });
      }
      fetchDocs();
      setActiveTab('list');
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar documento.' });
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este documento permanentemente?')) return;
    try {
      await api.delete(`/schooldocs/${id}`);
      fetchDocs();
      addToast({ type: 'success', message: 'Documento removido.' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao remover documento.' });
    }
  };

  // ─── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadTarget || !fileRef.current?.files?.[0]) return;
    const file = fileRef.current.files[0];

    // Validate size and format
    if (!isValidFileType(file)) {
      addToast({
        type: 'warning',
        message: 'Formato de arquivo não permitido. Apenas PDF, JPG, PNG e DOCX são aceitos.',
      });
      return;
    }
    if (!isValidFileSize(file, 10)) {
      // 10MB limit
      addToast({
        type: 'warning',
        message: 'O tamanho máximo do arquivo deve ser de 10MB.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploadingFile(true);
    try {
      await api.post(`/schooldocs/${uploadTarget.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast({ type: 'success', message: 'Arquivo enviado com sucesso.' });
      setIsUploadModalOpen(false);
      fetchDocs();
    } catch {
      addToast({ type: 'error', message: 'Erro ao enviar arquivo.' });
    } finally {
      setUploadingFile(false);
    }
  };

  // ─── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const statusBadge = (s: string) => {
    if (s === 'EMITIDO') return <Badge variant="success">Emitido</Badge>;
    if (s === 'ASSINADO') return <Badge variant="outline">Assinado</Badge>;
    return <Badge variant="warning">Rascunho</Badge>;
  };

  const typeLabelMap = Object.fromEntries(DOC_TYPES.map((d) => [d.value, d.label]));

  const tabs = [
    { key: 'list', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
    {
      key: 'create',
      label: editingDoc ? 'Editar Documento' : 'Emitir Documento',
      icon: <Plus className="h-4 w-4" />,
    },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:space-y-2 print:p-0">
      {/* Print layout header */}
      <div className="hidden print:block border-b-2 border-primary pb-3 mb-4">
        <h1 className="text-xl font-extrabold">{previewDoc?.title || 'Documento Escolar'}</h1>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Secretaria Digital
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Declarações, históricos, contratos e documentos escolares.
          </p>
        </div>
        {activeTab === 'list' && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => openCreateForm()}>
            Emitir Documento
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border print:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── List Tab ────────────────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <Card className="stripe-card print:hidden">
          <CardContent className="p-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar..."
                  onKeyDown={(e) => e.key === 'Enter' && fetchDocs()}
                  className="pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Select
                label=""
                options={[{ value: '', label: 'Todos os tipos' }, ...DOC_TYPES]}
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                }}
              />
              <Select
                label=""
                options={[
                  { value: '', label: 'Todos os status' },
                  { value: 'RASCUNHO', label: 'Rascunho' },
                  { value: 'EMITIDO', label: 'Emitido' },
                  { value: 'ASSINADO', label: 'Assinado' },
                ]}
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                }}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Emitido por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground text-xs py-10"
                    >
                      Nenhum documento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  docs.map((d) => (
                    <TableRow key={d.id} className="group">
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {typeLabelMap[d.type] || d.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground text-xs">
                        {d.title}
                      </TableCell>
                      <TableCell className="text-xs">{d.studentName || '—'}</TableCell>
                      <TableCell className="text-xs">{d.issuedBy || '—'}</TableCell>
                      <TableCell className="font-mono text-[10px]">
                        {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.fileName ? (
                          <a
                            href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/uploads/${d.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            {d.fileName}
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(d.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-primary"
                            title="Visualizar / Imprimir"
                            onClick={() => {
                              setPreviewDoc(d);
                              setActiveTab('create');
                              openCreateForm(d);
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openCreateForm(d)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-primary"
                            title="Anexar PDF/Arquivo"
                            onClick={() => {
                              setUploadTarget(d);
                              setIsUploadModalOpen(true);
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDelete(d.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Create/Edit + Print Tab ─────────────────────────────────────────────── */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          {/* Print-only content */}
          <div className="hidden print:block whitespace-pre-wrap text-sm text-foreground leading-relaxed">
            {docForm.content}
          </div>

          {/* Screen form */}
          <Card className="stripe-card print:hidden">
            <CardContent className="p-6">
              <form onSubmit={handleSaveDoc} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select
                    label="Tipo de Documento *"
                    options={DOC_TYPES}
                    value={docForm.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  />
                  <Input
                    label="Título *"
                    value={docForm.title}
                    onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                  <Select
                    label="Aluno Vinculado"
                    options={[
                      { value: '', label: 'Nenhum / Geral' },
                      ...students.map((s) => ({
                        value: s.id,
                        label: s.user.profile
                          ? `${s.user.profile.firstName} ${s.user.profile.lastName}`
                          : s.id,
                      })),
                    ]}
                    value={docForm.studentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                  />
                  <Input
                    label="Emitido por"
                    value={docForm.issuedBy}
                    onChange={(e) => setDocForm((f) => ({ ...f, issuedBy: e.target.value }))}
                  />
                  <Select
                    label="Status"
                    options={[
                      { value: 'RASCUNHO', label: 'Rascunho' },
                      { value: 'EMITIDO', label: 'Emitido' },
                      { value: 'ASSINADO', label: 'Assinado' },
                    ]}
                    value={docForm.status}
                    onChange={(e) => setDocForm((f) => ({ ...f, status: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Conteúdo do Documento
                  </label>
                  <textarea
                    value={docForm.content}
                    onChange={(e) => setDocForm((f) => ({ ...f, content: e.target.value }))}
                    rows={14}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    leftIcon={<Printer className="h-4 w-4" />}
                    onClick={handlePrint}
                  >
                    Imprimir / PDF
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveTab('list');
                        setEditingDoc(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      isLoading={savingDoc}
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      {editingDoc ? 'Atualizar Documento' : 'Emitir Documento'}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Upload Modal ─────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Anexar Arquivo (PDF / DOC)"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Documento: <strong className="text-foreground">{uploadTarget?.title}</strong>
          </p>
          <div
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Clique para selecionar um arquivo PDF, DOC ou DOCX
            </p>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              isLoading={uploadingFile}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Enviar Arquivo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default DocumentsPage;
