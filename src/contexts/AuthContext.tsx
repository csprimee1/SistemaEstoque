import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { validateSession, loginWithCredentials, logout as logoutUser } from '../lib/supabase';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const userData = await validateSession();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await loginWithCredentials(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      } else {
        console.error('Erro no login:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    role: 'solicitante' | 'despachante' | 'administrador';
    school?: string;
  }) => {
    // Para demo, não implementamos signup real
    // Em produção, você implementaria a criação de usuário aqui
    console.log('SignUp não implementado para demo');
    return false;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    signUp,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};