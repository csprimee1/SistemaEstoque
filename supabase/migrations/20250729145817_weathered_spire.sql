-- Sistema de Autenticação com Cookies
-- Remove RLS complexo e implementa sistema simples baseado em cookies

-- Primeiro, vamos desabilitar RLS nas tabelas principais
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;

-- Remove todas as políticas RLS existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view materials" ON public.materials;
DROP POLICY IF EXISTS "Staff can manage materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Staff can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.requests;
DROP POLICY IF EXISTS "Staff can view all requests" ON public.requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.requests;
DROP POLICY IF EXISTS "Users can update their pending requests" ON public.requests;
DROP POLICY IF EXISTS "Staff can update requests" ON public.requests;
DROP POLICY IF EXISTS "Users can view items from their requests" ON public.request_items;
DROP POLICY IF EXISTS "Staff can view all request items" ON public.request_items;
DROP POLICY IF EXISTS "Users can manage items from their pending requests" ON public.request_items;
DROP POLICY IF EXISTS "Staff can manage all request items" ON public.request_items;
DROP POLICY IF EXISTS "Staff can view stock entries" ON public.stock_entries;
DROP POLICY IF EXISTS "Staff can create stock entries" ON public.stock_entries;
DROP POLICY IF EXISTS "Staff can view stock movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.user_sessions;

-- Remove funções de segurança que causavam recursão
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_staff();

-- Atualiza a tabela de usuários para não depender de auth.users
ALTER TABLE public.users DROP COLUMN IF EXISTS auth_user_id;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Cria tabela de sessões simplificada para cookies
DROP TABLE IF EXISTS public.user_sessions;
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION public.clean_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_sessions WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Função para validar sessão
CREATE OR REPLACE FUNCTION public.validate_session(token TEXT)
RETURNS TABLE(
    user_id UUID,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_role user_role,
    user_school VARCHAR(255)
) AS $$
BEGIN
    -- Limpa sessões expiradas primeiro
    PERFORM public.clean_expired_sessions();
    
    -- Retorna dados do usuário se a sessão for válida
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.school
    FROM public.user_sessions s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.session_token = token 
    AND s.expires_at > NOW()
    AND u.is_active = true;
END;
$$ language 'plpgsql';

-- Função para criar sessão
CREATE OR REPLACE FUNCTION public.create_session(
    p_user_id UUID,
    p_session_token VARCHAR(255),
    p_expires_at TIMESTAMP WITH TIME ZONE,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    -- Remove sessões antigas do usuário (opcional - manter apenas uma sessão ativa)
    DELETE FROM public.user_sessions 
    WHERE user_id = p_user_id;
    
    -- Cria nova sessão
    INSERT INTO public.user_sessions (user_id, session_token, expires_at, user_agent, ip_address)
    VALUES (p_user_id, p_session_token, p_expires_at, p_user_agent, p_ip_address)
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ language 'plpgsql';

-- Função para remover sessão (logout)
CREATE OR REPLACE FUNCTION public.remove_session(token TEXT)
RETURNS boolean AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions 
    WHERE session_token = token;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ language 'plpgsql';

-- Insere usuários demo com senhas hash (bcrypt de "password")
INSERT INTO public.users (name, email, password_hash, role, school) VALUES
('Administrador Sistema', 'admin@educacao.gov.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador', NULL),
('Carlos Mendes', 'carlos@educacao.gov.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'despachante', NULL),
('Maria Silva', 'maria@escola1.edu.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'solicitante', 'Escola Municipal João da Silva'),
('João Santos', 'joao@escola2.edu.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'solicitante', 'Escola Municipal Maria das Dores'),
('Ana Costa', 'ana@escola3.edu.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'solicitante', 'Escola Municipal Pedro Alvares'),
('Pedro Lima', 'pedro@escola4.edu.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'solicitante', 'Escola Municipal Santa Rita'),
('Lucia Fernandes', 'lucia@escola5.edu.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'solicitante', 'Escola Municipal São José')
ON CONFLICT (email) DO NOTHING;

-- Habilita acesso público às funções necessárias
GRANT EXECUTE ON FUNCTION public.validate_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_session(UUID, VARCHAR(255), TIMESTAMP WITH TIME ZONE, TEXT, INET) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clean_expired_sessions() TO anon, authenticated;

-- Permite acesso público às tabelas (já que não usamos mais RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_entries TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO anon, authenticated;

-- Permite uso das sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;