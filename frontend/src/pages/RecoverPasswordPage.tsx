import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import { AxiosError } from 'axios';

export const RecoverPasswordPage: React.FC = () => {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast({
        type: 'warning',
        message: 'Por favor, insira o seu e-mail.',
      });
      return;
    }

    setLoading(true);
    setRecoveryToken(null);

    try {
      const response = await api.post('/auth/recover-password', { email });
      const data = response.data;

      if (data.status === 'success') {
        const token = data.data.recoveryToken;
        setRecoveryToken(token);
        addToast({
          type: 'success',
          title: 'Código enviado!',
          message: 'Chave de recuperação gerada com sucesso.',
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Falha ao solicitar recuperação.';
      addToast({
        type: 'error',
        title: 'Falha na recuperação',
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-2xl shadow-md mb-2">
          Z
        </div>
        <h2 className="text-2xl font-extrabold font-sans tracking-tight text-foreground">
          Recuperar Senha
        </h2>
        <p className="text-xs text-muted-foreground">
          Insira o e-mail cadastrado para obter a chave de redefinição
        </p>
      </div>

      {recoveryToken ? (
        <div className="space-y-4">
          <Alert variant="success" title="Chave Gerada para Teste">
            Copie a chave abaixo para redefinir a sua senha:
            <div className="mt-2 p-2 bg-background rounded border border-emerald-500/20 font-mono text-[10px] break-all select-all text-foreground text-center font-bold">
              {recoveryToken}
            </div>
          </Alert>

          <Link to={`/reset-password?token=${recoveryToken}`}>
            <Button className="w-full" rightIcon={<ArrowLeft className="h-4 w-4 rotate-180" />}>
              Prosseguir para Redefinição
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setRecoveryToken(null)}
          >
            Solicitar novamente
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            type="email"
            label="E-mail de Cadastro"
            placeholder="exemplo@escola.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            required
          />

          <Button type="submit" className="w-full mt-2" isLoading={loading}>
            Solicitar Chave
          </Button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link
          to="/login"
          className="inline-flex items-center text-xs font-semibold text-primary hover:underline gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o Login
        </Link>
      </div>
    </div>
  );
};
export default RecoverPasswordPage;
