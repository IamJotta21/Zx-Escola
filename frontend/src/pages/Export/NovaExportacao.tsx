import React from 'react';
import ExportWizard from '../../components/export/ExportWizard';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const NovaExportacao: React.FC = () => {
  const navigate = useNavigate();

  const handleFinished = () => {
    navigate('/exportacao-inteligente/historico');
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex flex-col gap-3">
        <Link
          to="/exportacao-inteligente/historico"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold w-fit transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Histórico
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Nova Exportação Inteligente
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gere pacotes estruturados em diversos formatos e filtros de escopo personalizados.
          </p>
        </div>
      </div>

      <ExportWizard onFinished={handleFinished} />
    </div>
  );
};

export default NovaExportacao;
