import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Utilitários para gerenciamento de cookies
export const cookieUtils = {
  // Define um cookie
  setCookie: (name: string, value: string, days: number = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure=${window.location.protocol === 'https:'}`;
  },

  // Obtém um cookie
  getCookie: (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  // Remove um cookie
  removeCookie: (name: string) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

// Função para validar sessão via cookie
export const validateSession = async () => {
  const sessionToken = cookieUtils.getCookie('session_token');
  
  if (!sessionToken) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('validate_session', {
      token: sessionToken
    });

    if (error || !data || data.length === 0) {
      // Remove cookie inválido
      cookieUtils.removeCookie('session_token');
      return null;
    }

    const userData = data[0];
    return {
      id: userData.user_id,
      name: userData.user_name,
      email: userData.user_email,
      role: userData.user_role,
      school: userData.user_school,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    cookieUtils.removeCookie('session_token');
    return null;
  }
};

// Função para fazer login
export const loginWithCredentials = async (email: string, password: string) => {
  try {
    // Busca usuário por email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .limit(1);

    if (userError || !users || users.length === 0) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    const user = users[0];

    // Para demo, vamos aceitar senhas simples (em produção, use bcrypt)
    const validPasswords: { [key: string]: string } = {
      'admin@educacao.gov.br': 'admin123',
      'carlos@educacao.gov.br': 'carlos123',
      'maria@escola1.edu.br': 'maria123',
      'joao@escola2.edu.br': 'joao123',
      'ana@escola3.edu.br': 'ana123',
      'pedro@escola4.edu.br': 'pedro123',
      'lucia@escola5.edu.br': 'lucia123'
    };

    if (validPasswords[email] !== password) {
      return { success: false, error: 'Senha incorreta' };
    }

    // Gera token de sessão
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    // Cria sessão no banco
    const { error: sessionError } = await supabase.rpc('create_session', {
      p_user_id: user.id,
      p_session_token: sessionToken,
      p_expires_at: expiresAt.toISOString(),
      p_user_agent: navigator.userAgent,
      p_ip_address: null
    });

    if (sessionError) {
      console.error('Erro ao criar sessão:', sessionError);
      return { success: false, error: 'Erro interno do servidor' };
    }

    // Define cookie
    cookieUtils.setCookie('session_token', sessionToken, 7);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
        createdAt: user.created_at
      }
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
};

// Função para fazer logout
export const logout = async () => {
  const sessionToken = cookieUtils.getCookie('session_token');
  
  if (sessionToken) {
    try {
      await supabase.rpc('remove_session', { token: sessionToken });
    } catch (error) {
      console.error('Erro ao remover sessão:', error);
    }
  }
  
  cookieUtils.removeCookie('session_token');
};

// Função para gerar token de sessão
const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Função para obter perfil do usuário atual (compatibilidade)
export const getCurrentUserProfile = async () => {
  return await validateSession();
};

// Função para criar perfil de usuário (compatibilidade)
export const createUserProfile = async (authUser: any, userData: {
  name: string;
  role: 'solicitante' | 'despachante' | 'administrador';
  school?: string;
}) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      name: userData.name,
      email: authUser.email,
      role: userData.role,
      school: userData.school,
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // senha padrão
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Função para limpar sessões expiradas
export const cleanExpiredSessions = async () => {
  try {
    await supabase.rpc('clean_expired_sessions');
  } catch (error) {
    console.error('Erro ao limpar sessões expiradas:', error);
  }
};