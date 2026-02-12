export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      avaliacoes: {
        Row: {
          avaliado_id: string
          avaliador_id: string
          comentario: string | null
          condominio_id: string
          created_at: string
          id: string
          nota: number
        }
        Insert: {
          avaliado_id: string
          avaliador_id: string
          comentario?: string | null
          condominio_id: string
          created_at?: string
          id?: string
          nota: number
        }
        Update: {
          avaliado_id?: string
          avaliador_id?: string
          comentario?: string | null
          condominio_id?: string
          created_at?: string
          id?: string
          nota?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      condominios: {
        Row: {
          created_at: string
          endereco: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      desapegos: {
        Row: {
          condominio_id: string
          created_at: string
          descricao: string | null
          id: string
          morador_id: string
          preco: number | null
          status: string
          titulo: string
        }
        Insert: {
          condominio_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          morador_id: string
          preco?: number | null
          status?: string
          titulo: string
        }
        Update: {
          condominio_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          morador_id?: string
          preco?: number | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "desapegos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro_lancamentos: {
        Row: {
          condominio_id: string
          created_at: string
          descricao: string | null
          id: string
          prestador_id: string | null
          status: string
          tipo: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          condominio_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          prestador_id?: string | null
          status?: string
          tipo: string
          valor: number
          vencimento?: string | null
        }
        Update: {
          condominio_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          prestador_id?: string | null
          status?: string
          tipo?: string
          valor?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_lancamentos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_lancamentos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      lotes: {
        Row: {
          condominio_id: string
          created_at: string
          data_recebimento: string
          descricao: string | null
          id: string
          quantidade_itens: number
          status: string
        }
        Insert: {
          condominio_id: string
          created_at?: string
          data_recebimento?: string
          descricao?: string | null
          id?: string
          quantidade_itens?: number
          status?: string
        }
        Update: {
          condominio_id?: string
          created_at?: string
          data_recebimento?: string
          descricao?: string | null
          id?: string
          quantidade_itens?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotes_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      pacotes: {
        Row: {
          condominio_id: string
          created_at: string
          descricao: string | null
          id: string
          lote_id: string | null
          morador_id: string | null
          qr_code: string | null
          recebido_em: string | null
          retirado_em: string | null
          status: string
          unidade_id: string
        }
        Insert: {
          condominio_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          lote_id?: string | null
          morador_id?: string | null
          qr_code?: string | null
          recebido_em?: string | null
          retirado_em?: string | null
          status?: string
          unidade_id: string
        }
        Update: {
          condominio_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          lote_id?: string | null
          morador_id?: string | null
          qr_code?: string | null
          recebido_em?: string | null
          retirado_em?: string | null
          status?: string
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacotes_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacotes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      prestadores: {
        Row: {
          condominio_id: string
          created_at: string
          descricao: string | null
          especialidade: string
          id: string
          user_id: string
        }
        Insert: {
          condominio_id: string
          created_at?: string
          descricao?: string | null
          especialidade: string
          id?: string
          user_id: string
        }
        Update: {
          condominio_id?: string
          created_at?: string
          descricao?: string | null
          especialidade?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestadores_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          condominio_id: string
          created_at: string
          descricao: string | null
          id: string
          preco: number | null
          prestador_id: string
          status: string
          titulo: string
        }
        Insert: {
          condominio_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          preco?: number | null
          prestador_id: string
          status?: string
          titulo: string
        }
        Update: {
          condominio_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          preco?: number | null
          prestador_id?: string
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nome: string
          telefone: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          condominio_id: string
          created_at: string
          descricao: string | null
          id: string
          preco: number | null
          prestador_id: string
          status: string
          titulo: string
        }
        Insert: {
          condominio_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          preco?: number | null
          prestador_id: string
          status?: string
          titulo: string
        }
        Update: {
          condominio_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          preco?: number | null
          prestador_id?: string
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          bloco: string | null
          condominio_id: string
          created_at: string
          id: string
          morador_id: string | null
          numero: string
        }
        Insert: {
          bloco?: string | null
          condominio_id: string
          created_at?: string
          id?: string
          morador_id?: string | null
          numero: string
        }
        Update: {
          bloco?: string | null
          condominio_id?: string
          created_at?: string
          id?: string
          morador_id?: string | null
          numero?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          condominio_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          condominio_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          condominio_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      belongs_to_condominio: {
        Args: { _condominio_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_condominio_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _condominio_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "morador" | "prestador" | "admin" | "platform_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["morador", "prestador", "admin", "platform_admin"],
    },
  },
} as const
