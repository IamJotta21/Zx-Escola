import React, { useState } from 'react';
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
import { useToast } from '../../contexts/ToastContext';
import { Sliders, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ConfiguracoesImportacao: React.FC = () => {
  const { addToast } = useToast();
  const [maxRows, setMaxRows] = useState('1500');
  const [allowedExtensions, setAllowedExtensions] = useState('.xlsx, .xls, .csv');
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);

  const handleSave = () => {
    addToast({
      type: 'success',
      title: 'Configurações de lote salvas',
      message: 'Os limites de registros e extensões aceitas foram atualizados no servidor.',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
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
            Configurações Gerais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure limites operacionais, arquivos autorizados e notificações de processamento.
          </p>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            Políticas de Loteamento e Uploads
          </CardTitle>
          <CardDescription>
            Defina restrições para manter o desempenho e segurança do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Limite Máximo de Linhas por Planilha"
            type="number"
            value={maxRows}
            onChange={(e) => setMaxRows(e.target.value)}
          />

          <Input
            label="Extensões de Arquivos Permitidas"
            value={allowedExtensions}
            onChange={(e) => setAllowedExtensions(e.target.value)}
          />

          <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/20 dark:bg-slate-900/10">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-foreground">Aviso de conclusão de lote</span>
              <span className="text-xs text-muted-foreground">
                Alertar administradores em tempo real via sistema
              </span>
            </div>
            <input
              type="checkbox"
              className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              checked={notifyOnComplete}
              onChange={(e) => setNotifyOnComplete(e.target.checked)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border/50 pt-6">
          <Link to="/importacao-inteligente/dashboard">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={handleSave}>Salvar Configurações</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfiguracoesImportacao;
