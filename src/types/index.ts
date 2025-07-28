export interface User {
  id: number;
  name: string;
  email: string;
  role: 'solicitante' | 'despachante' | 'administrador';
  school?: string;
  createdAt: string;
}

export interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface StockEntry {
  id: number;
  materialId: number;
  supplierId: number;
  quantity: number;
  unitPrice?: number;
  batch?: string;
  expiryDate?: string;
  notes?: string;
  createdBy: number;
  createdAt: string;
  createdUser: string;
  material?: Material;
  supplier?: Supplier;
  user?: User;
}

export interface Request {
  id: number;
  requesterId: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'despachado' | 'cancelado';
  priority: 'baixa' | 'media' | 'alta';
  notes?: string;
  approvedBy?: number;
  approvedAt?: string;
  dispatchedBy?: number;
  dispatchedAt?: string;
  createdAt: string;
  updatedAt: string;
  requester?: User;
  approver?: User;
  dispatcher?: User;
  items?: RequestItem[];
  itemsCount: number,
}

export interface RequestItem {
  id: number;
  requestId: number;
  materialId: number;
  requestedQuantity: number;
  approvedQuantity?: number;
  dispatchedQuantity?: number;
  notes?: string;
  material?: Material;
}

export interface StockMovement {
  id: number;
  materialId: number;
  type: 'entrada' | 'saida';
  quantity: number;
  reason: string;
  referenceId?: number;
  referenceType?: 'request' | 'entry' | 'adjustment';
  createdBy: number;
  createdAt: string;
  material?: Material;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}