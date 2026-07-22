import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Lock,
  Search,
  CheckSquare,
  Square,
  CheckCircle2,
  Users,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
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

export interface RoleProfileItem {
  id: string;
  name: string;
  description?: string | null;
  isSystemDefault: boolean;
  isActive: boolean;
  tenantId?: string | null;
  permissions: string; // JSON string
  createdAt: string;
}

export const MODULE_DEFINITIONS = [
  { key: 'dashboard', label: 'Dashboard Analítico', actions: ['view'] },
  { key: 'students', label: 'Alunos & Matrículas', actions: ['view', 'create', 'edit', 'delete', 'export', 'import'] },
  { key: 'teachers', label: 'Professores & Corpo Docente', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'employees', label: 'Funcionários & Equipe', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'guardians', label: 'Responsáveis Legais', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'classes', label: 'Turmas & Diário de Classe', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'financial', label: 'Financeiro & Cobranças', actions: ['view', 'receive', 'cancel', 'bill', 'export'] },
  { key: 'library', label: 'Biblioteca Digital & Acervo', actions: ['view', 'lend', 'return', 'create_book', 'delete_book'] },
  { key: 'secretary', label: 'Secretaria & Documentação', actions: ['view', 'issue_docs', 'edit_records', 'import', 'export'] },
  { key: 'communication', label: 'Comunicação & Avisos', actions: ['view', 'send', 'edit', 'delete'] },
  { key: 'reports', label: 'Relatórios & Exportações', actions: ['view', 'export_pdf', 'export_excel'] },
  { key: 'aiAssistant', label: 'Assistente com IA', actions: ['use', 'manage'] },
  { key: 'imports', label: 'Importação Inteligente', actions: ['view', 'execute'] },
  { key: 'exports', label: 'Exportação Completa', actions: ['view', 'execute'] },
  { key: 'migration', label: 'Central de Migração', actions: ['view', 'execute'] },
  { key: 'settings', label: 'Configurações do Sistema', actions: ['view', 'edit'] },
];

export const ACTION_LABELS: Record<string, string> = {
  view: 'Visualizar',
  create: 'Cadastrar',
  edit: 'Editar',
  delete: 'Excluir',
  export: 'Exportar',
  import: 'Importar',
  receive: 'Receber',
  cancel: 'Cancelar',
  bill: 'Cobrar',
  lend: 'Emprestar',
  return: 'Devolver',
  create_book: 'Cad. Livro',
  delete_book: 'Exc. Livro',
  issue_docs: 'Emitir Doc.',
  edit_records: 'Alt. Registros',
  send: 'Enviar',
  export_pdf: 'PDF',
  export_excel: 'Excel',
  use: 'Utilizar',
  manage: 'Gerenciar',
  execute: 'Executar',
};

export const RolesPage: React.FC = () => {
  const { addToast } = useToast();
  const [roles, setRoles] = useState<RoleProfileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleProfileItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [matrixState, setMatrixState] = useState<Record<string, string[]>>({});

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/roles');
      setRoles(res.data.data || []);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar matriz de perfis RBAC.' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormName('');
    setFormDesc('');

    // Default matrix with view enabled
    const initialMatrix: Record<string, string[]> = {};
    MODULE_DEFINITIONS.forEach((mod) => {
      initialMatrix[mod.key] = ['view'];
    });
    setMatrixState(initialMatrix);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: RoleProfileItem) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDesc(role.description || '');

    try {
      setMatrixState(JSON.parse(role.permissions));
    } catch {
      setMatrixState({});
    }
    setIsModalOpen(true);
  };

  const handleDuplicate = async (role: RoleProfileItem) => {
    try {
      await api.post(`/roles/${role.id}/duplicate`);
      addToast({ type: 'success', message: `Perfil ${role.name} duplicado com sucesso!` });
      fetchRoles();
    } catch {
      addToast({ type: 'error', message: 'Erro ao duplicar perfil.' });
    }
  };

  const handleDelete = async (role: RoleProfileItem) => {
    if (role.isSystemDefault) {
      addToast({ type: 'warning', message: 'Perfis padrão do sistema não podem ser excluídos.' });
      return;
    }

    try {
      await api.delete(`/roles/${role.id}`);
      addToast({ type: 'success', message: `Perfil ${role.name} excluído.` });
      fetchRoles();
    } catch {
      addToast({ type: 'error', message: 'Erro ao excluir perfil.' });
    }
  };

  const handleSelectAll = () => {
    const fullMatrix: Record<string, string[]> = {};
    MODULE_DEFINITIONS.forEach((mod) => {
      fullMatrix[mod.key] = [...mod.actions];
    });
    setMatrixState(fullMatrix);
    addToast({ type: 'info', message: 'Todas as permissões foram marcadas.' });
  };

  const handleRemoveAll = () => {
    const emptyMatrix: Record<string, string[]> = {};
    MODULE_DEFINITIONS.forEach((mod) => {
      emptyMatrix[mod.key] = [];
    });
    setMatrixState(emptyMatrix);
    addToast({ type: 'info', message: 'Todas as permissões foram removidas.' });
  };

  const toggleAction = (moduleKey: string, actionKey: string) => {
    setMatrixState((prev) => {
      const currentActions = prev[moduleKey] || [];
      const updated = currentActions.includes(actionKey)
        ? currentActions.filter((a) => a !== actionKey)
        : [...currentActions, actionKey];
      return { ...prev, [moduleKey]: updated };
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      addToast({ type: 'warning', message: 'O nome do perfil é obrigatório.' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formName,
        description: formDesc || null,
        permissions: matrixState,
      };

      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, payload);
        addToast({ type: 'success', message: 'Perfil de permissões atualizado!' });
      } else {
        await api.post('/roles', payload);
        addToast({ type: 'success', message: 'Novo perfil RBAC criado com sucesso!' });
      }

      setIsModalOpen(false);
      fetchRoles();
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar perfil.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/20 px-2.5 py-1 rounded-md border border-primary/30">
              Segurança &amp; Governança RBAC
            </span>
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {roles.length} Perfil(is) Configurado(s)
            </Badge>
          </div>
          <h1 className="text-2xl font-black">Sistema Avançado de Permissões (RBAC)</h1>
          <p className="text-sm text-slate-300">
            Controle de acesso granular por papéis, módulos e ações no ambiente multi-tenant.
          </p>
        </div>

        <Button
          variant="default"
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleOpenCreate}
          className="shadow-md font-bold"
        >
          Criar Perfil Personalizado
        </Button>
      </div>

      {/* Control Bar */}
      <Card className="stripe-card">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <Input
              placeholder="Pesquisar perfil de acesso..."
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="stripe-card flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    {role.isSystemDefault && <Lock className="h-4 w-4 text-amber-500" title="Perfil Padrão do Sistema" />}
                    {role.name}
                  </CardTitle>
                  <Badge variant={role.isSystemDefault ? 'secondary' : 'default'} className="text-[10px]">
                    {role.isSystemDefault ? 'Padrão' : 'Custom'}
                  </Badge>
                </div>
                <CardDescription className="text-xs min-h-[36px] mt-1">
                  {role.description || 'Sem descrição cadastrada.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4">
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <div>
                    Módulos Liberados:{' '}
                    <strong className="text-foreground">
                      {role.permissions ? Object.keys(JSON.parse(role.permissions)).length : 0} módulos
                    </strong>
                  </div>
                  <div>
                    Origem:{' '}
                    <span className="text-foreground">
                      {role.isSystemDefault ? 'SaaS Global Defaults' : 'Instituição Atual'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </div>

            <div className="p-4 border-t border-border bg-secondary/10 flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(role)}>
                  <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar Permissões
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(role)} title="Duplicar perfil">
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>

              {!role.isSystemDefault && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(role)} title="Excluir perfil">
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* VISUAL PERMISSIONS MATRIX EDITOR MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? `Matriz de Permissões: ${editingRole.name}` : 'Criar Perfil de Acesso RBAC'}
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Nome do Perfil *</label>
              <Input
                placeholder="Ex: Coordenador de Apoio"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Descrição</label>
              <Input
                placeholder="Ex: Responsável por conferência acadêmica"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
          </div>

          {/* Batch Actions: Selecionar Tudo / Remover Tudo */}
          <div className="flex items-center justify-between p-3 bg-secondary/40 rounded-xl border border-border">
            <span className="text-xs font-bold text-foreground">Ações em Lote para a Matriz</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs font-bold"
                onClick={handleSelectAll}
              >
                <CheckSquare className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Selecionar Tudo
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="text-xs font-bold"
                onClick={handleRemoveAll}
              >
                <Square className="h-3.5 w-3.5 mr-1 text-rose-500" /> Remover Tudo
              </Button>
            </div>
          </div>

          {/* Permissions Matrix Table */}
          <div className="max-h-80 overflow-y-auto border border-border rounded-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Módulo do Sistema</TableHead>
                  <TableHead>Ações Permitidas (Marque para Conceder)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MODULE_DEFINITIONS.map((mod) => {
                  const currentModuleActions = matrixState[mod.key] || [];

                  return (
                    <TableRow key={mod.key}>
                      <TableCell className="font-bold text-xs text-foreground">{mod.label}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {mod.actions.map((actKey) => {
                            const isChecked = currentModuleActions.includes(actKey);

                            return (
                              <button
                                key={actKey}
                                type="button"
                                onClick={() => toggleAction(mod.key, actKey)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 ${
                                  isChecked
                                    ? 'bg-primary/10 border-primary/40 text-primary'
                                    : 'bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/50'
                                }`}
                              >
                                {isChecked && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                {ACTION_LABELS[actKey] || actKey}
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="default" size="sm" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editingRole ? 'Salvar Permissões' : 'Criar Perfil'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RolesPage;
