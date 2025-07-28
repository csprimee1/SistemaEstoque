import { 
  mockUsers, 
  mockMaterials, 
  mockSuppliers, 
  mockRequests, 
  mockStockEntries,
  mockRequestItems,
  getLowStockMaterials,
  getRecentEntries,
  getRequestsByUser
} from '../data/mockData';
import { User, Material, Supplier, Request, StockEntry, RequestItem } from '../types';

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Session storage key
const SESSION_KEY = 'inventory_session';

// Session management
let currentSession: { user: User; timestamp: number } | null = null;

const saveSession = (user: User) => {
  const session = {
    user,
    timestamp: Date.now()
  };
  currentSession = session;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const getStoredSession = (): { user: User; timestamp: number } | null => {
  if (currentSession) return currentSession;
  
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      // Verificar se a sessão não expirou (24 horas)
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - session.timestamp < twentyFourHours) {
        currentSession = session;
        return session;
      } else {
        // Sessão expirada
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  } catch (error) {
    sessionStorage.removeItem(SESSION_KEY);
  }
  
  return null;
};

const clearSession = () => {
  currentSession = null;
  sessionStorage.removeItem(SESSION_KEY);
};

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<User | null> => {
    await delay();
    
    // Simple mock authentication - in real app, check password hash
    const user = mockUsers.find(u => u.email === email);
    
    if (user && password === 'password') {
      saveSession(user);
      return user;
    }
    
    return null;
  },

  getSession: async (): Promise<User | null> => {
    await delay(200);
    
    const session = getStoredSession();
    return session ? session.user : null;
  },

  logout: async (): Promise<void> => {
    await delay(200);
    clearSession();
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    await delay();
    
    const session = getStoredSession();
    if (!session) throw new Error('Sessão inválida');
    
    const currentUser = session.user;
    
    const totalMaterials = mockMaterials.length;
    const lowStockItems = getLowStockMaterials().length;
    const recentEntries = getRecentEntries().length;
    
    let pendingRequests = 0;
    let monthlyRequests = 0;
    
    if (currentUser.role === 'solicitante') {
      const userRequests = getRequestsByUser(currentUser.id);
      pendingRequests = userRequests.filter(r => r.status === 'pendente').length;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      monthlyRequests = userRequests.filter(r => {
        const requestDate = new Date(r.createdAt);
        return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
      }).length;
    } else {
      pendingRequests = mockRequests.filter(r => r.status === 'pendente').length;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      monthlyRequests = mockRequests.filter(r => {
        const requestDate = new Date(r.createdAt);
        return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
      }).length;
    }
    
    return {
      totalMaterials: currentUser.role === 'solicitante' ? 0 : totalMaterials,
      pendingRequests,
      lowStockItems: currentUser.role === 'solicitante' ? 0 : lowStockItems,
      totalUsers: currentUser.role === 'administrador' ? mockUsers.length : 0,
      recentEntries: currentUser.role === 'solicitante' ? 0 : recentEntries,
      monthlyRequests
    };
  }
};

// Helper function to get current user from session
const getCurrentUser = (): User => {
  const session = getStoredSession();
  if (!session) throw new Error('Sessão inválida');
  return session.user;
};

// Materials API
export const materialsApi = {
  getAll: async (): Promise<Material[]> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    return [...mockMaterials];
  },

  getById: async (id: number): Promise<Material | null> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    return mockMaterials.find(m => m.id === id) || null;
  },

  create: async (data: Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'currentStock'>): Promise<Material> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    
    const newMaterial: Material = {
      ...data,
      id: Math.max(...mockMaterials.map(m => m.id)) + 1,
      currentStock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockMaterials.push(newMaterial);
    return newMaterial;
  },

  update: async (id: number, data: Partial<Material>): Promise<Material | null> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    
    const index = mockMaterials.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    mockMaterials[index] = {
      ...mockMaterials[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return mockMaterials[index];
  },

  delete: async (id: number): Promise<boolean> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    
    const index = mockMaterials.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    mockMaterials.splice(index, 1);
    return true;
  }
};

// Suppliers API
export const suppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    return [...mockSuppliers];
  },

  create: async (data: Omit<Supplier, 'id' | 'createdAt'>): Promise<Supplier> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    
    const newSupplier: Supplier = {
      ...data,
      id: Math.max(...mockSuppliers.map(s => s.id)) + 1,
      createdAt: new Date().toISOString()
    };
    
    mockSuppliers.push(newSupplier);
    return newSupplier;
  },

  update: async (id: number, data: Partial<Supplier>): Promise<Supplier | null> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    
    const index = mockSuppliers.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    mockSuppliers[index] = {
      ...mockSuppliers[index],
      ...data
    };
    
    return mockSuppliers[index];
  },

  delete: async (id: number): Promise<boolean> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    
    const index = mockSuppliers.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    mockSuppliers.splice(index, 1);
    return true;
  }
};

// Requests API
export const requestsApi = {
  getAll: async (): Promise<Request[]> => {
    await delay();
    const currentUser = getCurrentUser();
    
    if (currentUser.role === 'solicitante') {
      return mockRequests.filter(r => r.requesterId === currentUser.id);
    }
    
    return [...mockRequests];
  },

  getById: async (id: number): Promise<Request | null> => {
    await delay();
    const currentUser = getCurrentUser();
    
    const request = mockRequests.find(r => r.id === id);
    
    if (!request) return null;
    
    // Check permissions
    if (currentUser.role === 'solicitante' && request.requesterId !== currentUser.id) {
      return null;
    }
    
    return request;
  },

  create: async (data: any): Promise<Request> => {
    await delay();
    const currentUser = getCurrentUser();
    
    const newRequestId = Math.max(...mockRequests.map(r => r.id)) + 1;
    
    const newRequest: Request = {
      id: newRequestId,
      requesterId: currentUser.id,
      status: 'pendente',
      priority: data.priority,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requester: currentUser
    };
    
    // Create request items
    const newItems: RequestItem[] = data.items.map((item: any, index: number) => ({
      id: Math.max(...mockRequestItems.map(i => i.id), 0) + index + 1,
      requestId: newRequestId,
      materialId: item.materialId,
      requestedQuantity: item.requestedQuantity,
      notes: item.notes,
      material: mockMaterials.find(m => m.id === item.materialId)
    }));
    
    mockRequestItems.push(...newItems);
    newRequest.items = newItems;
    
    mockRequests.push(newRequest);
    return newRequest;
  },

  update: async (id: number, data: any): Promise<Request | null> => {
    await delay();
    const currentUser = getCurrentUser();
    
    const index = mockRequests.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    const request = mockRequests[index];
    
    // Check permissions - only requester can edit pending requests
    if (request.requesterId !== currentUser.id || request.status !== 'pendente') {
      throw new Error('Não é possível editar esta solicitação');
    }
    
    // Update request
    mockRequests[index] = {
      ...request,
      priority: data.priority,
      notes: data.notes,
      updatedAt: new Date().toISOString()
    };
    
    // Remove old items
    const oldItemsIndexes = mockRequestItems
      .map((item, idx) => item.requestId === id ? idx : -1)
      .filter(idx => idx !== -1)
      .reverse(); // Remove from end to avoid index issues
    
    oldItemsIndexes.forEach(idx => mockRequestItems.splice(idx, 1));
    
    // Add new items
    const newItems: RequestItem[] = data.items.map((item: any, index: number) => ({
      id: Math.max(...mockRequestItems.map(i => i.id), 0) + index + 1,
      requestId: id,
      materialId: item.materialId,
      requestedQuantity: item.requestedQuantity,
      notes: item.notes,
      material: mockMaterials.find(m => m.id === item.materialId)
    }));
    
    mockRequestItems.push(...newItems);
    mockRequests[index].items = newItems;
    
    return mockRequests[index];
  },

  approve: async (id: number, approvedItems: { materialId: number; approvedQuantity: number }[]): Promise<Request | null> => {
    await delay();
    const currentUser = getCurrentUser();
    
    const request = mockRequests.find(r => r.id === id);
    if (!request) return null;
    
    // Update request status
    request.status = 'aprovado';
    request.approvedBy = currentUser.id;
    request.approvedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();
    request.approver = currentUser;
    
    // Update approved quantities in items
    if (request.items) {
      request.items.forEach(item => {
        const approvedItem = approvedItems.find(ai => ai.materialId === item.materialId);
        if (approvedItem) {
          item.approvedQuantity = approvedItem.approvedQuantity;
          
          // Update in mockRequestItems as well
          const mockItem = mockRequestItems.find(mi => mi.id === item.id);
          if (mockItem) {
            mockItem.approvedQuantity = approvedItem.approvedQuantity;
          }
        }
      });
    }
    
    return request;
  },

  dispatch: async (id: number, dispatchedItems: { materialId: number; dispatchedQuantity: number }[]): Promise<Request | null> => {
    await delay();
    const currentUser = getCurrentUser();
    
    const request = mockRequests.find(r => r.id === id);
    if (!request) return null;
    
    // Update request status
    request.status = 'despachado';
    request.dispatchedBy = currentUser.id;
    request.dispatchedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();
    request.dispatcher = currentUser;
    
    // Update dispatched quantities and material stock
    if (request.items) {
      request.items.forEach(item => {
        const dispatchedItem = dispatchedItems.find(di => di.materialId === item.materialId);
        if (dispatchedItem && item.material) {
          item.dispatchedQuantity = dispatchedItem.dispatchedQuantity;
          
          // Update in mockRequestItems as well
          const mockItem = mockRequestItems.find(mi => mi.id === item.id);
          if (mockItem) {
            mockItem.dispatchedQuantity = dispatchedItem.dispatchedQuantity;
          }
          
          // Update material stock
          const material = mockMaterials.find(m => m.id === item.materialId);
          if (material) {
            material.currentStock -= dispatchedItem.dispatchedQuantity;
            material.updatedAt = new Date().toISOString();
          }
        }
      });
    }
    
    return request;
  },

  reject: async (id: number, reason: string): Promise<Request | null> => {
    await delay();
    const currentUser = getCurrentUser();
    
    const request = mockRequests.find(r => r.id === id);
    if (!request) return null;
    
    request.status = 'rejeitado';
    request.approvedBy = currentUser.id;
    request.approvedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();
    request.notes = (request.notes || '') + '\n\nMotivo da rejeição: ' + reason;
    request.approver = currentUser;
    
    return request;
  }
};

// Stock Entries API
export const stockEntriesApi = {
  getAll: async (): Promise<StockEntry[]> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    return [...mockStockEntries];
  },

  create: async (data: Omit<StockEntry, 'id' | 'createdAt' | 'createdBy' | 'user'>): Promise<StockEntry> => {
    await delay();
    const currentUser = getCurrentUser();
    
    const newEntry: StockEntry = {
      ...data,
      id: Math.max(...mockStockEntries.map(e => e.id)) + 1,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      user: currentUser
    };
    
    // Update material stock
    const material = mockMaterials.find(m => m.id === data.materialId);
    if (material) {
      material.currentStock += data.quantity;
      material.updatedAt = new Date().toISOString();
    }
    
    mockStockEntries.push(newEntry);
    return newEntry;
  }
};

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    return [...mockUsers];
  },

  create: async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    
    const newUser: User = {
      ...data,
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      createdAt: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    return newUser;
  },

  update: async (id: number, data: Partial<User>): Promise<User | null> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    mockUsers[index] = {
      ...mockUsers[index],
      ...data
    };
    
    return mockUsers[index];
  },

  delete: async (id: number): Promise<boolean> => {
    await delay();
    getCurrentUser(); // Verificar sessão
    
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    mockUsers.splice(index, 1);
    return true;
  }
};