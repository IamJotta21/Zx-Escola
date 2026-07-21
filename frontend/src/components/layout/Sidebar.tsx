import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  UserCheck,
  ClipboardList,
  Award,
  Briefcase,
  DollarSign,
  MessageSquare,
  BookOpen,
  FileText,
  BarChart3,
  Sparkles,
  Shield,
  ChevronDown,
  FolderSync,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/Button';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
  onProfileClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  toggleCollapse,
  isMobileOpen,
  closeMobile,
  onProfileClick,
}) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER', 'FINANCEIRO', 'GUARDIAN', 'STUDENT'],
    },
    {
      name: 'Turmas',
      path: '/turmas',
      icon: Users,
      roles: ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'],
    },
    { name: 'Alunos', path: '/alunos', icon: GraduationCap, roles: ['ADMIN', 'DIRETOR', 'STAFF'] },
    {
      name: 'Professores',
      path: '/professores',
      icon: Award,
      roles: ['ADMIN', 'DIRETOR', 'STAFF'],
    },
    {
      name: 'Funcionários',
      path: '/funcionarios',
      icon: Briefcase,
      roles: ['ADMIN', 'DIRETOR', 'STAFF'],
    },
    {
      name: 'Responsáveis',
      path: '/responsaveis',
      icon: UserCheck,
      roles: ['ADMIN', 'DIRETOR', 'STAFF'],
    },
    {
      name: 'Matrículas',
      path: '/matriculas',
      icon: ClipboardList,
      roles: ['ADMIN', 'DIRETOR', 'STAFF'],
    },
    {
      name: 'Financeiro',
      path: '/financeiro',
      icon: DollarSign,
      roles: ['ADMIN', 'DIRETOR', 'FINANCEIRO'],
    },
    {
      name: 'Boletins',
      path: '/boletins',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'DIRETOR', 'TEACHER', 'GUARDIAN', 'STUDENT'],
    },

    {
      name: 'Comunicação',
      path: '/comunicacao',
      icon: MessageSquare,
      roles: ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER', 'GUARDIAN', 'STUDENT'],
    },
    {
      name: 'Biblioteca',
      path: '/biblioteca',
      icon: BookOpen,
      roles: ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'],
    },
    {
      name: 'Secretaria Digital',
      path: '/documentos',
      icon: FileText,
      roles: ['ADMIN', 'DIRETOR', 'STAFF'],
    },
    {
      name: 'Portal do Responsável',
      path: '/portal-pais',
      icon: Users,
      roles: ['GUARDIAN'],
    },
    {
      name: 'Portal do Aluno',
      path: '/portal-aluno',
      icon: GraduationCap,
      roles: ['STUDENT'],
    },
    {
      name: 'Portal do Professor',
      path: '/portal-professor',
      icon: ClipboardList,
      roles: ['TEACHER'],
    },
    {
      name: 'Relatórios',
      path: '/relatorios',
      icon: BarChart3,
      roles: ['ADMIN', 'DIRETOR', 'FINANCEIRO'],
    },
    {
      name: 'Assistente de IA',
      path: '/assistente-ia',
      icon: Sparkles,
      roles: ['ADMIN', 'DIRETOR', 'STAFF', 'TEACHER'],
    },
  ].filter((item) => !user || item.roles.includes(user.role));

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  const desktopSidebarClasses = `
    hidden md:flex flex-col h-full bg-slate-50 dark:bg-slate-950/80 border-r border-border/80 transition-all duration-300 relative
    ${sidebarWidth}
  `;

  const mobileSidebarClasses = `
    fixed inset-0 z-40 flex md:hidden transition-opacity duration-300
    ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
  `;

  const renderContent = () => (
    <div className="flex h-full flex-col justify-between p-4 overflow-x-hidden">
      {/* Brand Header */}
      <div>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'} py-2`}>
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-lg shadow-sm shrink-0">
            Z
          </div>
          {!isCollapsed && (
            <span className="font-sans font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Zx-Escola
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="mt-8 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={closeMobile}
                className={({ isActive }) => `
                  flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 gap-3 group select-none
                  ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isCollapsed ? '' : ''}`} />
                {!isCollapsed && <span className="font-sans">{item.name}</span>}
              </NavLink>
            );
          })}

          {/* Administração Collapsible Group */}
          {(!user || ['ADMIN', 'DIRETOR'].includes(user.role)) && (
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (isCollapsed) return;
                  setIsAdminOpen(!isAdminOpen);
                }}
                className={`
                  w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 gap-3 group select-none text-muted-foreground hover:bg-secondary hover:text-foreground
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? 'Administração' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="font-sans">Administração</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isAdminOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {/* Importação Inteligente Subgroup */}
              {((isAdminOpen && !isCollapsed) || isCollapsed) && (
                <div className={`${isCollapsed ? '' : 'pl-4'} space-y-1`}>
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        window.location.href = '/importacao-inteligente/dashboard';
                        return;
                      }
                      setIsImportOpen(!isImportOpen);
                    }}
                    className={`
                      w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 gap-3 group select-none text-muted-foreground hover:bg-secondary hover:text-foreground
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? 'Importação Inteligente' : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span className="font-sans">Importação</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isImportOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>

                  {/* Submenus of Importação Inteligente */}
                  {isImportOpen && !isCollapsed && (
                    <div className="pl-6 space-y-1 border-l border-border/60 ml-5">
                      {[
                        { name: 'Dashboard', path: '/importacao-inteligente/dashboard' },
                        { name: 'Nova Importação', path: '/importacao-inteligente/nova' },
                        { name: 'Histórico', path: '/importacao-inteligente/historico' },
                        { name: 'Modelos de Importação', path: '/importacao-inteligente/modelos' },
                        { name: 'Configurações', path: '/importacao-inteligente/configuracoes' },
                      ].map((sub) => (
                        <NavLink
                          key={sub.name}
                          to={sub.path}
                          onClick={closeMobile}
                          className={({ isActive }) => `
                            flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 select-none
                            ${
                              isActive
                                ? 'bg-primary/10 text-primary font-bold shadow-xs'
                                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                            }
                          `}
                        >
                          <span className="font-sans">{sub.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Exportação Inteligente Subgroup */}
              {((isAdminOpen && !isCollapsed) || isCollapsed) && (
                <div className={`${isCollapsed ? '' : 'pl-4'} space-y-1`}>
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        window.location.href = '/exportacao-inteligente/historico';
                        return;
                      }
                      setIsExportOpen(!isExportOpen);
                    }}
                    className={`
                      w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 gap-3 group select-none text-muted-foreground hover:bg-secondary hover:text-foreground
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? 'Exportação Inteligente' : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span className="font-sans">Exportação</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>

                  {/* Submenus of Exportação Inteligente */}
                  {isExportOpen && !isCollapsed && (
                    <div className="pl-6 space-y-1 border-l border-border/60 ml-5">
                      {[
                        { name: 'Nova Exportação', path: '/exportacao-inteligente/nova' },
                        { name: 'Histórico', path: '/exportacao-inteligente/historico' },
                      ].map((sub) => (
                        <NavLink
                          key={sub.name}
                          to={sub.path}
                          onClick={closeMobile}
                          className={({ isActive }) => `
                            flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 select-none
                            ${
                              isActive
                                ? 'bg-primary/10 text-primary font-bold shadow-xs'
                                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                            }
                          `}
                        >
                          <span className="font-sans">{sub.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Centro de Migração Subgroup */}
              {((isAdminOpen && !isCollapsed) || isCollapsed) && (
                <div className={`${isCollapsed ? '' : 'pl-4'} space-y-1`}>
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        window.location.href = '/migracao/modelos';
                        return;
                      }
                      setIsMigrationOpen(!isMigrationOpen);
                    }}
                    className={`
                      w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 gap-3 group select-none text-muted-foreground hover:bg-secondary hover:text-foreground
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? 'Centro de Migração' : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <FolderSync className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span className="font-sans">Migração</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isMigrationOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>

                  {/* Submenus of Centro de Migração */}
                  {isMigrationOpen && !isCollapsed && (
                    <div className="pl-6 space-y-1 border-l border-border/60 ml-5">
                      {[
                        { name: 'Modelos', path: '/migracao/modelos' },
                        { name: 'Agendamentos', path: '/migracao/agendamentos' },
                        { name: 'Documentação API', path: '/migracao/api-docs' },
                      ].map((sub) => (
                        <NavLink
                          key={sub.name}
                          to={sub.path}
                          onClick={closeMobile}
                          className={({ isActive }) => `
                            flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 select-none
                            ${
                              isActive
                                ? 'bg-primary/10 text-primary font-bold shadow-xs'
                                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                            }
                          `}
                        >
                          <span className="font-sans">{sub.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Footer Info & Configs */}
      <div className="space-y-4 border-t border-border/60 pt-4">
        {/* Theme Toggle & Settings */}
        <div
          className={`flex ${isCollapsed ? 'flex-col items-center gap-3' : 'items-center gap-2 px-1'}`}
        >
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 select-none ${isCollapsed ? 'h-9 w-9 border border-border/30' : 'flex-1 border border-border/40'}`}
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-500 shrink-0" />
            ) : (
              <Moon className="h-5 w-5 shrink-0" />
            )}
            {!isCollapsed && <span className="ml-2 text-xs font-sans font-medium">Tema</span>}
          </button>

          <button
            onClick={() => navigate('/configuracoes')}
            className={`flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 select-none ${isCollapsed ? 'h-9 w-9 border border-border/30' : 'flex-1 border border-border/40'}`}
            title="Configurações de Perfil"
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="ml-2 text-xs font-sans font-medium">Configurar</span>}
          </button>
        </div>

        {/* User Card */}
        <div
          onClick={onProfileClick}
          className={`flex items-center gap-3 cursor-pointer hover:bg-secondary/60 p-2 rounded-lg transition-all duration-200 select-none ${isCollapsed ? 'justify-center' : 'px-2'}`}
          title="Ver meu perfil completo"
        >
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm shrink-0">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-none text-foreground mb-1">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                {user?.role}
              </span>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <Button
          onClick={signOut}
          variant="destructive"
          size="sm"
          className="w-full justify-center"
          leftIcon={<LogOut className="h-4 w-4" />}
        >
          {!isCollapsed && 'Sair'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={desktopSidebarClasses}>
        {renderContent()}
        {/* Toggle Collapse Trigger */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-card hover:bg-accent flex items-center justify-center shadow-sm text-muted-foreground hover:text-foreground z-10"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <div className={mobileSidebarClasses}>
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs"
          onClick={closeMobile}
        />
        <aside className="relative flex flex-col w-64 max-w-xs h-full bg-slate-50 dark:bg-slate-950 border-r border-border/80 animate-in slide-in-from-left duration-300">
          {renderContent()}
        </aside>
      </div>
    </>
  );
};
export default Sidebar;
