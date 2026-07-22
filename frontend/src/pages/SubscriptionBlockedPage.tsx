import React from 'react';
import { Lock, AlertOctagon, Phone, Mail, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const SubscriptionBlockedPage: React.FC<{
  reason?: string;
  onRenew?: () => void;
}> = ({ reason = 'A assinatura da sua escola está suspensa ou expirada.', onRenew }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mx-auto">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Acesso Temporariamente Suspenso</h1>
          <p className="text-sm text-slate-400">{reason}</p>
        </div>

        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-left space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Como regularizar?</div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Mail className="h-4 w-4 text-primary" /> financeiro@zxescola.com.br
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Phone className="h-4 w-4 text-emerald-400" /> (11) 4004-9999 / WhatsApp
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {onRenew && (
            <Button variant="default" size="md" onClick={onRenew} className="w-full font-bold">
              Renovar Assinatura
            </Button>
          )}
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              localStorage.removeItem('@ZxEscola:accessToken');
              window.location.href = '/login';
            }}
            className="w-full text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            Voltar para a Tela de Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionBlockedPage;
