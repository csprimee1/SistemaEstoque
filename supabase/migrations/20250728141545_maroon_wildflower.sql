-- Migração inicial para Supabase (PostgreSQL)
-- Sistema de Gerenciamento de Estoque - Secretaria de Educação

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('solicitante', 'despachante', 'administrador');
CREATE TYPE request_status AS ENUM ('pendente', 'aprovado', 'rejeitado', 'despachado', 'cancelado');
CREATE TYPE request_priority AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE movement_type AS ENUM ('entrada', 'saida');
CREATE TYPE reference_type AS ENUM ('request', 'entry', 'adjustment');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'solicitante',
    school VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials table
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock entries table
CREATE TABLE IF NOT EXISTS public.stock_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES public.materials(id),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    batch VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requests table
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES public.users(id),
    status request_status DEFAULT 'pendente',
    priority request_priority DEFAULT 'media',
    notes TEXT,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    dispatched_by UUID REFERENCES public.users(id),
    dispatched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request items table
CREATE TABLE IF NOT EXISTS public.request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.materials(id),
    requested_quantity DECIMAL(10,2) NOT NULL,
    approved_quantity DECIMAL(10,2),
    dispatched_quantity DECIMAL(10,2),
    notes TEXT
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES public.materials(id),
    type movement_type NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference_id UUID,
    reference_type reference_type,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table for additional session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_stock_level ON public.materials(current_stock, min_stock);
CREATE INDEX IF NOT EXISTS idx_stock_entries_material ON public.stock_entries(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_supplier ON public.stock_entries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_date ON public.stock_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON public.requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_date ON public.requests(created_at);
CREATE INDEX IF NOT EXISTS idx_request_items_request ON public.request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_request_items_material ON public.request_items(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_material ON public.stock_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- Insert default materials
INSERT INTO public.materials (name, category, unit, current_stock, min_stock, description) VALUES
('Arroz Branco', 'Alimentação', 'kg', 100, 20, 'Arroz tipo 1 para merenda escolar'),
('Feijão Preto', 'Alimentação', 'kg', 50, 10, 'Feijão preto para merenda escolar'),
('Óleo de Soja', 'Alimentação', 'litro', 30, 5, 'Óleo de soja refinado'),
('Detergente', 'Material de Limpeza', 'unidade', 25, 5, 'Detergente neutro 500ml'),
('Papel Higiênico', 'Material de Limpeza', 'pacote', 40, 10, 'Papel higiênico folha dupla'),
('Sabão em Pó', 'Material de Limpeza', 'kg', 20, 5, 'Sabão em pó para limpeza geral'),
('Papel A4', 'Material de Expediente', 'resma', 15, 3, 'Papel sulfite A4 500 folhas'),
('Caneta Azul', 'Material de Expediente', 'unidade', 100, 20, 'Caneta esferográfica azul'),
('Lápis de Cor', 'Material Pedagógico', 'caixa', 30, 10, 'Caixa com 12 lápis de cor'),
('Caderno Universitário', 'Material Pedagógico', 'unidade', 200, 50, 'Caderno universitário 96 folhas');

-- Insert default suppliers
INSERT INTO public.suppliers (name, email, phone, address) VALUES
('Distribuidora Alimentos Ltda', 'vendas@distribuidora.com', '(11) 1234-5678', 'Rua das Flores, 123 - Centro'),
('Fornecedor Limpeza S/A', 'contato@limpeza.com', '(11) 2345-6789', 'Av. Principal, 456 - Industrial'),
('Papelaria Escolar ME', 'vendas@papelaria.com', '(11) 3456-7890', 'Rua Comercial, 789 - Centro');

-- Create views for reporting
CREATE OR REPLACE VIEW public.stock_status AS
SELECT 
    m.id,
    m.name,
    m.category,
    m.unit,
    m.current_stock,
    m.min_stock,
    CASE 
        WHEN m.current_stock <= m.min_stock THEN 'Baixo'
        WHEN m.current_stock <= (m.min_stock * 1.5) THEN 'Atenção'
        ELSE 'OK'
    END as status,
    m.updated_at
FROM public.materials m;

CREATE OR REPLACE VIEW public.request_summary AS
SELECT 
    r.id,
    r.status,
    r.priority,
    r.created_at,
    u1.name as requester_name,
    u1.school,
    u2.name as approver_name,
    u3.name as dispatcher_name,
    COUNT(ri.id) as items_count,
    SUM(ri.requested_quantity) as total_requested,
    SUM(COALESCE(ri.dispatched_quantity, 0)) as total_dispatched
FROM public.requests r
LEFT JOIN public.users u1 ON r.requester_id = u1.id
LEFT JOIN public.users u2 ON r.approved_by = u2.id
LEFT JOIN public.users u3 ON r.dispatched_by = u3.id
LEFT JOIN public.request_items ri ON r.id = ri.request_id
GROUP BY r.id, r.status, r.priority, r.created_at, u1.name, u1.school, u2.name, u3.name;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON public.user_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle stock movements
CREATE OR REPLACE FUNCTION public.handle_stock_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Update material stock
    UPDATE public.materials 
    SET current_stock = current_stock + NEW.quantity, 
        updated_at = NOW() 
    WHERE id = NEW.material_id;
    
    -- Record stock movement
    INSERT INTO public.stock_movements (material_id, type, quantity, reason, reference_id, reference_type, created_by)
    VALUES (NEW.material_id, 'entrada', NEW.quantity, 'Entrada de estoque', NEW.id, 'entry', NEW.created_by);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle request dispatch
CREATE OR REPLACE FUNCTION public.handle_request_dispatch()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dispatched_quantity IS NOT NULL AND (OLD.dispatched_quantity IS NULL OR OLD.dispatched_quantity != NEW.dispatched_quantity) THEN
        -- Update material stock
        UPDATE public.materials 
        SET current_stock = current_stock - NEW.dispatched_quantity,
            updated_at = NOW() 
        WHERE id = NEW.material_id;
        
        -- Record stock movement
        INSERT INTO public.stock_movements (material_id, type, quantity, reason, reference_id, reference_type, created_by)
        SELECT NEW.material_id, 'saida', NEW.dispatched_quantity, 'Despacho de solicitação', NEW.request_id, 'request', r.dispatched_by
        FROM public.requests r WHERE r.id = NEW.request_id AND r.dispatched_by IS NOT NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for stock management
CREATE TRIGGER trigger_stock_entry_insert
    AFTER INSERT ON public.stock_entries
    FOR EACH ROW EXECUTE FUNCTION public.handle_stock_entry();

CREATE TRIGGER trigger_request_dispatch
    AFTER UPDATE ON public.request_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_request_dispatch();

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION public.clean_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_sessions WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'administrador'
        )
    );

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'administrador'
        )
    );

CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'administrador'
        )
    );

-- RLS Policies for materials table
CREATE POLICY "Authenticated users can view materials" ON public.materials
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage materials" ON public.materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('despachante', 'administrador')
        )
    );

-- RLS Policies for suppliers table
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage suppliers" ON public.suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('despachante', 'administrador')
        )
    );

-- RLS Policies for requests table
CREATE POLICY "Users can view their own requests" ON public.requests
    FOR SELECT USING (
        requester_id = (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all requests" ON public.requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('despachante', 'administrador')
        )
    );

CREATE POLICY "Users can create requests" ON public.requests
    FOR INSERT WITH CHECK (
        requester_id = (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their pending requests" ON public.requests
    FOR UPDATE USING (
        requester_id = (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        ) AND status = 'pendente'
    );

CREATE POLICY "Staff can update requests" ON public.requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('despachante', 'administrador')
        )
    );

-- RLS Policies for request_items table
CREATE POLICY "Users can view items from their requests" ON public.request_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.requests r
            JOIN public.users u ON r.requester_id = u.id
            WHERE r.id = request_id AND u.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Staff can view all request items" ON public.request_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('despachante', 'administrador')
        )
    );

CREATE POLICY "Users can manage items from their pending requests" ON public.request_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.requests r
            JOIN public.users u ON r.requester_id = u.id
            WHERE r.id = request_id 
            AND u.auth_user_id = auth.uid() 
            AND r.status = 'pendente'
        )
    );

CREATE POLICY "Staff can manage all request items" ON public.request_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('despachante', 'administrador')
        )
    );

-- RLS Policies for stock_entries table
CREATE POLICY "Staff can view stock entries" ON public.stock_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('despachante', 'administrador')
        )
    );

CREATE POLICY "Staff can create stock entries" ON public.stock_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('despachante', 'administrador')
        )
    );

-- RLS Policies for stock_movements table
CREATE POLICY "Staff can view stock movements" ON public.stock_movements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('despachante', 'administrador')
        )
    );

-- RLS Policies for user_sessions table
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL USING (
        user_id = (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );