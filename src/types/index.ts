export interface User {
  id: string;
  name: string;
  email: string;
  role: 'solicitante' | 'despachante' | 'administrador';
  school?: string;
  createdAt: string;
}

export interface Material {
  id: string;
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
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface StockEntry {
  id: string;
  materialId: string;
  supplierId: string;
  quantity: number;
  unitPrice?: number;
  batch?: string;
  expiryDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  createdUser: string;
  material?: Material;
  supplier?: Supplier;
  user?: User;
}

export interface Request {
  id: string;
  requesterId: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'despachado' | 'cancelado';
  priority: 'baixa' | 'media' | 'alta';
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  dispatchedBy?: string;
  dispatchedAt?: string;
  createdAt: string;
  updatedAt: string;
  requester?: User;
  approver?: User;
  dispatcher?: User;
  items?: RequestItem[];
  itemsCount?: number;
}

export interface RequestItem {
  id: string;
  requestId: string;
  materialId: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  dispatchedQuantity?: number;
  notes?: string;
  material?: Material;
}

export interface StockMovement {
  id: string;
  materialId: string;
  type: 'entrada' | 'saida';
  quantity: number;
  reason: string;
  referenceId?: string;
  referenceType?: 'request' | 'entry' | 'adjustment';
  createdBy: string;
  createdAt: string;
  material?: Material;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signUp?: (email: string, password: string, userData: {
    name: string;
    role: 'solicitante' | 'despachante' | 'administrador';
    school?: string;
  }) => Promise<boolean>;
  loading: boolean;
}