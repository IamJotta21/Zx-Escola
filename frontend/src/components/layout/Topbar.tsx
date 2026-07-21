import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Breadcrumb, BreadcrumbItem } from '../ui/Breadcrumb';
import { Badge } from '../ui/Badge';
import api from '../../services/api';

interface TopbarProps {
  toggleMobileSidebar: () => void;
  breadcrumbItems?: BreadcrumbItem[];
  onProfileClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  toggleMobileSidebar,
  breadcrumbItems = [],
  onProfileClick,
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification / Announcements popover states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get('/students', {
          params: { search: query, limit: 10 },
        });
        setResults(res.data.data.students || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Erro ao pesquisar alunos:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch announcements when popover is shown
  const fetchAnnouncements = async () => {
    setLoadingNotifs(true);
    try {
      const res = await api.get('/communication/announcements');
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error('Erro ao carregar comunicados:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (isNotifOpen) {
      fetchAnnouncements();
    }
  }, [isNotifOpen]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-card px-4 md:px-8 notion-shadow">
      {/* Left side: Hamburger button + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleMobileSidebar}
          className="rounded-lg p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground md:hidden transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Right side: Search, Notifications, Avatar */}
      <div className="flex items-center gap-4">
        {/* Live Search Bar */}
        <div ref={searchRef} className="relative hidden md:flex items-center max-w-sm w-72">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar aluno por nome ou CPF..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            className="w-full h-9 rounded-lg border border-input/80 bg-muted/40 pl-9 pr-3 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-background transition-all"
          />
          {loading && (
            <div className="absolute right-3">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary" />
            </div>
          )}

          {isOpen && (
            <div className="absolute top-11 left-0 right-0 bg-card border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto z-50 p-2 space-y-1">
              <div className="text-[9px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                Alunos Encontrados ({results.length})
              </div>
              {results.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Nenhum aluno encontrado
                </div>
              ) : (
                results.map((student) => {
                  const name = student.name
                    ? student.name
                    : student.user?.profile
                      ? `${student.user.profile.firstName} ${student.user.profile.lastName}`
                      : student.user?.email || 'Sem nome';
                  const cpf = student.cpf ? student.cpf : 'Sem CPF';
                  const className = student.class?.name || 'Sem Turma';

                  return (
                    <div
                      key={student.id}
                      className="flex flex-col gap-0.5 p-2 rounded-md hover:bg-secondary/60 cursor-default transition-colors text-left"
                    >
                      <div className="text-xs font-bold text-foreground">{name}</div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-sans">
                        <span>CPF {cpf}</span>
                        <span className="font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-[9px] font-sans">
                          {className}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            onMouseEnter={() => setIsNotifOpen(true)}
            className="relative rounded-lg p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Notificações"
            title="Ver comunicados e avisos"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </button>

          {isNotifOpen && (
            <div className="absolute top-10 right-0 bg-card border border-border rounded-xl shadow-2xl w-80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 glass-panel">
              {/* Popover Header */}
              <div className="flex items-center justify-between border-b border-border/50 p-3 bg-secondary/15">
                <span className="text-xs font-bold text-foreground">Comunicados & Avisos</span>
                <Badge variant="outline" className="text-[10px]">
                  {announcements.length}
                </Badge>
              </div>

              {/* Popover Content */}
              <div className="max-h-72 overflow-y-auto divide-y divide-border/40 p-2 space-y-1">
                {loadingNotifs ? (
                  <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary" />
                    <span>Carregando avisos...</span>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-6">
                    Nenhum aviso ou comunicado no momento.
                  </div>
                ) : (
                  announcements.map((ann) => {
                    const targetLabels: Record<string, string> = {
                      ALL: 'Geral',
                      TEACHERS: 'Professores',
                      STUDENTS: 'Alunos',
                      GUARDIANS: 'Responsáveis',
                      CLASS: `Turma: ${ann.class?.name || 'Vinculada'}`,
                    };

                    return (
                      <div
                        key={ann.id}
                        className="p-2.5 rounded-lg hover:bg-secondary/40 transition-colors flex flex-col gap-1 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-foreground leading-snug">
                            {ann.title}
                          </span>
                          <span className="font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-[8px] tracking-wider uppercase font-sans shrink-0">
                            {targetLabels[ann.target] || ann.target}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">
                          {ann.content}
                        </p>
                        <span className="text-[9px] text-muted-foreground/60 font-mono mt-0.5">
                          {formatDate(ann.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-[1px] bg-border/60" />

        {/* User Card */}
        <div
          onClick={onProfileClick}
          className="flex items-center gap-3 cursor-pointer hover:bg-secondary/60 p-1.5 rounded-lg transition-colors select-none"
          title="Ver meu perfil completo"
        >
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-bold font-sans text-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground font-sans uppercase">
              {user?.role}
            </span>
          </div>

          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm shrink-0">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Topbar;
