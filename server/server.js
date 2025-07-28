import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import session from 'express-session';

dotenv.config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // ou seu frontend
  credentials: true, // importante para sessão
}));
app.use(express.json());

app.use(session({
  secret: 'seuSegredoSuperSeguro', // use variável de ambiente idealmente
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 dia
    sameSite: 'lax',
  },
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Não autenticado' });
}

// Diretório atual (substituto de __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'admin',
  database: 'inventory_system',
  charset: 'utf8mb4',
};

export let db;

async function initDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Conectado ao banco de dados MySQL');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    delete user.password;
    req.session.user = user;

    res.json({ user });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (req.session.user) {
    return res.json(req.session.user);
  }
  res.status(401).json({ error: 'Não autenticado' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout efetuado com sucesso' });
  });
});

// --- Rotas públicas, sem autenticação ---

// Estatísticas do dashboard
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = {};
    const [materialsCount] = await db.execute('SELECT COUNT(*) as count FROM materials');
    stats.totalMaterials = materialsCount[0].count;

    const [pendingCount] = await db.execute('SELECT COUNT(*) as count FROM requests WHERE status = "pendente"');
    stats.pendingRequests = pendingCount[0].count;

    const [lowStockCount] = await db.execute('SELECT COUNT(*) as count FROM materials WHERE current_stock <= min_stock');
    stats.lowStockItems = lowStockCount[0].count;

    const [usersCount] = await db.execute('SELECT COUNT(*) as count FROM users');
    stats.totalUsers = usersCount[0].count;

    const [entriesCount] = await db.execute('SELECT COUNT(*) as count FROM stock_entries WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
    stats.recentEntries = entriesCount[0].count;

    const [monthlyCount] = await db.execute('SELECT COUNT(*) as count FROM requests WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())');
    stats.monthlyRequests = monthlyCount[0].count;

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas de fornecedores
app.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const [result] = await db.execute(
      'INSERT INTO suppliers (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email || null, phone || null, address || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Fornecedor criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    await db.execute(
      'UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email || null, phone || null, address || null, id]
    );

    res.json({ message: 'Fornecedor atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o fornecedor está associado a algum material
    const [materialCount] = await db.execute('SELECT COUNT(*) as count FROM materials WHERE supplier_id = ?', [id]);
    
    if (materialCount[0].count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir fornecedor associado a materiais' });
    }

    await db.execute('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json({ message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas de materiais
app.get('/api/materials', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM materials ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/materials', async (req, res) => {
  try {
    const { name, category, unit, min_stock, description } = req.body;
    const [result] = await db.execute(
      'INSERT INTO materials (name, category, unit, current_stock, min_stock, description) VALUES (?, ?, ?, 0, ?, ?)',
      [name, category, unit, min_stock, description || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Material criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar material:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unit, min_stock, description } = req.body;

    await db.execute(
      'UPDATE materials SET name = ?, category = ?, unit = ?, min_stock = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, category, unit, min_stock, description || null, id]
    );

    res.json({ message: 'Material atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [requestItems] = await db.execute('SELECT COUNT(*) as count FROM request_items WHERE material_id = ?', [id]);
    const [stockEntries] = await db.execute('SELECT COUNT(*) as count FROM stock_entries WHERE material_id = ?', [id]);

    if (requestItems[0].count > 0 || stockEntries[0].count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir material que possui histórico de movimentação' });
    }

    await db.execute('DELETE FROM materials WHERE id = ?', [id]);
    res.json({ message: 'Material excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir material:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/materials/search?query=lapis
  app.get('/api/materials/search', async (req, res) => {
    const { query } = req.query;
    try {
      const [rows] = await db.execute(`
        SELECT id, name, quantity 
        FROM materials 
        WHERE name LIKE ? 
        ORDER BY name ASC
        LIMIT 20
      `, [`%${query}%`]);
      res.json(rows);
    } catch (err) {
      console.error('Erro ao buscar materiais:', err);
      res.status(500).json({ error: 'Erro ao buscar materiais' });
    }
  });

app.get('/api/requests/summary', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        status,
        priority,
        created_at,
        requester_name,
        school,
        approver_name,
        dispatcher_name,
        items_count,
        total_requested,
        total_dispatched
      FROM request_summary
      ORDER BY created_at DESC
    `;

    const [rows] = await db.execute(query);

    // Mapear os dados para o formato esperado no frontend (opcional, para camelCase)
    const requests = rows.map(row => ({
      id: row.id,
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at,
      requester: {
        name: row.requester_name,
        school: row.school,
      },
      approverName: row.approver_name,
      dispatcherName: row.dispatcher_name,
      itemsCount: row.items_count,
      totalRequested: row.total_requested,
      totalDispatched: row.total_dispatched,
    }));

    res.json(requests);

  } catch (error) {
    console.error('Erro ao buscar resumo das solicitações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

//USUARIOS
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT id, name, email, role, school, is_active, created_at, updated_at
      FROM users
      ORDER BY name
    `);
    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/users/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await db.execute(`
      SELECT id, name, email, role, school, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `, [id]);

    if (users.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    res.json(users[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/users', requireAuth, async (req, res) => {
  try {
    const { name, email, password, role = 'solicitante', school = null, is_active = true } = req.body;

    if (!['solicitante', 'despachante', 'administrador'].includes(role)) {
      return res.status(400).json({ error: 'Função de usuário inválida' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(`
      INSERT INTO users (name, email, password, role, school, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, email, hashedPassword, role, school, is_active]);

    res.status(201).json({ id: result.insertId, message: 'Usuário criado com sucesso' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/users/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, school, is_active } = req.body;

    if (role && !['solicitante', 'despachante', 'administrador'].includes(role)) {
      return res.status(400).json({ error: 'Função de usuário inválida' });
    }

    const baseQuery = `
      UPDATE users SET
        name = ?,
        email = ?,
        role = ?,
        school = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
        ${password ? ', password = ?' : ''}
      WHERE id = ?
    `;

    const params = password
      ? [name, email, role, school, is_active, await bcrypt.hash(password, 10), id]
      : [name, email, role, school, is_active, id];

    await db.execute(baseQuery, params);

    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/users/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.session.user.id) {
      return res.status(400).json({ error: 'Você não pode excluir a si mesmo' });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


//STOCKENTRIES
// Rotas para Stock Entries
app.get('/api/stock-entries', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        se.id,
        se.material_id,
        se.supplier_id,
        se.quantity,
        se.unit_price,
        se.batch,
        se.expiry_date,
        se.notes,
        se.created_at,
        se.created_by,
        m.name as material_name,
        m.unit as material_unit,
        s.name as supplier_name,
        u.name as created_by_name
      FROM stock_entries se
      LEFT JOIN materials m ON se.material_id = m.id
      LEFT JOIN suppliers s ON se.supplier_id = s.id
      LEFT JOIN users u ON se.created_by = u.id
      ORDER BY se.created_at DESC
    `);
    
    // Adicionar campos calculados
    const entries = rows.map(entry => ({
      ...entry,
      total_price: entry.quantity * (entry.unit_price || 0)
    }));
    res.json(entries);
  } 
  catch (error) {
    console.error('Erro ao buscar entradas de estoque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/stock-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(`
      SELECT 
        se.*,
        m.name as material_name,
        m.unit as material_unit,
        s.name as supplier_name,
        u.name as created_by_name
      FROM stock_entries se
      LEFT JOIN materials m ON se.material_id = m.id
      LEFT JOIN suppliers s ON se.supplier_id = s.id
      LEFT JOIN users u ON se.created_by = u.id
      WHERE se.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entrada de estoque não encontrada' });
    }

    const entry = {
      ...rows[0],
      total_price: rows[0].quantity * (rows[0].unit_price || 0)
    };

    res.json(entry);
  } catch (error) {
    console.error('Erro ao buscar entrada de estoque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/stock-entries', async (req, res) => {
  try {
    const { material_id, supplier_id, quantity, unit_price, batch, expiry_date, notes } = req.body;
    const created_by = req.session.user.id; // Assume que o usuário está autenticado

    // Validar campos obrigatórios
    if (!material_id || !supplier_id || !quantity) {
      return res.status(400).json({ error: 'Material, fornecedor e quantidade são obrigatórios' });
    }

    // Inserir a entrada de estoque
    const [result] = await db.execute(
      `INSERT INTO stock_entries 
      (material_id, supplier_id, quantity, unit_price, batch, expiry_date, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        material_id, 
        supplier_id, 
        quantity, 
        unit_price || null, 
        batch || null, 
        expiry_date || null, 
        notes || null, 
        created_by
      ]
    );

    res.status(201).json({ 
      id: result.insertId,
      message: 'Entrada de estoque criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar entrada de estoque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/stock-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { material_id, supplier_id, quantity, unit_price, batch, expiry_date, notes } = req.body;

    // Verificar se a entrada existe
    const [existing] = await db.execute('SELECT * FROM stock_entries WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Entrada de estoque não encontrada' });
    }

    // Atualizar a entrada
    await db.execute(
      `UPDATE stock_entries SET 
        material_id = ?, 
        supplier_id = ?, 
        quantity = ?, 
        unit_price = ?, 
        batch = ?, 
        expiry_date = ?, 
        notes = ?
      WHERE id = ?`,
      [
        material_id, 
        supplier_id, 
        quantity, 
        unit_price || null, 
        batch || null, 
        expiry_date || null, 
        notes || null, 
        id
      ]
    );

    res.json({ message: 'Entrada de estoque atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar entrada de estoque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/stock-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a entrada existe
    const [existing] = await db.execute('SELECT * FROM stock_entries WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Entrada de estoque não encontrada' });
    }

    // Verificar se a remoção afetará o estoque atual
    const materialId = existing[0].material_id;
    const quantity = existing[0].quantity;

    const [material] = await db.execute('SELECT current_stock FROM materials WHERE id = ?', [materialId]);
    if (material.length === 0) {
      return res.status(400).json({ error: 'Material associado não encontrado' });
    }

    const currentStock = material[0].current_stock;
    if (currentStock < quantity) {
      return res.status(400).json({ 
        error: 'Não é possível remover esta entrada pois deixaria o estoque negativo' 
      });
    }

    // Remover a entrada
    await db.execute('DELETE FROM stock_entries WHERE id = ?', [id]);

    res.json({ message: 'Entrada de estoque removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover entrada de estoque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});




//SOLICITAÇÕES
// Rotas para Solicitações (Requests) - Adicione isso no server.js
app.get('/api/requests', async (req, res) => {
  try {
    const [requests] = await db.execute(`
      SELECT 
        r.id,
        r.status,
        r.priority,
        r.notes,
        r.created_at,
        r.updated_at,
        u1.name as requester_name,
        u1.school,
        u2.name as approver_name,
        u3.name as dispatcher_name,
        (SELECT COUNT(*) FROM request_items WHERE request_id = r.id) as items_count,
        (SELECT COALESCE(SUM(requested_quantity), 0) FROM request_items WHERE request_id = r.id) as total_requested
      FROM requests r
      JOIN users u1 ON r.requester_id = u1.id
      LEFT JOIN users u2 ON r.approved_by = u2.id
      LEFT JOIN users u3 ON r.dispatched_by = u3.id
      ORDER BY r.created_at DESC
    `);
    
    // Mapeamento para manter consistência com o frontend
    const mappedRequests = requests.map(request => ({
      ...request,
      itemsCount: request.items_count,
      totalRequested: request.total_requested,
      // Mantém os campos originais também se necessário
      created_at: request.created_at,
      updated_at: request.updated_at
    }));
    
    res.json(mappedRequests);
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar solicitação principal
    const [requests] = await db.execute(`
      SELECT 
        r.*,
        u1.name as requester_name,
        u1.school,
        u2.name as approver_name,
        u3.name as dispatcher_name
      FROM requests r
      JOIN users u1 ON r.requester_id = u1.id
      LEFT JOIN users u2 ON r.approved_by = u2.id
      LEFT JOIN users u3 ON r.dispatched_by = u3.id
      WHERE r.id = ?
    `, [id]);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    // Buscar itens da solicitação
    const [items] = await db.execute(`
      SELECT 
        ri.*,
        m.name as material_name,
        m.unit
      FROM request_items ri
      JOIN materials m ON ri.material_id = m.id
      WHERE ri.request_id = ?
    `, [id]);

    res.json({
      ...requests[0],
      items
    });
    
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const { requester_id, items, priority = 'media', notes } = req.body;
    
    // Validar
    if (!requester_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Requester e itens são obrigatórios' });
    }

    await db.beginTransaction();

    try {
      // 1. Criar a solicitação principal
      const [requestResult] = await db.execute(
        `INSERT INTO requests 
        (requester_id, priority, notes) 
        VALUES (?, ?, ?)`,
        [requester_id, priority, notes || null]
      );

      const requestId = requestResult.insertId;

      // 2. Adicionar itens
      for (const item of items) {
        await db.execute(
          `INSERT INTO request_items 
          (request_id, material_id, requested_quantity) 
          VALUES (?, ?, ?)`,
          [requestId, item.material_id, item.quantity]
        );
      }

      await db.commit();

      // 3. Retornar a solicitação completa
      const [newRequest] = await db.execute(`
        SELECT r.*, u.name as requester_name, u.school
        FROM requests r
        JOIN users u ON r.requester_id = u.id
        WHERE r.id = ?
      `, [requestId]);

      res.status(201).json({
        ...newRequest[0],
        items
      });

    } catch (error) {
      await db.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Erro ao criar solicitação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para verificar estoque
async function checkStockAvailability(requestId) {
  const [items] = await db.execute(`
    SELECT 
      ri.material_id,
      m.name as material_name,
      ri.approved_quantity,
      m.current_stock,
      (m.current_stock - ri.approved_quantity) as new_stock
    FROM request_items ri
    JOIN materials m ON ri.material_id = m.id
    WHERE ri.request_id = ?
  `, [requestId]);
  const insufficientStock = items.filter(item => 
    Number(item.current_stock) < Number(item.approved_quantity)
  );

  if (insufficientStock.length > 0) {
    const materialNames = insufficientStock.map(item => item.material_name).join(', ');
    throw new Error(`Estoque insuficiente para: ${materialNames}`);
  }
}

// Rota de aprovação atualizada
app.put('/api/requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, approved_quantities } = req.body;

    await db.beginTransaction();

    try {
      // 1. Verificar estoque
      await checkStockAvailability(id);

      // 2. Atualizar quantidades aprovadas
      for (const item of approved_quantities) {
        await db.execute(
          `UPDATE request_items SET 
            approved_quantity = ?
          WHERE id = ? AND request_id = ?`,
          [item.quantity, item.item_id, id]
        );
      }

      // 3. Atualizar status
      await db.execute(
        `UPDATE requests SET 
          status = 'aprovado',
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [approved_by, id]
      );

      await db.commit();
      res.json({ message: 'Solicitação aprovada com sucesso' });

    } catch (error) {
      await db.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    res.status(400).json({ error: error.message });
  }
});

// Rota de despacho atualizada
app.put('/api/requests/:id/dispatch', async (req, res) => {
  try {
    const { id } = req.params;
    const { dispatched_by } = req.body;

    await db.beginTransaction();

    try {
      // 1. Verificar estoque novamente (para garantir)
      await checkStockAvailability(id);

      // 2. Definir quantidades despachadas
      await db.execute(
        `UPDATE request_items SET 
          dispatched_quantity = approved_quantity
        WHERE request_id = ?`,
        [id]
      );

      // 3. Atualizar status
      await db.execute(
        `UPDATE requests SET 
          status = 'despachado',
          dispatched_by = ?,
          dispatched_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [dispatched_by, id]
      );

      await db.commit();
      res.json({ message: 'Solicitação despachada com sucesso' });

    } catch (error) {
      await db.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erro ao despachar solicitação:', error);
    res.status(400).json({ error: error.message });
  }
});

// Rota para rejeição
app.put('/api/requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.execute(
      `UPDATE requests SET 
        status = 'rejeitado',
        notes = CONCAT(IFNULL(notes, ''), ?)
      WHERE id = ?`,
      [`\nMotivo da rejeição: ${reason}`, id]
    );

    res.json({ message: 'Solicitação rejeitada com sucesso' });
  } catch (error) {
    console.error('Erro ao rejeitar solicitação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para despacho
app.put('/api/requests/:id/dispatch', async (req, res) => {
  try {
    const { id } = req.params;
    const { dispatched_by } = req.body;

    await db.beginTransaction();

    try {
      // 1. Atualizar status
      await db.execute(
        `UPDATE requests SET 
          status = 'despachado',
          dispatched_by = ?,
          dispatched_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [dispatched_by, id]
      );

      // 2. Atualizar quantidades despachadas (assumindo que são iguais às aprovadas)
      await db.execute(
        `UPDATE request_items SET 
          dispatched_quantity = approved_quantity
        WHERE request_id = ?`,
        [id]
      );

      await db.commit();
      res.json({ message: 'Solicitação despachada com sucesso' });

    } catch (error) {
      await db.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Erro ao despachar solicitação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});



// Middleware de erro
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});


// Iniciar servidor
async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`API disponível em http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);
