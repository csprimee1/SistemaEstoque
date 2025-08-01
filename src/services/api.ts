import { supabase, getCurrentUserProfile } from '../lib/supabase';
import { validateSession } from '../lib/supabase';
import { 
  User, 
  Material, 
  Supplier, 
  StockEntry,
  Request,
  RequestItem,
  StockMovement 
} from '../types';


//Dashboard
export const dashboardApi = {
  getStats: async () => {
    const currentUser = await validateSession();
    if (!currentUser) throw new Error('User not authenticated');
    
    // Get total materials count
    const { count: totalMaterials } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true });
    
    // Get pending requests count
    let pendingRequestsQuery = supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente');

    if (currentUser.role === 'solicitante') {
      pendingRequestsQuery = pendingRequestsQuery.eq('requester_id', currentUser.id);
    }

    const { count: pendingRequests } = await pendingRequestsQuery;

    // Get low stock items count
    const { count: lowStockItems } = await supabase
      .from('low_stock_materials')
      .select('*', { count: 'exact', head: true });

    // Get total users count (admin only)
    let totalUsers = 0;
    if (currentUser.role === 'administrador') {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      totalUsers = count || 0;
    }

    // Get recent entries count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recentEntries } = await supabase
      .from('stock_entries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get monthly requests count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let monthlyRequestsQuery = supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (currentUser.role === 'solicitante') {
      monthlyRequestsQuery = monthlyRequestsQuery.eq('requester_id', currentUser.id);
    }

    const { count: monthlyRequests } = await monthlyRequestsQuery;

    return {
      totalMaterials: currentUser.role === 'solicitante' ? 0 : (totalMaterials || 0),
      pendingRequests: pendingRequests || 0,
      lowStockItems: currentUser.role === 'solicitante' ? 0 : (lowStockItems || 0),
      totalUsers,
      recentEntries: currentUser.role === 'solicitante' ? 0 : (recentEntries || 0),
      monthlyRequests: monthlyRequests || 0
    };
  },
};


//Materiais
export const materialsApi = {
  getAll: async (): Promise<Material[]> => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name');

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.current_stock || 0,
      minStock: item.min_stock || 0,
      description: item.description,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  },

  create: async (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt' | 'currentStock'>) => {
    const { data, error } = await supabase
      .from('materials')
      .insert({
        name: material.name,
        category: material.category,
        unit: material.unit,
        min_stock: material.minStock,
        description: material.description
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, material: Partial<Material>) => {
    const { data, error } = await supabase
      .from('materials')
      .update({
        name: material.name,
        category: material.category,
        unit: material.unit,
        min_stock: material.minStock,
        description: material.description
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  search: async (query: string): Promise<Pick<Material, 'id' | 'name' | 'currentStock'>[]> => {
    const { data, error } = await supabase
      .from('materials')
      .select('id, name, current_stock')
      .ilike('name', `%${query}%`)
      .limit(20);

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      name: material.name,
      currentStock: item.current_stock || 0
    }));
  }
};

//suppliers
export const suppliersApi = {
  getAll: async (): Promise<Supplier[]> => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) throw error;

    return (data || []).map((item: any) => ({
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
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, supplier: Partial<Supplier>) => {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const usersApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  create: async (userData: any) => {
    // This would typically be handled through Supabase Auth signup
    // For now, we'll just insert the user profile
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, userData: any) => {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

//STOCKENTRIES
export const stockEntriesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('stock_entries')
      .select(`
        *,
        material:materials(*),
        supplier:suppliers(*),
        user:users(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((entry: any) => ({
      id: entry.id,
      materialId: entry.material_id,
      supplierId: entry.supplier_id,
      quantity: entry.quantity,
      unitPrice: entry.unit_price,
      batch: entry.batch,
      expiryDate: entry.expiry_date,
      notes: entry.notes,
      createdBy: entry.created_by,
      createdAt: entry.created_at,
      createdUser: entry.user?.name || 'N/A',
      material: entry.material ? {
        id: entry.material.id,
        name: entry.material.name,
        unit: entry.material.unit,
        category: entry.material.category,
        currentStock: entry.material.current_stock,
        minStock: entry.material.min_stock,
        description: entry.material.description,
        createdAt: entry.material.created_at,
        updatedAt: entry.material.updated_at
      } : undefined,
      supplier: entry.supplier ? {
        id: entry.supplier.id,
        name: entry.supplier.name,
        email: entry.supplier.email,
        phone: entry.supplier.phone,
        address: entry.supplier.address,
        createdAt: entry.supplier.created_at
      } : undefined
    }));
  },

  create: async (data: any) => {
    const currentUser = await validateSession();
    if (!currentUser) throw new Error('User not authenticated');
    console.log(data);
    const { data: result, error } = await supabase
      .from('stock_entries')
      .insert({
        ...data,
        created_by: currentUser.id
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  update: async (id: string, data: any) => {
    const { data: result, error } = await supabase
      .from('stock_entries')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('stock_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};


// SOLICITAÇÕES
export const requestsApi = {
  getAll: async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('requests')
    .select(`
      id,
      status,
      priority,
      created_at,
      requester:requester_id (id, name, school),
      approver:approved_by (name),
      dispatcher:dispatched_by (name),
      items:request_items (
        requested_quantity,
        dispatched_quantity
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((request) => {
    // Calcular totais dos itens
    const itemsCount = request.items?.length || 0;
    const totalRequested = request.items?.reduce(
      (sum: number, item: any) => sum + (item.requested_quantity || 0), 0
    ) || 0;
    const totalDispatched = request.items?.reduce(
      (sum: number, item: any) => sum + (item.dispatched_quantity || 0), 0
    ) || 0;

    return {
      id: request.id,
      status: request.status,
      priority: request.priority,
      created_at: request.created_at,
      requester_name: request.requester?.name,
      requesterId: request.requester?.id,
      school: request.requester?.school,
      approver_name: request.approver?.name,
      dispatcher_name: request.dispatcher?.name,
      itemsCount,
      totalRequested,
      totalDispatched
    };
  });
},

  getById: async (id: string): Promise<any> => {
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        requester:users!requests_requester_id_fkey(*),
        approver:users!requests_approved_by_fkey(*),
        dispatcher:users!requests_dispatched_by_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (requestError) throw requestError;

    const { data: items, error: itemsError } = await supabase
      .from('request_items')
      .select(`
        *,
        material:materials(*)
      `)
      .eq('request_id', id);

    if (itemsError) throw itemsError;

    return {
      ...request,
      items: items || []
    };
  },

  create: async (request: {
    requester_id: string;
    priority: string;
    notes?: string;
    items: Array<{
      material_id: string;
      quantity: number;
      notes?: string;
    }>;
  }): Promise<any> => {
    const currentUser = await validateSession();
    if (!currentUser) throw new Error('User not authenticated');

    // Create the request
    const { data: newRequest, error: requestError } = await supabase
      .from('requests')
      .insert({
        requester_id: currentUser.id,
        priority: request.priority,
        notes: request.notes
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Create the request items
    const itemsToInsert = request.items.map(item => ({
      request_id: newRequest.id,
      material_id: item.material_id,
      requested_quantity: item.quantity,
      notes: item.notes
    }));

    const { error: itemsError } = await supabase
      .from('request_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return newRequest;
  },

  update: async (id: string, data: any): Promise<any> => {
    const { data: result, error } = await supabase
      .from('requests')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  approve: async (
    id: string, 
    approvedBy: string, 
    items: Array<{
      item_id: string;
      quantity: number;
    }>
  ): Promise<any> => {
    // Update request status
    const { error: requestError } = await supabase
      .from('requests')
      .update({
        status: 'aprovado',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (requestError) throw requestError;

    // Update approved quantities for each item
    for (const item of items) {
      const { error: itemError } = await supabase
        .from('request_items')
        .update({
          approved_quantity: item.quantity
        })
        .eq('id', item.item_id);

      if (itemError) throw itemError;
    }

    return { success: true };
  },

  reject: async (id: string, reason: string): Promise<any> => {
    const currentUser = await validateSession();
    if (!currentUser) throw new Error('User not authenticated');

    const { data: req, error: fetchError } = await supabase
      .from("requests")
      .select("notes")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const updatedNotes = (req.notes ?? "") + `\nMotivo da rejeição: ${reason}`;

    const { data, error } = await supabase
      .from("requests")
      .update({
        status: "rejeitado",
        approved_by: currentUser.id,
        approved_at: new Date().toISOString(),
        notes: updatedNotes
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  dispatch: async (id: string, dispatchedBy: string): Promise<any> => {
    // Update request status
    const { error: requestError } = await supabase
      .from('requests')
      .update({
        status: 'despachado',
        dispatched_by: dispatchedBy,
        dispatched_at: new Date().toISOString()
      })
      .eq('id', id);

    if (requestError) throw requestError;

    const { error } = await supabase.rpc('dispatch_request_items', { req_id: id });
    if (error) throw error;

    return { success: true };
      }
    };

// Clean up expired sessions periodically
export const cleanupSessions = async () => {
  try {
    await supabase.rpc('clean_expired_sessions');
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
};