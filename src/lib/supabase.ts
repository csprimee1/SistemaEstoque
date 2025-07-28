import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to get current user profile
export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();
    
  return profile;
};

// Helper function to create user profile after signup
export const createUserProfile = async (authUser: any, userData: {
  name: string;
  role: 'solicitante' | 'despachante' | 'administrador';
  school?: string;
}) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_user_id: authUser.id,
      email: authUser.email,
      name: userData.name,
      role: userData.role,
      school: userData.school
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Helper function to clean expired sessions
export const cleanExpiredSessions = async () => {
  const { error } = await supabase.rpc('clean_expired_sessions');
  if (error) console.error('Error cleaning expired sessions:', error);
};