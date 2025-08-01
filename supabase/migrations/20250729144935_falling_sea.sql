-- Adiciona funções auxiliares para simplificar as políticas RLS

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION public.clean_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_sessions WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Função para verificar se o usuário atual é admin (com SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'administrador'
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Função para verificar se o usuário atual é staff (despachante ou admin)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('despachante', 'administrador')
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Atualiza as políticas de RLS usando as novas funções

-- Remove políticas existentes de users (se necessário)
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

-- Recria políticas para users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (public.is_admin());

-- Atualiza políticas para materials
DROP POLICY IF EXISTS "Staff can manage materials" ON public.materials;
CREATE POLICY "Staff can manage materials" ON public.materials
    FOR ALL USING (public.is_staff());

-- Atualiza políticas para suppliers
DROP POLICY IF EXISTS "Staff can manage suppliers" ON public.suppliers;
CREATE POLICY "Staff can manage suppliers" ON public.suppliers
    FOR ALL USING (public.is_staff());

-- Atualiza políticas para requests
DROP POLICY IF EXISTS "Staff can view all requests" ON public.requests;
DROP POLICY IF EXISTS "Staff can update requests" ON public.requests;

CREATE POLICY "Staff can view all requests" ON public.requests
    FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can update requests" ON public.requests
    FOR UPDATE USING (public.is_staff());

-- Atualiza políticas para request_items
DROP POLICY IF EXISTS "Staff can view all request items" ON public.request_items;
DROP POLICY IF EXISTS "Staff can manage all request items" ON public.request_items;

CREATE POLICY "Staff can view all request items" ON public.request_items
    FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can manage all request items" ON public.request_items
    FOR ALL USING (public.is_staff());

-- Atualiza políticas para stock_entries
DROP POLICY IF EXISTS "Staff can view stock entries" ON public.stock_entries;
DROP POLICY IF EXISTS "Staff can create stock entries" ON public.stock_entries;

CREATE POLICY "Staff can view stock entries" ON public.stock_entries
    FOR SELECT USING (public.is_staff());

CREATE POLICY "Staff can create stock entries" ON public.stock_entries
    FOR INSERT WITH CHECK (public.is_staff());

-- Atualiza políticas para stock_movements
DROP POLICY IF EXISTS "Staff can view stock movements" ON public.stock_movements;
CREATE POLICY "Staff can view stock movements" ON public.stock_movements
    FOR SELECT USING (public.is_staff());