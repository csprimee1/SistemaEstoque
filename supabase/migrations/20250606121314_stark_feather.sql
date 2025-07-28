-- Database: inventory_system
-- Sistema de Gerenciamento de Estoque - Secretaria de Educação

-- Create database
CREATE DATABASE IF NOT EXISTS inventory_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventory_system;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('solicitante', 'despachante', 'administrador') NOT NULL DEFAULT 'solicitante',
    school VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_stock_level (current_stock, min_stock)
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    address TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Stock entries table
CREATE TABLE IF NOT EXISTS stock_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_id INT NOT NULL,
    supplier_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NULL,
    batch VARCHAR(100) NULL,
    expiry_date DATE NULL,
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_material (material_id),
    INDEX idx_supplier (supplier_id),
    INDEX idx_date (created_at)
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    requester_id INT NOT NULL,
    status ENUM('pendente', 'aprovado', 'rejeitado', 'despachado', 'cancelado') DEFAULT 'pendente',
    priority ENUM('baixa', 'media', 'alta') DEFAULT 'media',
    notes TEXT NULL,
    approved_by INT NULL,
    approved_at TIMESTAMP NULL,
    dispatched_by INT NULL,
    dispatched_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (dispatched_by) REFERENCES users(id),
    INDEX idx_requester (requester_id),
    INDEX idx_status (status),
    INDEX idx_date (created_at)
);

-- Request items table
CREATE TABLE IF NOT EXISTS request_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    material_id INT NOT NULL,
    requested_quantity DECIMAL(10,2) NOT NULL,
    approved_quantity DECIMAL(10,2) NULL,
    dispatched_quantity DECIMAL(10,2) NULL,
    notes TEXT NULL,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    INDEX idx_request (request_id),
    INDEX idx_material (material_id)
);

-- Stock movements table (for tracking all stock changes)
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_id INT NOT NULL,
    type ENUM('entrada', 'saida') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference_id INT NULL,
    reference_type ENUM('request', 'entry', 'adjustment') NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_material (material_id),
    INDEX idx_type (type),
    INDEX idx_date (created_at)
);

-- Insert default admin user
INSERT INTO users (name, email, password, role) VALUES 
('Administrador', 'admin@educacao.gov.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador');
-- Password: password (use bcrypt to hash in production)

-- Insert default materials categories
INSERT INTO materials (name, category, unit, current_stock, min_stock, description) VALUES
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
INSERT INTO suppliers (name, email, phone, address) VALUES
('Distribuidora Alimentos Ltda', 'vendas@distribuidora.com', '(11) 1234-5678', 'Rua das Flores, 123 - Centro'),
('Fornecedor Limpeza S/A', 'contato@limpeza.com', '(11) 2345-6789', 'Av. Principal, 456 - Industrial'),
('Papelaria Escolar ME', 'vendas@papelaria.com', '(11) 3456-7890', 'Rua Comercial, 789 - Centro');

-- Insert sample school users
INSERT INTO users (name, email, password, role, school) VALUES
('Maria Silva', 'maria@escola1.edu.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'solicitante', 'Escola Municipal João da Silva'),
('João Santos', 'joao@escola2.edu.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'solicitante', 'Escola Municipal Maria das Dores'),
('Ana Costa', 'ana@escola3.edu.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'solicitante', 'Escola Municipal Pedro Alvares'),
('Carlos Mendes', 'carlos@educacao.gov.br', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'despachante', NULL);

-- Triggers for stock movement tracking

DELIMITER //

-- Trigger for stock entries
CREATE TRIGGER after_stock_entry_insert
AFTER INSERT ON stock_entries
FOR EACH ROW
BEGIN
    -- Update material stock
    UPDATE materials 
    SET current_stock = current_stock + NEW.quantity, 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.material_id;
    
    -- Record stock movement
    INSERT INTO stock_movements (material_id, type, quantity, reason, reference_id, reference_type, created_by)
    VALUES (NEW.material_id, 'entrada', NEW.quantity, 'Entrada de estoque', NEW.id, 'entry', NEW.created_by);
END //

-- Trigger for request dispatch
CREATE TRIGGER after_request_dispatch
AFTER UPDATE ON request_items
FOR EACH ROW
BEGIN
    IF NEW.dispatched_quantity IS NOT NULL AND (OLD.dispatched_quantity IS NULL OR OLD.dispatched_quantity != NEW.dispatched_quantity) THEN
        -- Update material stock
        UPDATE materials 
        SET current_stock = current_stock - NEW.dispatched_quantity,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.material_id;
        
        -- Record stock movement
        INSERT INTO stock_movements (material_id, type, quantity, reason, reference_id, reference_type, created_by)
        SELECT NEW.material_id, 'saida', NEW.dispatched_quantity, 'Despacho de solicitação', NEW.request_id, 'request', r.dispatched_by
        FROM requests r WHERE r.id = NEW.request_id;
    END IF;
END //

DELIMITER ;

-- Views for reporting

-- View for current stock status
CREATE VIEW stock_status AS
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
FROM materials m;

-- View for request summary
CREATE VIEW request_summary AS
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
    SUM(ri.dispatched_quantity) as total_dispatched
FROM requests r
LEFT JOIN users u1 ON r.requester_id = u1.id
LEFT JOIN users u2 ON r.approved_by = u2.id
LEFT JOIN users u3 ON r.dispatched_by = u3.id
LEFT JOIN request_items ri ON r.id = ri.request_id
GROUP BY r.id;