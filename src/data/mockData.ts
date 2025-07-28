import { User, Material, Supplier, Request, RequestItem, StockEntry } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Administrador Sistema',
    email: 'admin@educacao.gov.br',
    role: 'administrador',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Carlos Mendes',
    email: 'carlos@educacao.gov.br',
    role: 'despachante',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Maria Silva',
    email: 'maria@escola1.edu.br',
    role: 'solicitante',
    school: 'Escola Municipal João da Silva',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 4,
    name: 'João Santos',
    email: 'joao@escola2.edu.br',
    role: 'solicitante',
    school: 'Escola Municipal Maria das Dores',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 5,
    name: 'Ana Costa',
    email: 'ana@escola3.edu.br',
    role: 'solicitante',
    school: 'Escola Municipal Pedro Alvares',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 6,
    name: 'Pedro Lima',
    email: 'pedro@escola4.edu.br',
    role: 'solicitante',
    school: 'Escola Municipal Santa Rita',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 7,
    name: 'Lucia Fernandes',
    email: 'lucia@escola5.edu.br',
    role: 'solicitante',
    school: 'Escola Municipal São José',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Mock Materials
export const mockMaterials: Material[] = [
  {
    id: 1,
    name: 'Arroz Branco Tipo 1',
    category: 'Alimentação',
    unit: 'kg',
    currentStock: 150,
    minStock: 50,
    description: 'Arroz branco tipo 1 para merenda escolar',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    name: 'Feijão Preto',
    category: 'Alimentação',
    unit: 'kg',
    currentStock: 25,
    minStock: 30,
    description: 'Feijão preto para merenda escolar',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 3,
    name: 'Óleo de Soja',
    category: 'Alimentação',
    unit: 'litro',
    currentStock: 45,
    minStock: 20,
    description: 'Óleo de soja refinado para cozinha',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 4,
    name: 'Detergente Neutro',
    category: 'Material de Limpeza',
    unit: 'unidade',
    currentStock: 15,
    minStock: 25,
    description: 'Detergente neutro 500ml',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 5,
    name: 'Papel Higiênico',
    category: 'Material de Limpeza',
    unit: 'pacote',
    currentStock: 80,
    minStock: 30,
    description: 'Papel higiênico folha dupla - pacote com 4 rolos',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 6,
    name: 'Sabão em Pó',
    category: 'Material de Limpeza',
    unit: 'kg',
    currentStock: 35,
    minStock: 15,
    description: 'Sabão em pó para limpeza geral',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 7,
    name: 'Papel A4',
    category: 'Material de Expediente',
    unit: 'resma',
    currentStock: 12,
    minStock: 20,
    description: 'Papel sulfite A4 500 folhas',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 8,
    name: 'Caneta Esferográfica Azul',
    category: 'Material de Expediente',
    unit: 'unidade',
    currentStock: 200,
    minStock: 50,
    description: 'Caneta esferográfica azul',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 9,
    name: 'Lápis de Cor',
    category: 'Material Pedagógico',
    unit: 'caixa',
    currentStock: 45,
    minStock: 25,
    description: 'Caixa com 12 lápis de cor',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 10,
    name: 'Caderno Universitário',
    category: 'Material Pedagógico',
    unit: 'unidade',
    currentStock: 180,
    minStock: 100,
    description: 'Caderno universitário 96 folhas',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
];

// Mock Suppliers
export const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'Distribuidora Alimentos Ltda',
    email: 'vendas@distribuidora.com',
    phone: '(11) 1234-5678',
    address: 'Rua das Flores, 123 - Centro - São Paulo/SP',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Fornecedor Limpeza S/A',
    email: 'contato@limpeza.com',
    phone: '(11) 2345-6789',
    address: 'Av. Principal, 456 - Industrial - São Paulo/SP',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Papelaria Escolar ME',
    email: 'vendas@papelaria.com',
    phone: '(11) 3456-7890',
    address: 'Rua Comercial, 789 - Centro - São Paulo/SP',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 4,
    name: 'Material Pedagógico Educação',
    email: 'atendimento@materialpedagogico.com',
    phone: '(11) 4567-8901',
    address: 'Av. Educação, 321 - Vila Escolar - São Paulo/SP',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Mock Request Items
export const mockRequestItems: RequestItem[] = [
  // Request 1 items
  {
    id: 1,
    requestId: 1,
    materialId: 1,
    requestedQuantity: 50,
    approvedQuantity: 45,
    dispatchedQuantity: 45,
    material: mockMaterials.find(m => m.id === 1)
  },
  {
    id: 2,
    requestId: 1,
    materialId: 2,
    requestedQuantity: 20,
    approvedQuantity: 15,
    dispatchedQuantity: 15,
    material: mockMaterials.find(m => m.id === 2)
  },
  // Request 2 items
  {
    id: 3,
    requestId: 2,
    materialId: 4,
    requestedQuantity: 30,
    approvedQuantity: 25,
    material: mockMaterials.find(m => m.id === 4)
  },
  {
    id: 4,
    requestId: 2,
    materialId: 5,
    requestedQuantity: 15,
    approvedQuantity: 15,
    material: mockMaterials.find(m => m.id === 5)
  },
  // Request 3 items
  {
    id: 5,
    requestId: 3,
    materialId: 7,
    requestedQuantity: 10,
    material: mockMaterials.find(m => m.id === 7)
  },
  {
    id: 6,
    requestId: 3,
    materialId: 8,
    requestedQuantity: 50,
    material: mockMaterials.find(m => m.id === 8)
  },
  // Request 4 items
  {
    id: 7,
    requestId: 4,
    materialId: 9,
    requestedQuantity: 20,
    material: mockMaterials.find(m => m.id === 9)
  },
  {
    id: 8,
    requestId: 4,
    materialId: 10,
    requestedQuantity: 100,
    material: mockMaterials.find(m => m.id === 10)
  },
  // Request 5 items
  {
    id: 9,
    requestId: 5,
    materialId: 1,
    requestedQuantity: 30,
    material: mockMaterials.find(m => m.id === 1)
  },
  {
    id: 10,
    requestId: 5,
    materialId: 3,
    requestedQuantity: 10,
    material: mockMaterials.find(m => m.id === 3)
  }
];

// Mock Requests
export const mockRequests: Request[] = [
  {
    id: 1,
    requesterId: 3,
    status: 'despachado',
    priority: 'alta',
    notes: 'Materiais para merenda escolar - urgente',
    approvedBy: 2,
    approvedAt: '2024-01-10T10:00:00Z',
    dispatchedBy: 2,
    dispatchedAt: '2024-01-11T14:30:00Z',
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-11T14:30:00Z',
    requester: mockUsers.find(u => u.id === 3),
    approver: mockUsers.find(u => u.id === 2),
    dispatcher: mockUsers.find(u => u.id === 2),
    items: mockRequestItems.filter(item => item.requestId === 1)
  },
  {
    id: 2,
    requesterId: 4,
    status: 'aprovado',
    priority: 'media',
    notes: 'Material de limpeza para manutenção',
    approvedBy: 2,
    approvedAt: '2024-01-12T11:00:00Z',
    createdAt: '2024-01-10T15:30:00Z',
    updatedAt: '2024-01-12T11:00:00Z',
    requester: mockUsers.find(u => u.id === 4),
    approver: mockUsers.find(u => u.id === 2),
    items: mockRequestItems.filter(item => item.requestId === 2)
  },
  {
    id: 3,
    requesterId: 5,
    status: 'pendente',
    priority: 'media',
    notes: 'Material de expediente para atividades administrativas',
    createdAt: '2024-01-13T08:45:00Z',
    updatedAt: '2024-01-13T08:45:00Z',
    requester: mockUsers.find(u => u.id === 5),
    items: mockRequestItems.filter(item => item.requestId === 3)
  },
  {
    id: 4,
    requesterId: 6,
    status: 'pendente',
    priority: 'baixa',
    notes: 'Material pedagógico para atividades escolares',
    createdAt: '2024-01-14T16:20:00Z',
    updatedAt: '2024-01-14T16:20:00Z',
    requester: mockUsers.find(u => u.id === 6),
    items: mockRequestItems.filter(item => item.requestId === 4)
  },
  {
    id: 5,
    requesterId: 7,
    status: 'pendente',
    priority: 'alta',
    notes: 'Materiais para evento escolar',
    createdAt: '2024-01-15T10:15:00Z',
    updatedAt: '2024-01-15T10:15:00Z',
    requester: mockUsers.find(u => u.id === 7),
    items: mockRequestItems.filter(item => item.requestId === 5)
  }
];

// Mock Stock Entries
export const mockStockEntries: StockEntry[] = [
  {
    id: 1,
    materialId: 1,
    supplierId: 1,
    quantity: 100,
    unitPrice: 4.50,
    batch: 'ARR2024001',
    notes: 'Entrada de arroz - primeira remessa do ano',
    createdBy: 2,
    createdAt: '2024-01-05T09:00:00Z',
    material: mockMaterials.find(m => m.id === 1),
    supplier: mockSuppliers.find(s => s.id === 1),
    user: mockUsers.find(u => u.id === 2)
  },
  {
    id: 2,
    materialId: 2,
    supplierId: 1,
    quantity: 50,
    unitPrice: 6.80,
    batch: 'FEI2024001',
    notes: 'Entrada de feijão preto',
    createdBy: 2,
    createdAt: '2024-01-05T09:30:00Z',
    material: mockMaterials.find(m => m.id === 2),
    supplier: mockSuppliers.find(s => s.id === 1),
    user: mockUsers.find(u => u.id === 2)
  },
  {
    id: 3,
    materialId: 4,
    supplierId: 2,
    quantity: 50,
    unitPrice: 3.20,
    batch: 'DET2024001',
    notes: 'Entrada de detergente neutro',
    createdBy: 2,
    createdAt: '2024-01-06T14:00:00Z',
    material: mockMaterials.find(m => m.id === 4),
    supplier: mockSuppliers.find(s => s.id === 2),
    user: mockUsers.find(u => u.id === 2)
  },
  {
    id: 4,
    materialId: 7,
    supplierId: 3,
    quantity: 30,
    unitPrice: 25.00,
    batch: 'PAP2024001',
    notes: 'Entrada de papel A4',
    createdBy: 2,
    createdAt: '2024-01-07T11:15:00Z',
    material: mockMaterials.find(m => m.id === 7),
    supplier: mockSuppliers.find(s => s.id === 3),
    user: mockUsers.find(u => u.id === 2)
  },
  {
    id: 5,
    materialId: 9,
    supplierId: 4,
    quantity: 25,
    unitPrice: 12.50,
    batch: 'LAP2024001',
    notes: 'Entrada de lápis de cor',
    createdBy: 1,
    createdAt: '2024-01-08T15:45:00Z',
    material: mockMaterials.find(m => m.id === 9),
    supplier: mockSuppliers.find(s => s.id === 4),
    user: mockUsers.find(u => u.id === 1)
  }
];

// Current logged user (can be changed for testing different roles)
export let currentUser: User = mockUsers[0]; // Admin by default

export const setCurrentUser = (user: User) => {
  currentUser = user;
};

// Helper functions for mock data manipulation
export const getMaterialById = (id: number): Material | undefined => {
  return mockMaterials.find(material => material.id === id);
};

export const getUserById = (id: number): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getSupplierById = (id: number): Supplier | undefined => {
  return mockSuppliers.find(supplier => supplier.id === id);
};

export const getRequestsByUser = (userId: number): Request[] => {
  return mockRequests.filter(request => request.requesterId === userId);
};

export const getLowStockMaterials = (): Material[] => {
  return mockMaterials.filter(material => material.currentStock <= material.minStock);
};

export const getRecentEntries = (days: number = 7): StockEntry[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return mockStockEntries.filter(entry => 
    new Date(entry.createdAt) >= cutoffDate
  );
};