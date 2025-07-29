export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'solicitante' | 'despachante' | 'administrador'
          school: string | null
          password_hash: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: 'solicitante' | 'despachante' | 'administrador'
          school?: string | null
          password_hash?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'solicitante' | 'despachante' | 'administrador'
          school?: string | null
          password_hash?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      materials: {
        Row: {
          id: string
          name: string
          category: string
          unit: string
          current_stock: number | null
          min_stock: number | null
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          unit: string
          current_stock?: number | null
          min_stock?: number | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          unit?: string
          current_stock?: number | null
          min_stock?: number | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      stock_entries: {
        Row: {
          id: string
          material_id: string
          supplier_id: string
          quantity: number
          unit_price: number | null
          batch: string | null
          expiry_date: string | null
          notes: string | null
          created_by: string
          created_at: string | null
        }
        Insert: {
          id?: string
          material_id: string
          supplier_id: string
          quantity: number
          unit_price?: number | null
          batch?: string | null
          expiry_date?: string | null
          notes?: string | null
          created_by: string
          created_at?: string | null
        }
        Update: {
          id?: string
          material_id?: string
          supplier_id?: string
          quantity?: number
          unit_price?: number | null
          batch?: string | null
          expiry_date?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string | null
        }
      }
      requests: {
        Row: {
          id: string
          requester_id: string
          status: 'pendente' | 'aprovado' | 'rejeitado' | 'despachado' | 'cancelado' | null
          priority: 'baixa' | 'media' | 'alta' | null
          notes: string | null
          approved_by: string | null
          approved_at: string | null
          dispatched_by: string | null
          dispatched_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          requester_id: string
          status?: 'pendente' | 'aprovado' | 'rejeitado' | 'despachado' | 'cancelado' | null
          priority?: 'baixa' | 'media' | 'alta' | null
          notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          dispatched_by?: string | null
          dispatched_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          requester_id?: string
          status?: 'pendente' | 'aprovado' | 'rejeitado' | 'despachado' | 'cancelado' | null
          priority?: 'baixa' | 'media' | 'alta' | null
          notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          dispatched_by?: string | null
          dispatched_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      request_items: {
        Row: {
          id: string
          request_id: string
          material_id: string
          requested_quantity: number
          approved_quantity: number | null
          dispatched_quantity: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          request_id: string
          material_id: string
          requested_quantity: number
          approved_quantity?: number | null
          dispatched_quantity?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          material_id?: string
          requested_quantity?: number
          approved_quantity?: number | null
          dispatched_quantity?: number | null
          notes?: string | null
        }
      }
      stock_movements: {
        Row: {
          id: string
          material_id: string
          type: 'entrada' | 'saida'
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: 'request' | 'entry' | 'adjustment' | null
          created_by: string
          created_at: string | null
        }
        Insert: {
          id?: string
          material_id: string
          type: 'entrada' | 'saida'
          quantity: number
          reason: string
          reference_id?: string | null
          reference_type?: 'request' | 'entry' | 'adjustment' | null
          created_by: string
          created_at?: string | null
        }
        Update: {
          id?: string
          material_id?: string
          type?: 'entrada' | 'saida'
          quantity?: number
          reason?: string
          reference_id?: string | null
          reference_type?: 'request' | 'entry' | 'adjustment' | null
          created_by?: string
          created_at?: string | null
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          expires_at: string
          created_at: string | null
          updated_at: string | null
          user_agent: string | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          expires_at: string
          created_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          expires_at?: string
          created_at?: string | null
          updated_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
        }
      }
    }
    Views: {
      stock_status: {
        Row: {
          id: string | null
          name: string | null
          category: string | null
          unit: string | null
          current_stock: number | null
          min_stock: number | null
          status: string | null
          updated_at: string | null
        }
      }
      request_summary: {
        Row: {
          id: string | null
          status: 'pendente' | 'aprovado' | 'rejeitado' | 'despachado' | 'cancelado' | null
          priority: 'baixa' | 'media' | 'alta' | null
          created_at: string | null
          requester_name: string | null
          school: string | null
          approver_name: string | null
          dispatcher_name: string | null
          items_count: number | null
          total_requested: number | null
          total_dispatched: number | null
        }
      }
    }
    Functions: {
      clean_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_session: {
        Args: {
          token: string
        }
        Returns: {
          user_id: string
          user_name: string
          user_email: string
          user_role: 'solicitante' | 'despachante' | 'administrador'
          user_school: string | null
        }[]
      }
      create_session: {
        Args: {
          p_user_id: string
          p_session_token: string
          p_expires_at: string
          p_user_agent?: string | null
          p_ip_address?: string | null
        }
        Returns: string
      }
      remove_session: {
        Args: {
          token: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'solicitante' | 'despachante' | 'administrador'
      request_status: 'pendente' | 'aprovado' | 'rejeitado' | 'despachado' | 'cancelado'
      request_priority: 'baixa' | 'media' | 'alta'
      movement_type: 'entrada' | 'saida'
      reference_type: 'request' | 'entry' | 'adjustment'
    }
  }
}