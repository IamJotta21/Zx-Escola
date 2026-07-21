import React, { useEffect, useState, useCallback } from 'react';
import migrationService from '../../services/migration.service';
import { ImportModel, ExportModel } from '../../types/migration.type';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../contexts/ToastContext';
import { Spinner } from '../../components/ui/Loading';
import {
  FileSpreadsheet,
  FileCode,
  Share2,
  Trash2,
  Copy,
  Edit,
  Plus,
  Settings,
} from 'lucide-react';

export const ModelosMigration: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importModels, setImportModels] = useState<ImportModel[]>([]);
  const [exportModels, setExportModels] = useState<ExportModel[]>([]);
  const [loading, setLoading] = useState(false);

  // Drawer / Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isShared, setIsShared] = useState(false);

  // Import specific form states
  const [targetEntity, setTargetEntity] = useState('STUDENT');
  const [mapping, setMapping] = useState('{}');
  const [originSystem, setOriginSystem] = useState('');

  // Export specific form states
  const [format, setFormat] = useState('XLSX');
  const [modules, setModules] = useState<string[]>([]);
  const [filterType, setFilterType] = useState('COMPLETO');

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'import') {
        const data = await migrationService.getImportModels();
        setImportModels(data);
      } else {
        const data = await migrationService.getExportModels();
        setExportModels(data);
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Erro ao buscar modelos',
        message: 'Não foi possível carregar os modelos de mapeamento.',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, addToast]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIsShared(false);
    setTargetEntity('STUDENT');
    setMapping('{\n  "NOME_EXCEL": "firstName",\n  "SOBRENOME_EXCEL": "lastName"\n}');
    setOriginSystem('SGE Legado');
    setFormat('XLSX');
    setModules(['ALUNOS']);
    setFilterType('COMPLETO');
    setIsDrawerOpen(true);
  };

  const handleOpenEditImport = (m: ImportModel) => {
    setEditingId(m.id);
    setName(m.name);
    setDescription(m.description || '');
    setIsShared(m.isShared);
    setTargetEntity(m.targetEntity);
    setMapping(JSON.stringify(JSON.parse(m.mapping), null, 2));
    setOriginSystem(m.originSystem || '');
    setIsDrawerOpen(true);
  };

  const handleOpenEditExport = (m: ExportModel) => {
    setEditingId(m.id);
    setName(m.name);
    setDescription(m.description || '');
    setIsShared(m.isShared);
    setFormat(m.format);
    setModules(m.modules.split(','));
    setFilterType(m.filterType);
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'import') {
        // Save Import Model
        let parsedMapping = {};
        try {
          parsedMapping = JSON.parse(mapping);
        } catch {
          addToast({
            type: 'error',
            title: 'Mapeamento JSON Inválido',
            message: 'Corrija o formato JSON do mapeamento de campos.',
          });
          return;
        }

        const payload = {
          name,
          description,
          targetEntity,
          mapping: JSON.stringify(parsedMapping),
          originSystem,
          isShared,
        };

        if (editingId) {
          await migrationService.updateImportModel(editingId, payload);
          addToast({
            type: 'success',
            title: 'Modelo atualizado',
            message: 'Modelo de importação salvo.',
          });
        } else {
          await migrationService.createImportModel(payload);
          addToast({ type: 'success', title: 'Modelo criado', message: 'Novo modelo cadastrado.' });
        }
      } else {
        // Save Export Model
        const payload = {
          name,
          description,
          format,
          modules: modules.join(','),
          filterType,
          isShared,
        };

        if (editingId) {
          await migrationService.updateExportModel(editingId, payload);
          addToast({
            type: 'success',
            title: 'Modelo atualizado',
            message: 'Modelo de exportação salvo.',
          });
        } else {
          await migrationService.createExportModel(payload);
          addToast({
            type: 'success',
            title: 'Modelo criado',
            message: 'Novo modelo de exportação cadastrado.',
          });
        }
      }
      setIsDrawerOpen(false);
      fetchModels();
    } catch {
      addToast({
        type: 'error',
        title: 'Erro ao salvar modelo',
        message: 'Verifique os dados enviados.',
      });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      if (activeTab === 'import') {
        await migrationService.duplicateImportModel(id);
      } else {
        await migrationService.duplicateExportModel(id);
      }
      addToast({
        type: 'success',
        title: 'Modelo duplicado',
        message: 'Cópia gerada com sucesso.',
      });
      fetchModels();
    } catch {
      addToast({ type: 'error', title: 'Falha ao duplicar', message: 'Erro interno.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este modelo permanentemente?')) return;
    try {
      if (activeTab === 'import') {
        await migrationService.deleteImportModel(id);
      } else {
        await migrationService.deleteExportModel(id);
      }
      addToast({ type: 'success', title: 'Modelo excluído', message: 'Mapeamento removido.' });
      fetchModels();
    } catch {
      addToast({ type: 'error', title: 'Falha ao excluir', message: 'Erro interno.' });
    }
  };

  const handleToggleShare = async (id: string, currentShared: boolean) => {
    try {
      if (activeTab === 'import') {
        await migrationService.shareImportModel(id, !currentShared);
      } else {
        await migrationService.shareExportModel(id, !currentShared);
      }
      addToast({
        type: 'success',
        title: 'Compartilhamento atualizado',
        message: 'Privacidade do modelo alterada.',
      });
      fetchModels();
    } catch {
      addToast({ type: 'error', title: 'Falha ao alterar', message: 'Erro de permissão.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary animate-spin-slow" />
            Modelos de Migração
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie, duplique, gerencie e compartilhe mapeamentos personalizados de dados escolares.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenCreate}>
          Criar Modelo
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all -mb-px ${
            activeTab === 'import'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Modelos de Importação
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all -mb-px ${
            activeTab === 'export'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileCode className="h-4 w-4" />
          Modelos de Exportação
        </button>
      </div>

      {/* List cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-xs text-muted-foreground">
          <Spinner size="md" /> Carregando mapeamentos...
        </div>
      ) : activeTab === 'import' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {importModels.map((m) => (
            <Card key={m.id} className="border-border/60 hover:shadow-xs transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="text-[9px] uppercase font-bold tracking-wider"
                  >
                    {m.targetEntity}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleToggleShare(m.id, m.isShared)}
                      title={m.isShared ? 'Parar de compartilhar' : 'Compartilhar modelo'}
                    >
                      <Share2
                        className={`h-3.5 w-3.5 ${m.isShared ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDuplicate(m.id)}
                      title="Duplicar modelo"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base font-bold mt-2 truncate">{m.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1 min-h-[32px]">
                  {m.description || 'Nenhuma descrição fornecida.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between border-t border-border/40 mt-3 pt-3 text-xs">
                <span className="text-[10px] text-muted-foreground">
                  Origem: <strong className="text-foreground">{m.originSystem || '—'}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleOpenEditImport(m)}
                  >
                    <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500 hover:bg-rose-50" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exportModels.map((m) => (
            <Card key={m.id} className="border-border/60 hover:shadow-xs transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="text-[9px] uppercase font-bold tracking-wider border-blue-500 text-blue-500"
                  >
                    {m.format}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleToggleShare(m.id, m.isShared)}
                      title={m.isShared ? 'Parar de compartilhar' : 'Compartilhar modelo'}
                    >
                      <Share2
                        className={`h-3.5 w-3.5 ${m.isShared ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDuplicate(m.id)}
                      title="Duplicar modelo"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base font-bold mt-2 truncate">{m.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1 min-h-[32px]">
                  {m.description || 'Nenhuma descrição fornecida.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between border-t border-border/40 mt-3 pt-3 text-xs">
                <span className="text-[10px] text-muted-foreground">
                  Escopo: <strong className="text-foreground">{m.filterType}</strong>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleOpenEditExport(m)}
                  >
                    <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500 hover:bg-rose-50" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          editingId
            ? `Editar Modelo de ${activeTab === 'import' ? 'Importação' : 'Exportação'}`
            : `Novo Modelo de ${activeTab === 'import' ? 'Importação' : 'Exportação'}`
        }
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nome do Mapeamento"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              className="rounded text-primary border-input h-4 w-4"
            />
            Compartilhar este mapeamento com outros administradores/diretores
          </label>

          {/* Import Specific Fields */}
          {activeTab === 'import' && (
            <div className="space-y-4 border-t pt-4 mt-2">
              <Select
                label="Entidade Alvo"
                value={targetEntity}
                onChange={(e) => setTargetEntity(e.target.value)}
                options={[
                  { value: 'STUDENT', label: 'Alunos' },
                  { value: 'TEACHER', label: 'Professores' },
                  { value: 'GUARDIAN', label: 'Responsáveis' },
                  { value: 'CLASS', label: 'Turmas' },
                ]}
              />
              <Input
                label="Sistema de Origem (Ex: SGE Antigo)"
                value={originSystem}
                onChange={(e) => setOriginSystem(e.target.value)}
              />
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Mapeamento JSON (Cabeçalho da Planilha → Campo do Banco)
                </label>
                <textarea
                  className="w-full h-32 rounded-xl border border-input bg-card p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  value={mapping}
                  onChange={(e) => setMapping(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Export Specific Fields */}
          {activeTab === 'export' && (
            <div className="space-y-4 border-t pt-4 mt-2">
              <Select
                label="Formato de Saída"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                options={[
                  { value: 'XLSX', label: 'Excel (.xlsx)' },
                  { value: 'ODS', label: 'ODS (.ods)' },
                  { value: 'CSV', label: 'CSV (.csv)' },
                  { value: 'JSON', label: 'JSON (.json)' },
                  { value: 'XML', label: 'XML (.xml)' },
                  { value: 'ZIP', label: 'ZIP (.zip)' },
                ]}
              />
              <Select
                label="Tipo de Filtro"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { value: 'COMPLETO', label: 'Exportação Completa' },
                  { value: 'PERIODO', label: 'Por Período de Datas' },
                  { value: 'TURMA', label: 'Por Turma' },
                  { value: 'ALUNO', label: 'Por Aluno' },
                ]}
              />
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                  Módulos Inclusos
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/30">
                  {[
                    'ALUNOS',
                    'RESPONSAVEIS',
                    'PROFESSORES',
                    'FUNCIONARIOS',
                    'TURMAS',
                    'NOTAS',
                    'FREQUENCIA',
                    'FINANCEIRO',
                  ].map((mod) => {
                    const isChecked = modules.includes(mod);
                    return (
                      <label
                        key={mod}
                        className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setModules((prev) =>
                              prev.includes(mod) ? prev.filter((x) => x !== mod) : [...prev, mod]
                            );
                          }}
                          className="rounded text-primary border-input h-3.5 w-3.5"
                        />
                        {mod}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4 mt-6">
            <Button variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              Salvar Modelo
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};

export default ModelosMigration;
