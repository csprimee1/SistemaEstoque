-- Insert demo users for testing
-- Note: In production, users should be created through Supabase Auth signup

-- First, we need to create auth users (this would normally be done through Supabase Auth)
-- For demo purposes, we'll create the profile records directly

-- Demo user profiles (these would be linked to actual auth.users in production)
INSERT INTO public.users (name, email, role, school) VALUES
('Administrador Sistema', 'admin@educacao.gov.br', 'administrador', NULL),
('Carlos Mendes', 'carlos@educacao.gov.br', 'despachante', NULL),
('Maria Silva', 'maria@escola1.edu.br', 'solicitante', 'Escola Municipal João da Silva'),
('João Santos', 'joao@escola2.edu.br', 'solicitante', 'Escola Municipal Maria das Dores'),
('Ana Costa', 'ana@escola3.edu.br', 'solicitante', 'Escola Municipal Pedro Alvares'),
('Pedro Lima', 'pedro@escola4.edu.br', 'solicitante', 'Escola Municipal Santa Rita'),
('Lucia Fernandes', 'lucia@escola5.edu.br', 'solicitante', 'Escola Municipal São José');

-- Note: In a real deployment, you would:
-- 1. Create users through Supabase Auth signup
-- 2. Link the auth_user_id to the profile records
-- 3. Set up proper authentication flow

-- For now, these are just profile records for demo purposes