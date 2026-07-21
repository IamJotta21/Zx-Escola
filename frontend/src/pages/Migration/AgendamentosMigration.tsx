import React, { useEffect, useState, useCallback } from 'react';
import migrationService from '../../services/migration.service';
import { ScheduledJob, JobExecution, ImportModel } from '../../types/migration.type';
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
  Clock,
  Play,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Sliders,
  FolderSync,
  History,
  FolderCheck,
} from 'lucide-react';

export const AgendamentosMigration: React.FC = () => {
  const { addToast } = useToast();
  const [schedules, setSchedules] = useState<ScheduledJob[]>([]);
  const [importModels, setImportModels] = useState<ImportModel[]>([]);
  const [loading, setLoading] = useState(false);

  // Executions Panel State
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);

  // Form Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [jobType, setJobType] = useState<'EXPORT_AUTOMATIC' | 'IMPORT_DIRECTORY'>(
    'EXPORT_AUTOMATIC'
  );
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY_FRIDAY' | 'CRON'>('DAILY');
  const [timeOfDay, setTimeOfDay] = useState('22:00');

  // Config states
  const [selectedImportModel, setSelectedImportModel] = useState('');
  const [format, setFormat] = useState('ZIP');
  const [modules, setModules] = useState<string[]>(['ALUNOS']);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await migrationService.getScheduledJobs();
      setSchedules(data);
    } catch {
      addToast({
        type: 'error',
        title: 'Erro ao buscar agendamentos',
        message: 'Não foi possível carregar as tarefas programadas.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchImportModels = useCallback(async () => {
    try {
      const data = await migrationService.getImportModels();
      setImportModels(data);
      if (data.length > 0) setSelectedImportModel(data[0].id);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchImportModels();
  }, [fetchSchedules, fetchImportModels]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setJobType('EXPORT_AUTOMATIC');
    setFrequency('DAILY');
    setTimeOfDay('22:00');
    setFormat('ZIP');
    setModules(['ALUNOS']);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (j: ScheduledJob) => {
    setEditingId(j.id);
    setName(j.name);
    setJobType(j.type);
    setFrequency(j.frequency);
    setTimeOfDay(j.timeOfDay || '22:00');

    const config = JSON.parse(j.config);
    if (j.type === 'IMPORT_DIRECTORY') {
      setSelectedImportModel(config.importModelId || '');
    } else {
      setFormat(config.format || 'ZIP');
      setModules(config.modules || ['ALUNOS']);
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const configObj: Record<string, unknown> = {};
      if (jobType === 'IMPORT_DIRECTORY') {
        configObj.importModelId = selectedImportModel;
      } else {
        configObj.format = format;
        configObj.modules = modules;
        configObj.filterType = 'COMPLETO';
      }

      const payload = {
        name,
        type: jobType,
        frequency,
        timeOfDay,
        config: JSON.stringify(configObj),
      };

      if (editingId) {
        await migrationService.updateScheduledJob(editingId, payload);
        addToast({
          type: 'success',
          title: 'Agendamento atualizado',
          message: 'Tarefa programada editada.',
        });
      } else {
        await migrationService.createScheduledJob(payload);
        addToast({
          type: 'success',
          title: 'Agendamento criado',
          message: 'Nova tarefa programada com sucesso.',
        });
      }

      setIsDrawerOpen(false);
      fetchSchedules();
    } catch {
      addToast({ type: 'error', title: 'Erro ao salvar', message: 'Verifique as configurações.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta tarefa agendada permanentemente?')) return;
    try {
      await migrationService.deleteScheduledJob(id);
      addToast({ type: 'success', title: 'Tarefa removida', message: 'Agendamento excluído.' });
      fetchSchedules();
      if (selectedJob?.id === id) setSelectedJob(null);
    } catch {
      addToast({ type: 'error', title: 'Falha ao remover', message: 'Erro interno.' });
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await migrationService.toggleScheduledJob(id, !currentActive);
      addToast({
        type: 'success',
        title: 'Status alterado',
        message: 'Tarefa ativada/desativada com sucesso.',
      });
      fetchSchedules();
    } catch {
      addToast({ type: 'error', title: 'Falha ao alterar', message: 'Erro interno.' });
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      await migrationService.runScheduledJobNow(id);
      addToast({
        type: 'success',
        title: 'Tarefa disparada',
        message: 'Execução manual agendada em background.',
      });
      fetchSchedules();
    } catch {
      addToast({ type: 'error', title: 'Falha ao executar', message: 'Erro interno.' });
    }
  };

  const handleOpenExecutions = async (job: ScheduledJob) => {
    setSelectedJob(job);
    setLoadingExecutions(true);
    try {
      const logs = await migrationService.getJobExecutions(job.id);
      setExecutions(logs);
    } catch {
      // Ignore
    } finally {
      setLoadingExecutions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            Agendamentos de Migração
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Programe tarefas automáticas de exportação periódica ou importação de pastas
            monitoradas.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={fetchSchedules}
            disabled={loading}
          />
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenCreate}>
            Novo Agendamento
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Schedules list */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">
              <Spinner size="md" /> Carregando agendamentos...
            </div>
          ) : schedules.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-10 text-center">
                <FolderSync className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold">Nenhuma tarefa agendada</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Gere rotinas de backup ou sincronização.
                </p>
              </CardContent>
            </Card>
          ) : (
            schedules.map((j) => (
              <Card
                key={j.id}
                className={`border-border/60 hover:shadow-xs transition-shadow cursor-pointer ${
                  selectedJob?.id === j.id ? 'border-primary ring-1 ring-primary/20' : ''
                }`}
                onClick={() => handleOpenExecutions(j)}
              >
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 ${j.type === 'IMPORT_DIRECTORY' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' : 'bg-blue-50 dark:bg-blue-950/20 text-blue-500'}`}
                    >
                      {j.type === 'IMPORT_DIRECTORY' ? (
                        <FolderSync className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground truncate">{j.name}</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-bold tracking-wider"
                        >
                          {j.frequency === 'DAILY' ? 'Diário' : 'Toda Sexta'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Hora: <strong className="text-foreground">{j.timeOfDay || '—'}</strong>
                        {' · '}
                        Tipo:{' '}
                        <strong className="text-foreground">
                          {j.type === 'IMPORT_DIRECTORY'
                            ? 'Importação de Pasta'
                            : 'Exportação Automática'}
                        </strong>
                      </p>
                      {j.lastRun && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Última execução: {new Date(j.lastRun).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={j.isActive}
                        onChange={() => handleToggleActive(j.id, j.isActive)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleRunNow(j.id)}
                      title="Executar agora"
                    >
                      <Play className="h-4 w-4 text-muted-foreground hover:text-emerald-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenEdit(j)}
                      title="Editar agendamento"
                    >
                      <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDelete(j.id)}
                      title="Remover agendamento"
                    >
                      <Trash2 className="h-4 w-4 text-rose-500 hover:bg-rose-50" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Executions panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Histórico de Execuções
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedJob
                  ? `Logs de execução de "${selectedJob.name}"`
                  : 'Selecione uma tarefa para ver os logs.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingExecutions ? (
                <div className="flex items-center justify-center py-10 text-xs text-muted-foreground gap-2">
                  <Spinner size="sm" /> Buscando logs...
                </div>
              ) : !selectedJob ? (
                <div className="text-xs text-muted-foreground text-center py-10">
                  Nenhum agendamento selecionado.
                </div>
              ) : executions.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-10">
                  Nenhuma execução registrada para este agendamento.
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {executions.map((e) => (
                    <div key={e.id} className="p-3 rounded-xl border bg-card text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {new Date(e.createdAt).toLocaleString('pt-BR')}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            e.status === 'SUCCESS'
                              ? 'border-emerald-500 text-emerald-600'
                              : 'border-rose-500 text-rose-600'
                          }
                        >
                          {e.status === 'SUCCESS' ? 'Sucesso' : 'Falhou'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {e.logs || 'Sem detalhes registrados.'}
                      </p>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Duração: {e.runTimeMs}ms
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Editor Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nome da Regra / Tarefa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Tipo de Rotina"
            value={jobType}
            onChange={(e) => setJobType(e.target.value as 'EXPORT_AUTOMATIC' | 'IMPORT_DIRECTORY')}
            options={[
              { value: 'EXPORT_AUTOMATIC', label: 'Exportação Automática da Base' },
              { value: 'IMPORT_DIRECTORY', label: 'Importação Automática de Pasta Monitorada' },
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Frequência"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'DAILY' | 'WEEKLY_FRIDAY' | 'CRON')}
              options={[
                { value: 'DAILY', label: 'Diário' },
                { value: 'WEEKLY_FRIDAY', label: 'Toda Sexta-feira' },
              ]}
            />
            <Input
              label="Hora da Execução (HH:MM)"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              placeholder="22:00"
              required
            />
          </div>

          {/* Configuration Specifics */}
          {jobType === 'IMPORT_DIRECTORY' ? (
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/30 space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <FolderCheck className="h-4 w-4 text-primary" />
                Configurações da Pasta Monitorada
              </h4>
              <p className="text-[10px] text-muted-foreground leading-normal">
                O sistema irá ler todos os arquivos colocados em{' '}
                <code className="font-mono bg-card px-1 py-0.5 border rounded">
                  src/uploads/monitored
                </code>{' '}
                e processá-los automaticamente.
              </p>
              <Select
                label="Modelo de Mapeamento"
                value={selectedImportModel}
                onChange={(e) => setSelectedImportModel(e.target.value)}
                options={importModels.map((m) => ({
                  value: m.id,
                  label: `${m.name} (${m.targetEntity})`,
                }))}
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/30 space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-primary" />
                Configurações de Exportação
              </h4>
              <Select
                label="Formato de Backup"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                options={[
                  { value: 'ZIP', label: 'ZIP (Multi-arquivo)' },
                  { value: 'XLSX', label: 'Excel (.xlsx)' },
                  { value: 'JSON', label: 'JSON' },
                ]}
              />
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">
                  Módulos inclusos no Backup
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['ALUNOS', 'RESPONSAVEIS', 'PROFESSORES', 'FINANCEIRO'].map((mod) => {
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
              Agendar Tarefa
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};

export default AgendamentosMigration;
