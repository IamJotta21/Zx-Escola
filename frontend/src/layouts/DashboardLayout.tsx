import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { BreadcrumbItem } from '../components/ui/Breadcrumb';
import { useAuth } from '../contexts/AuthContext';
import { Drawer } from '../components/ui/Drawer';
import { Badge } from '../components/ui/Badge';
import api from '../services/api';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Profile Drawer states
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (isProfileDrawerOpen && user?.role === 'TEACHER') {
      setLoadingProfile(true);
      api
        .get('/portal/teacher/profile')
        .then((res) => setProfileData(res.data.data))
        .catch(console.error)
        .finally(() => setLoadingProfile(false));
    }
  }, [isProfileDrawerOpen, user]);

  // Sticky desktop sidebar collapse setting
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('@ZxEscola:sidebarCollapsed');
    return saved === 'true';
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('@ZxEscola:sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  // Dynamic breadcrumbs based on active path
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const path = location.pathname;

    if (path.startsWith('/dashboard')) {
      return [{ label: 'Painel Geral' }];
    }
    if (path.startsWith('/turmas')) {
      return [{ label: 'Turmas' }];
    }
    if (path.startsWith('/alunos')) {
      return [{ label: 'Alunos' }];
    }
    if (path.startsWith('/boletins')) {
      return [{ label: 'Boletins de Notas' }];
    }
    if (path.startsWith('/configuracoes')) {
      return [{ label: 'Configurações' }];
    }

    return [];
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Sidebar (Responsive and collapsible) */}
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        isMobileOpen={isMobileOpen}
        closeMobile={closeMobile}
        onProfileClick={() => setIsProfileDrawerOpen(true)}
      />

      {/* Main Content Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar navigation panel */}
        <Topbar
          toggleMobileSidebar={toggleMobileSidebar}
          breadcrumbItems={getBreadcrumbItems()}
          onProfileClick={() => setIsProfileDrawerOpen(true)}
        />

        {/* Dynamic viewport pane */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* User Profile Drawer */}
      <Drawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        title="Ficha do Usuário"
        size="md"
      >
        {loadingProfile ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="text-xs">Carregando perfil do docente...</span>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Header Card */}
            <div className="flex flex-col items-center text-center p-5 bg-secondary/35 border border-border/70 rounded-2xl">
              <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-xl font-bold mb-3 shadow-sm">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
              <h2 className="text-base font-extrabold text-foreground">
                {user?.firstName} {user?.lastName}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full mt-1.5 font-sans">
                {user?.role}
              </span>
            </div>

            {/* General Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground border-b pb-1">
                Informações da Conta
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">E-mail:</span>
                  <span className="font-semibold text-foreground">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Situação:</span>
                  <Badge variant="success">Ativo</Badge>
                </div>
              </div>
            </div>

            {/* Teacher Specific Info */}
            {user?.role === 'TEACHER' && profileData && (
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground border-b pb-1">
                  Atribuições e Horários
                </h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">
                      Disciplinas Associadas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {profileData.subjects?.split(',').map((sub: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs font-medium">
                          {sub.trim()}
                        </Badge>
                      )) || (
                        <span className="text-xs italic text-muted-foreground">
                          Nenhuma disciplina
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Carga Horária Semanal:</span>
                    <span className="font-bold text-foreground font-mono bg-secondary border border-border px-2 py-0.5 rounded">
                      {profileData.workload || '—'} horas
                    </span>
                  </div>

                  {profileData.phone && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span className="font-semibold text-foreground">{profileData.phone}</span>
                    </div>
                  )}

                  {profileData.schedule && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">
                        Grade de Horários:
                      </span>
                      <div className="text-xs font-semibold text-foreground bg-secondary/35 p-3 rounded-lg border border-border/80 font-mono leading-relaxed whitespace-pre-line">
                        {profileData.schedule}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
export default DashboardLayout;
