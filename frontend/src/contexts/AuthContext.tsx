import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

export type UserRole =
  'SUPER_ADMIN' | 'ADMIN' | 'DIRETOR' | 'STAFF' | 'TEACHER' | 'FINANCEIRO' | 'GUARDIAN' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  tenantId?: string;
  tenantName?: string;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (accessToken: string, refreshToken: string, user: User) => void;
  signOut: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = () => {
    const refreshToken = localStorage.getItem('@ZxEscola:refreshToken');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('@ZxEscola:accessToken');
    localStorage.removeItem('@ZxEscola:refreshToken');
    localStorage.removeItem('@ZxEscola:user');
    setUser(null);
  };

  useEffect(() => {
    async function loadStorageData() {
      const storedUser = localStorage.getItem('@ZxEscola:user');
      const storedToken = localStorage.getItem('@ZxEscola:accessToken');

      // Local demo / offline tokens: restore session without hitting API
      const isLocalDemoToken =
        storedToken === 'superadmin-access-token' ||
        storedToken === 'superadmin-refresh-token' ||
        storedToken === 'demo-token' ||
        (storedToken?.startsWith('demo-token-') ?? false);

      if (storedToken) {
        try {
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
          }

          // Skip backend validation for local demo/offline sessions
          if (!isLocalDemoToken) {
            const response = await api.get('/auth/profile');
            const userProfile = response.data.data;

            const userData: User = {
              id: userProfile.id,
              email: userProfile.email,
              role: userProfile.role,
              firstName: userProfile.profile?.firstName || '',
              lastName: userProfile.profile?.lastName || '',
              avatarUrl: userProfile.profile?.avatarUrl || undefined,
              tenantId: userProfile.tenantId,
              tenantName: userProfile.tenantName,
            };
            localStorage.setItem('@ZxEscola:user', JSON.stringify(userData));
            setUser(userData);
          }
        } catch (error) {
          // Backend unreachable – keep the locally-stored user if it exists
          if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
          }
        }
      }
      setIsLoading(false);
    }

    loadStorageData();

    // Listen to global 401 logout events from Axios (skip for demo sessions)
    const handleUnauthorized = () => {
      const token = localStorage.getItem('@ZxEscola:accessToken');
      // Não deslogar sessões demo offline
      if (
        token === 'superadmin-access-token' ||
        token === 'demo-token' ||
        (token?.startsWith('demo-token-') ?? false)
      ) return;
      signOut();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const signIn = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('@ZxEscola:accessToken', accessToken);
    localStorage.setItem('@ZxEscola:refreshToken', refreshToken);
    localStorage.setItem('@ZxEscola:user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('@ZxEscola:user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
