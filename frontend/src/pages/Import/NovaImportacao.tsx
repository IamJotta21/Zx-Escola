import React from 'react';
import ImportWizard from '../../components/import/ImportWizard';

import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const NovaImportacao: React.FC = () => {
  const navigate = useNavigate();

  const handleFinished = () => {
    navigate('/importacao-inteligente/historico');
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
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">
            Importar Planilha
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Grave dados em massa relacionando cabeçalhos dinâmicos em 6 passos simples.
          </p>
        </div>
      </div>

      <ImportWizard onFinished={handleFinished} />
    </div>
  );
};

export default NovaImportacao;
