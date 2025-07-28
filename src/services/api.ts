import axios from 'axios';
import { 
  User, 
  Material, 
  Supplier, 
  StockEntry,
  Request,
  RequestItem,
  StockMovement 
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3002/api', // endereço do seu server.js
  withCredentials: true, // envia os cookies da sessão
});

//Dashboard
export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};


//Materiais
export const materialsApi = {
  getAll: async (): Promise<Material[]> => {
    const response = await api.get('/materials');
    // Mapeie os campos do servidor para o tipo local
    return response.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.current_stock, // Conversão de snake_case para camelCase
      minStock: item.min_stock,
      description: item.description,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  },

  create: async (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'currentStock'>) => {
    const response = await api.post('/materials', {
      // Conversão para o formato do servidor
      name: material.name,
      category: material.category,
      unit: material.unit,
      min_stock: material.minStock,
      description: material.description
    });
    return response.data;
  },

  update: async (id: number, material: Partial<Material>) => {
    const response = await api.put(`/materials/${id}`, {
      name: material.name,
      category: material.category,
      unit: material.unit,
      min_stock: material.minStock,
      description: material.description
    });
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/materials/${id}`);
  },

  search: async (query: string): Promise<Pick<Material, 'id' | 'name' | 'currentStock'>[]> => {
    const response = await api.get('/materials/search', { params: { query } });
    return response.data;
  }
};

//suppliers
export const suppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    const response = await api.get('/suppliers');
    return response.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  },

  create: async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post('/suppliers', {
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
    });
    return response.data;
  },

  update: async (id: number, supplier: Partial<Supplier>) => {
    const response = await api.put(`/suppliers/${id}`, {
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
    });
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/suppliers/${id}`);
  }
};

export const usersApi = {
  getAll: async () => {
    const res = await api.get('/users');
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/users', data);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
};


//STOCKENTRIES
export const stockEntriesApi = {
  getAll: async () => {
    const res = await api.get(`/stock-entries`);
    return res.data;
  },

  create: async (data : any) => {
    const res = await api.post(`/stock-entries`, data);
    return res.data;
  },

  update: async (id : number, data : any) => {
    const res = await api.put(`/stock-entries/${id}`, data);
    return res.data;
  },

  delete: async (id : number) => {
    const res = await api.delete(`/stock-entries/${id}`);
    return res.data;
  },
};


// SOLICITAÇÕES
export const requestsApi = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get('/requests');
    return response.data;
  },

  getById: async (id: number): Promise<any> => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  create: async (request: {
    requester_id: number;
    priority: string;
    notes?: string;
    items: Array<{
      material_id: number;
      quantity: number;
      notes?: string;
    }>;
  }): Promise<any> => {
    const response = await api.post('/requests', request);
    return response.data;
  },

  update: async (id: number, data: any): Promise<any> => {
    const response = await api.put(`/requests/${id}`, data);
    return response.data;
  },

  approve: async (
    id: number, 
    approvedBy: number, 
    items: Array<{
      item_id: number;
      quantity: number;
    }>
  ): Promise<any> => {
    const response = await api.put(`/requests/${id}/approve`, {
      approved_by: approvedBy,
      approved_quantities: items
    });
    return response.data;
  },

  reject: async (id: number, reason: string): Promise<any> => {
    const response = await api.put(`/requests/${id}/reject`, { reason });
    return response.data;
  },

  dispatch: async (id: number, dispatchedBy: number): Promise<any> => {
    const response = await api.put(`/requests/${id}/dispatch`, { 
      dispatched_by: dispatchedBy 
    });
    return response.data;
  }
};

export default api;