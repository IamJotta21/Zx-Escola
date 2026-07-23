import React, { useState, useEffect, useCallback } from 'react';
import { Send, Plus, Trash2, Inbox, Clock, Users, RefreshCw, Mail } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

interface ClassShort {
  id: string;
  name: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  target: string;
  classId: string | null;
  class?: ClassShort | null;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface MessageLogItem {
  id: string;
  recipientRole: string;
  recipientName: string;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  createdAt: string;
}

export const CommunicationPage: React.FC = () => {
  const { addToast } = useToast();
  const { user } = useAuth();

  const isStaff = user && ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'].includes(user.role);
  const [activeTab, setActiveTab] = useState<'send' | 'announcements' | 'inbox' | 'history'>(
    'inbox'
  );
  const [loading, setLoading] = useState(false);

  // Lists
  const [classes, setClasses] = useState<ClassShort[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLogItem[]>([]);

  // ── 1. Send Message Form State ──────────────────────────────────────────────
  const [recipientRole, setRecipientRole] = useState('ALUNOS');
  const [sendClassId, setSendClassId] = useState('');
  const [chanNotification, setChanNotification] = useState(true);
  const [chanEmail, setChanEmail] = useState(true);
  const [chanWhatsapp, setChanWhatsapp] = useState(false);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // ── 2. Create Announcement State ────────────────────────────────────────────
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [annTarget, setAnnTarget] = useState('ALL');
  const [annClassId, setAnnClassId] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Default initial active tab: staff goes to 'send', students/parents to 'inbox'
  useEffect(() => {
    if (isStaff) {
      setActiveTab('send');
    } else {
      setActiveTab('inbox');
    }
  }, [isStaff]);

  // ── Fetch Operations ────────────────────────────────────────────────────────
  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.data || []);
    } catch {
      // Fail silently
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await api.get('/communication/announcements');
      setAnnouncements(res.data.data || []);
    } catch {
      // Fail silently
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/communication/notifications');
      setNotifications(res.data.data);
    } catch {
      // Fail silently
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get('/communication/logs');
      setMessageLogs(res.data.data);
    } catch {
      // Fail silently
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchClasses(), fetchAnnouncements(), fetchNotifications(), fetchLogs()]);
    setLoading(false);
  }, [fetchClasses, fetchAnnouncements, fetchNotifications, fetchLogs]);

  useEffect(() => {
    fetchAllData();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 1. Send Message Action ──────────────────────────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgBody) {
      addToast({ type: 'warning', message: 'O corpo da mensagem é obrigatório.' });
      return;
    }

    const channels: string[] = [];
    if (chanNotification) channels.push('NOTIFICATION');
    if (chanEmail) channels.push('EMAIL');
    if (chanWhatsapp) channels.push('WHATSAPP');

    if (channels.length === 0) {
      addToast({ type: 'warning', message: 'Selecione pelo menos um canal de envio.' });
      return;
    }

    setSendingMessage(true);
    try {
      await api.post('/communication/send', {
        recipientRole,
        classId: recipientRole === 'TURMA' ? sendClassId : undefined,
        channels,
        subject: msgSubject || 'Comunicado Escolar',
        body: msgBody,
      });

      addToast({
        type: 'success',
        title: 'Mensagem Despachada',
        message: 'A mensagem foi enviada aos destinatários pelos canais selecionados.',
      });

      setMsgSubject('');
      setMsgBody('');
      fetchLogs();
    } catch (err) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      const msg = errorResponse.response?.data?.message || 'Erro ao despachar comunicado.';
      addToast({ type: 'error', title: 'Falha no Envio', message: msg });
    } finally {
      setSendingMessage(false);
    }
  };

  // ── 2. Announcement Actions ──────────────────────────────────────────────────
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    setSavingAnnouncement(true);
    try {
      await api.post('/communication/announcements', {
        title: annTitle,
        content: annContent,
        target: annTarget,
        classId: annTarget === 'CLASS' ? annClassId : undefined,
      });

      addToast({
        type: 'success',
        title: 'Aviso Publicado',
        message: 'Aviso adicionado ao mural escolar.',
      });
      setIsAnnounceModalOpen(false);
      setAnnTitle('');
      setAnnContent('');
      fetchAnnouncements();
    } catch {
      addToast({ type: 'error', message: 'Erro ao publicar aviso no mural.' });
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Deseja excluir este aviso do mural?')) return;
    try {
      await api.delete(`/communication/announcements/${id}`);
      addToast({ type: 'success', message: 'Aviso removido.' });
      fetchAnnouncements();
    } catch {
      addToast({ type: 'error', message: 'Falha ao remover aviso.' });
    }
  };

  // ── 3. Internal Notification Actions ─────────────────────────────────────────
  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/communication/notifications/${id}/read`);
      addToast({ type: 'success', message: 'Notificação marcada como lida.' });
      fetchNotifications();
    } catch {
      // Fail silently
    }
  };

  const getRecipientLabel = (role: string) => {
    switch (role) {
      case 'TODOS':
        return 'Todos';
      case 'ALUNOS':
        return 'Alunos';
      case 'PAIS':
        return 'Responsáveis';
      case 'PROFESSORES':
        return 'Professores';
      case 'TURMA':
        return 'Turma Específica';
      default:
        return role;
    }
  };

  const getChannelBadge = (chan: string) => {
    switch (chan) {
      case 'NOTIFICATION':
        return <Badge variant="outline">Notificação Interna</Badge>;
      case 'EMAIL':
        return <Badge variant="success">E-mail</Badge>;
      case 'WHATSAPP':
        return <Badge variant="warning">WhatsApp</Badge>;
      default:
        return <Badge variant="outline">{chan}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-foreground">
            Central de Comunicação
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Envio de comunicados multicanais, caixa de avisos institucionais e notificações.
          </p>
        </div>
        {isStaff && activeTab === 'announcements' && (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAnnounceModalOpen(true)}
          >
            Novo Aviso
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {isStaff && (
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'send'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Send className="h-4 w-4" />
            Enviar Mensagem
          </button>
        )}
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'inbox'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Inbox className="h-4 w-4" />
          Caixa de Entrada
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'announcements'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          Quadro de Avisos
        </button>
        {isStaff && (
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="h-4 w-4" />
            Histórico de Envios
          </button>
        )}
      </div>

      {/* ── 1. Enviar Mensagem Tab ─────────────────────────────────────────────── */}
      {activeTab === 'send' && isStaff && (
        <Card className="stripe-card">
          <CardContent className="p-6">
            <form onSubmit={handleSendMessage} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Público-Alvo *"
                  options={[
                    { value: 'ALUNOS', label: 'Todos os Alunos' },
                    { value: 'PAIS', label: 'Todos os Responsáveis' },
                    { value: 'PROFESSORES', label: 'Todos os Professores' },
                    { value: 'TURMA', label: 'Turma Específica' },
                    { value: 'TODOS', label: 'Todos do Sistema' },
                  ]}
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                />

                {recipientRole === 'TURMA' && (
                  <Select
                    label="Selecione a Turma *"
                    options={[
                      { value: '', label: 'Selecione uma turma...' },
                      ...classes.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    value={sendClassId}
                    onChange={(e) => setSendClassId(e.target.value)}
                    required
                  />
                )}
              </div>

              {/* Channels checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Canais de Envio (Envio Simultâneo)
                </label>
                <div className="flex flex-wrap gap-4 p-3 rounded-lg border border-border bg-secondary/10">
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chanNotification}
                      onChange={(e) => setChanNotification(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    Notificação Interna (Portal)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chanEmail}
                      onChange={(e) => setChanEmail(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    Disparar E-mail (Simulado)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chanWhatsapp}
                      onChange={(e) => setChanWhatsapp(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-ring"
                    />
                    Disparar WhatsApp (Simulado)
                  </label>
                </div>
              </div>

              <Input
                label="Assunto / Título *"
                value={msgSubject}
                onChange={(e) => setMsgSubject(e.target.value)}
                placeholder="Ex: Reunião de Pais e Mestres"
              />

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Corpo da Mensagem *
                </label>
                <textarea
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  rows={6}
                  placeholder="Escreva sua mensagem aqui..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  required
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <Button
                  type="submit"
                  isLoading={sendingMessage}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Despachar Mensagem
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── 2. Caixa de Entrada Tab (Notificações) ────────────────────────────────── */}
      {activeTab === 'inbox' && (
        <Card className="stripe-card">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-foreground">Minhas Notificações</h2>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-10">
                Sua caixa de entrada está limpa. Nenhuma notificação.
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-colors flex justify-between items-start gap-4 ${
                      item.isRead
                        ? 'bg-secondary/10 border-border text-muted-foreground'
                        : 'bg-primary/5 border-primary/20 text-foreground'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!item.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 animate-ping" />
                        )}
                        <h3 className="text-xs font-bold">{item.title}</h3>
                      </div>
                      <p className="text-xs leading-relaxed">{item.content}</p>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {new Date(item.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    {!item.isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] border-primary/20 hover:bg-primary/10 shrink-0"
                        onClick={() => handleMarkAsRead(item.id)}
                      >
                        Lido
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── 3. Quadro de Avisos Tab ─────────────────────────────────────────────── */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          {announcements.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground bg-secondary/10 rounded-xl border border-border">
              <Mail className="h-10 w-10 opacity-25 mx-auto mb-2" />
              <p className="font-semibold">Mural limpo</p>
              <p className="text-xs mt-1">Nenhum comunicado oficial ativo no momento.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {announcements.map((item) => (
                <Card key={item.id} className="stripe-card h-fit">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {new Date(item.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      {isStaff ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => handleDeleteAnnouncement(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Badge variant="outline">{item.target}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                    {item.class && (
                      <div className="text-[10px] font-semibold text-primary">
                        Turma: {item.class.name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Histórico de Envios Tab ──────────────────────────────────────────── */}
      {activeTab === 'history' && isStaff && (
        <Card className="stripe-card">
          <CardContent className="p-0">
            {messageLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-10">
                Nenhuma mensagem enviada anteriormente.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data de Envio</TableHead>
                    <TableHead>Público-Alvo</TableHead>
                    <TableHead>Destinatários</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messageLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-[10px]">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground text-xs">
                        {getRecipientLabel(log.recipientRole)}
                      </TableCell>
                      <TableCell className="text-xs">{log.recipientName}</TableCell>
                      <TableCell>{getChannelBadge(log.channel)}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">
                        {log.subject || '—'}
                      </TableCell>
                      <TableCell className="text-xs truncate max-w-[200px]" title={log.body}>
                        {log.body}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="success" className="text-[10px]">
                          Enviado
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Create Announcement Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={isAnnounceModalOpen}
        onClose={() => setIsAnnounceModalOpen(false)}
        title="Publicar Comunicado no Mural"
        size="md"
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Select
              label="Público Alvo *"
              options={[
                { value: 'ALL', label: 'Toda a Escola' },
                { value: 'STUDENTS', label: 'Apenas Alunos' },
                { value: 'GUARDIANS', label: 'Apenas Responsáveis' },
                { value: 'TEACHERS', label: 'Apenas Professores' },
                { value: 'CLASS', label: 'Turma Específica' },
              ]}
              value={annTarget}
              onChange={(e) => setAnnTarget(e.target.value)}
            />

            {annTarget === 'CLASS' && (
              <Select
                label="Selecione a Turma *"
                options={[
                  { value: '', label: 'Selecione uma turma...' },
                  ...classes.map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={annClassId}
                onChange={(e) => setAnnClassId(e.target.value)}
                required
              />
            )}
          </div>

          <Input
            label="Título do Comunicado *"
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            placeholder="Ex: Recesso de Carnaval"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Conteúdo do Comunicado *
            </label>
            <textarea
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              rows={5}
              placeholder="Escreva os detalhes do aviso..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAnnounceModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={savingAnnouncement}>
              Publicar Aviso
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default CommunicationPage;
