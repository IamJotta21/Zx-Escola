import React, { useEffect, useState } from 'react';
import { useImport } from '../../hooks/useImport';
import { getEntityFields } from '../../utils/import.utils';
import { TargetEntity } from '../../types/import.type';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Plus, Settings2, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ModelosImportacao: React.FC = () => {
  const { models, loading, fetchModels, createModel } = useImport();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetEntity, setTargetEntity] = useState<TargetEntity>('STUDENT');
  const [originSystem, setOriginSystem] = useState('');
  const [mappings, setMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Sync mappings with target entity fields
  useEffect(() => {
    const fields = getEntityFields(targetEntity);
    const newMappings: Record<string, string> = {};
    fields.forEach((f) => {
      newMappings[f.label] = f.field;
    });
    setMappings(newMappings);
  }, [targetEntity]);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await createModel({
        name,
        description: description || undefined,
        targetEntity,
        mapping: mappings,
        originSystem: originSystem || undefined,
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setOriginSystem('');
    } catch (e) {
      // Toast context handles it
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex flex-col gap-3">
        <Link
          to="/importacao-inteligente/dashboard"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Painel Geral
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">
              Modelos de Mapeamento
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure modelos de cabeçalho personalizados para as planilhas do seu colégio.
            </p>
          </div>
          <div>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
              Novo Modelo
            </Button>
          </div>
        </div>
      </div>

      {/* Grid of models */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && models.length === 0 ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border-border/60">
              <CardContent className="h-48" />
            </Card>
          ))
        ) : models.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-card">
            <Settings2 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">Nenhum modelo cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre o primeiro modelo de planilha customizado.
            </p>
          </div>
        ) : (
          models.map((model) => (
            <Card
              key={model.id}
              className="border-border/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <CardHeader>
                <div className="flex justify-between items-center gap-2">
                  <Badge variant="outline">{model.targetEntity}</Badge>
                  {model.originSystem && (
                    <span className="text-[10px] text-muted-foreground bg-slate-50 dark:bg-slate-900 border p-0.5 px-2 rounded-md font-medium">
                      {model.originSystem}
                    </span>
                  )}
                </div>
                <CardTitle className="mt-3 text-lg">{model.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                  {model.description || 'Sem descrição cadastrada.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs">
                <span className="font-semibold text-foreground block mb-2">
                  Cabeçalhos Identificados:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                  {Object.keys(model.mapping || {}).map((excelKey) => (
                    <span
                      key={excelKey}
                      className="inline-flex items-center gap-1.5 p-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-muted-foreground border"
                    >
                      <span
                        className="font-bold text-foreground truncate max-w-[60px]"
                        title={excelKey}
                      >
                        {excelKey}
                      </span>
                      <span>→</span>
                      <span className="truncate max-w-[60px]" title={model.mapping[excelKey]}>
                        {model.mapping[excelKey]}
                      </span>
                    </span>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 pt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Excluir Modelo
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Model Creation Modal */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          title="Novo Modelo de Importação"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Nome do Modelo"
              placeholder="Ex: Alunos Novos - Matrículas 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Descrição"
              placeholder="Descreva a finalidade ou origem do layout"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Entidade de Destino"
                value={targetEntity}
                onChange={(e) => setTargetEntity(e.target.value as TargetEntity)}
                options={[
                  { value: 'STUDENT', label: 'Alunos (students)' },
                  { value: 'TEACHER', label: 'Professores (teachers)' },
                  { value: 'GUARDIAN', label: 'Responsáveis (guardians)' },
                  { value: 'CLASS', label: 'Turmas (classes)' },
                  { value: 'ROOM', label: 'Salas (rooms)' },
                ]}
              />
              <Input
                label="Sistema de Origem (Opcional)"
                placeholder="Ex: Q-Acadêmico, Giz, Excel"
                value={originSystem}
                onChange={(e) => setOriginSystem(e.target.value)}
              />
            </div>

            <div className="border-t border-border/50 pt-4 mt-6">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                Mapeador de Colunas
                <span className="text-[10px] text-muted-foreground font-normal">
                  (Escreva o cabeçalho do Excel correspondente)
                </span>
              </h3>

              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {getEntityFields(targetEntity).map((field) => (
                  <div
                    key={field.field}
                    className="grid grid-cols-2 gap-4 items-center p-2 rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
                  >
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-rose-500">*</span>}
                    </span>
                    <Input
                      placeholder="Cabeçalho da planilha (ex: E-mail)"
                      value={Object.keys(mappings).find((k) => mappings[k] === field.field) || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const oldKey = Object.keys(mappings).find(
                          (k) => mappings[k] === field.field
                        );
                        setMappings((prev) => {
                          const next = { ...prev };
                          if (oldKey) delete next[oldKey];
                          if (val) next[val] = field.field;
                          return next;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!name}>
                Salvar Modelo
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ModelosImportacao;
