import React from 'react';
import { ImportModel } from '../../types/import.type';
import { Select } from '../ui/Select';
import { useImport } from '../../hooks/useImport';

interface ImportModelSelectorProps {
  models: ImportModel[];
  selectedId: string;
  onChange: (id: string) => void;
  loading?: boolean;
}

export const ImportModelSelector: React.FC<ImportModelSelectorProps> = ({
  models,
  selectedId,
  onChange,
  loading = false,
}) => {
  const { getEntityLabel } = useImport();

  const options = [
    { value: '', label: 'Selecione um modelo de importação...' },
    ...models.map((m) => ({
      value: m.id,
      label: `${m.name} (${getEntityLabel(m.targetEntity)})`,
    })),
  ];

  return (
    <div className="w-full">
      <Select
        label="Modelo de Mapeamento"
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        options={options}
      />
      {selectedId && (
        <div className="mt-2 text-xs text-muted-foreground">
          {models.find((m) => m.id === selectedId)?.description || 'Sem descrição cadastrada.'}
        </div>
      )}
    </div>
  );
};

export default ImportModelSelector;
