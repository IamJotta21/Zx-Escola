import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, KeyRound, Check } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import { AxiosError } from 'axios';

export const ResetPasswordPage: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      addToast({
        type: 'warning',
        message: 'Token de recuperação é obrigatório.',
      });
      return;
    }

    if (newPassword.length < 6) {
      addToast({
        type: 'warning',
        message: 'A nova senha precisa ter pelo menos 6 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        type: 'warning',
        message: 'As senhas não coincidem.',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });

      if (response.data.status === 'success') {
        setSuccess(true);
        addToast({
          type: 'success',
          title: 'Senha alterada!',
          message: 'Sua senha foi redefinida com sucesso.',
        });
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Falha ao redefinir senha.';
      addToast({
        type: 'error',
        title: 'Erro na redefinição',
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
          Nova Senha
        </h2>
        <p className="text-xs text-muted-foreground">
          Redefina sua credencial de acesso ao sistema
        </p>
      </div>

      {success ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
          <Alert variant="success" title="Redefinição Concluída">
            Sua senha foi atualizada. Você será redirecionado para a página de login em instantes...
          </Alert>
          <Link to="/login" className="block w-full">
            <Button className="w-full">Ir para o Login Agora</Button>
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            type="text"
            label="Chave de Recuperação"
            placeholder="Cole o token gerado"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            leftIcon={<KeyRound className="h-4 w-4" />}
            required
          />

          <Input
            type="password"
            label="Nova Senha"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            required
          />

          <Input
            type="password"
            label="Confirmar Nova Senha"
            placeholder="Mínimo 6 caracteres"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            required
          />

          <Button type="submit" className="w-full mt-2" isLoading={loading}>
            Redefinir Senha
          </Button>
        </form>
      )}

      {!success && (
        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-semibold text-primary hover:underline gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o Login
          </Link>
        </div>
      )}
    </div>
  );
};
export default ResetPasswordPage;
