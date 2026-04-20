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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      assinaturas_prestador: {
        Row: {
          condominio_id: string
          created_at: string
          id: string
          kiwify_customer_id: string | null
          kiwify_subscription_id: string | null
          prestador_id: string
          status: string
          trial_fim: string | null
          trial_inicio: string | null
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          condominio_id: string
          created_at?: string
          id?: string
          kiwify_customer_id?: string | null
          kiwify_subscription_id?: string | null
          prestador_id: string
          status?: string
          trial_fim?: string | null
          trial_inicio?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          condominio_id?: string
          created_at?: string
          id?: string
          kiwify_customer_id?: string | null
          kiwify_subscription_id?: string | null
          prestador_id?: string
          status?: string
          trial_fim?: string | null
          trial_inicio?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_prestador_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_prestador_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_logs: {
        Row: {
          created_at: string
          detalhes: string | null
          email: string | null
          erro: string | null
          evento: string
          id: string
          ip: string | null
          nome: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detalhes?: string | null
          email?: string | null
          erro?: string | null
          evento?: string
          id?: string
          ip?: string | null
          nome?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detalhes?: string | null
          email?: string | null
          erro?: string | null
          evento?: string
          id?: string
          ip?: string | null
          nome?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      avisos: {
        Row: {
          ativo: boolean
          condominio_id: string
          created_at: string
          id: string
          ordem: number
          texto: string
        }
        Insert: {
          ativo?: boolean
          condominio_id: string
          created_at?: string
          id?: string
          ordem?: number
          texto: string
        }
        Update: {
          ativo?: boolean
          condominio_id?: string
          created_at?: string
          id?: string
          ordem?: number
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_audit_log: {
        Row: {
          acao: string
          ator_nome: string | null
          ator_user_id: string | null
          banner_id: string
          banner_tipo: string
          condominio_id: string | null
          created_at: string
          detalhes: Json | null
          id: string
          status_anterior: string | null
          status_novo: string | null
        }
        Insert: {
          acao: string
          ator_nome?: string | null
          ator_user_id?: string | null
          banner_id: string
          banner_tipo: string
          condominio_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          status_anterior?: string | null
          status_novo?: string | null
        }
        Update: {
          acao?: string
          ator_nome?: string | null
          ator_user_id?: string | null
          banner_id?: string
          banner_tipo?: string
          condominio_id?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          status_anterior?: string | null
          status_novo?: string | null
        }
        Relationships: []
      }
      banner_precos: {
        Row: {
          chave_pix: string | null
          id: string
          limite_por_condominio: number
          tipo_chave_pix: string | null
          updated_at: string
          valor_criacao_arte: number
          valor_quinzena: number
        }
        Insert: {
          chave_pix?: string | null
          id?: string
          limite_por_condominio?: number
          tipo_chave_pix?: string | null
          updated_at?: string
          valor_criacao_arte?: number
          valor_quinzena?: number
        }
        Update: {
          chave_pix?: string | null
          id?: string
          limite_por_condominio?: number
          tipo_chave_pix?: string | null
          updated_at?: string
          valor_criacao_arte?: number
          valor_quinzena?: number
        }
        Relationships: []
      }
      banner_solicitacoes: {
        Row: {
          condominio_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          imagem_url: string | null
          prestador_id: string
          status: string
          tipo_arte: string
          valor_total: number
        }
        Insert: {
          condominio_id: string
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          imagem_url?: string | null
          prestador_id: string
          status?: string
          tipo_arte?: string
          valor_total?: number
        }
        Update: {
          condominio_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          imagem_url?: string | null
          prestador_id?: string
          status?: string
          tipo_arte?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "banner_solicitacoes_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "banner_solicitacoes_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          ativo: boolean
          condominio_id: string
          created_at: string
          id: string
          imagem_url: string | null
          link: string | null
          ordem: number
          publico: string
          solicitacao_id: string | null
          subtitulo: string | null
          titulo: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          condominio_id: string
          created_at?: string
          id?: string
          imagem_url?: string | null
          link?: string | null
          ordem?: number
          publico?: string
          solicitacao_id?: string | null
          subtitulo?: string | null
          titulo: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          condominio_id?: string
          created_at?: string
          id?: string
          imagem_url?: string | null
          link?: string | null
          ordem?: number
          publico?: string
          solicitacao_id?: string | null
          subtitulo?: string | null
          titulo?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      cardapio_categorias: {
        Row: {
          created_at: string
          id: string
          loja_id: string
          nome: string
          ordem: number
        }
        Insert: {
          created_at?: string
          id?: string
          loja_id: string
          nome: string
          ordem?: number
        }
        Update: {
          created_at?: string
          id?: string
          loja_id?: string
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "cardapio_categorias_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      cardapio_horarios: {
        Row: {
          ativo: boolean
          created_at: string
          dia_semana: number
          horario_fim: string
          horario_inicio: string
          id: string
          loja_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dia_semana: number
          horario_fim: string
          horario_inicio: string
          id?: string
          loja_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dia_semana?: number
          horario_fim?: string
          horario_inicio?: string
          id?: string
          loja_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cardapio_horarios_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      cardapio_itens: {
        Row: {
          categoria_id: string | null
          created_at: string
          descricao: string | null
          disponivel: boolean
          id: string
          imagem_url: string | null
          loja_id: string
          nome: string
          ordem: number
          preco: number | null
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          disponivel?: boolean
          id?: string
          imagem_url?: string | null
          loja_id: string
          nome: string
          ordem?: number
          preco?: number | null
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          disponivel?: boolean
          id?: string
          imagem_url?: string | null
          loja_id?: string
          nome?: string
          ordem?: number
          preco?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cardapio_itens_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "cardapio_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cardapio_itens_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_servico: {
        Row: {
          ativo: boolean
          created_at: string
          grupo: string
          icone: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          grupo?: string
          icone?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          grupo?: string
          icone?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      condominios: {
        Row: {
          created_at: string
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          responsavel: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          responsavel?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          responsavel?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      contato_mensagens: {
        Row: {
          created_at: string
          email: string
          id: string
          mensagem: string
          nome: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          mensagem: string
          nome: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          mensagem?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      convites_visitante: {
        Row: {
          condominio_id: string
          created_at: string
          data_visita: string
          foto_url: string | null
          horario_fim: string
          horario_inicio: string
          id: string
          morador_id: string
          nome_registrado: string | null
          nome_visitante: string
          qr_code: string | null
          status: string
          token: string
          usado_em: string | null
        }
        Insert: {
          condominio_id: string
          created_at?: string
          data_visita: string
          foto_url?: string | null
          horario_fim: string
          horario_inicio: string
          id?: string
          morador_id: string
          nome_registrado?: string | null
          nome_visitante: string
          qr_code?: string | null
          status?: string
          token?: string
          usado_em?: string | null
        }
        Update: {
          condominio_id?: string
          created_at?: string
          data_visita?: string
          foto_url?: string | null
          horario_fim?: string
          horario_inicio?: string
          id?: string
          morador_id?: string
          nome_registrado?: string | null
          nome_visitante?: string
          qr_code?: string | null
          status?: string
          token?: string
          usado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_visitante_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      cupons_prestador: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          desconto_percent: number
          id: string
          prestador_id: string
          validade: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          desconto_percent?: number
          id?: string
          prestador_id: string
          validade?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          desconto_percent?: number
          id?: string
          prestador_id?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cupons_prestador_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      desapegos: {
        Row: {
          condominio_id: string
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
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
          imagem_url?: string | null
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
          imagem_url?: string | null
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
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          message: string
          stack: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          message: string
          stack?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
          stack?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      espacos: {
        Row: {
          capacidade: number | null
          condominio_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          capacidade?: number | null
          condominio_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          capacidade?: number | null
          condominio_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "espacos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_cotacao_respostas: {
        Row: {
          cotacao_id: string
          created_at: string
          disponivel: boolean
          id: string
          mensagem: string | null
          prestador_id: string
          status: string
          valor: number
        }
        Insert: {
          cotacao_id: string
          created_at?: string
          disponivel?: boolean
          id?: string
          mensagem?: string | null
          prestador_id: string
          status?: string
          valor: number
        }
        Update: {
          cotacao_id?: string
          created_at?: string
          disponivel?: boolean
          id?: string
          mensagem?: string | null
          prestador_id?: string
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_cotacao_respostas_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "evento_cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cotacao_respostas_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_cotacoes: {
        Row: {
          categoria: string
          condominio_id: string
          created_at: string
          criador_id: string
          data_evento: string
          evento_id: string
          horario_fim: string
          horario_inicio: string
          id: string
          observacoes: string | null
          qtd_pessoas: number
          status: string
          tipo_servico: string
        }
        Insert: {
          categoria: string
          condominio_id: string
          created_at?: string
          criador_id: string
          data_evento: string
          evento_id: string
          horario_fim: string
          horario_inicio: string
          id?: string
          observacoes?: string | null
          qtd_pessoas?: number
          status?: string
          tipo_servico?: string
        }
        Update: {
          categoria?: string
          condominio_id?: string
          created_at?: string
          criador_id?: string
          data_evento?: string
          evento_id?: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          observacoes?: string | null
          qtd_pessoas?: number
          status?: string
          tipo_servico?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_cotacoes_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cotacoes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_amigos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_despesas: {
        Row: {
          created_at: string
          descricao: string | null
          evento_id: string
          id: string
          pagador_id: string
          pago: boolean
          recibo_url: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          evento_id: string
          id?: string
          pagador_id: string
          pago?: boolean
          recibo_url?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          evento_id?: string
          id?: string
          pagador_id?: string
          pago?: boolean
          recibo_url?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_despesas_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_amigos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_itens: {
        Row: {
          created_at: string
          evento_id: string
          id: string
          nome: string
          responsavel_id: string | null
          valor_estimado: number
        }
        Insert: {
          created_at?: string
          evento_id: string
          id?: string
          nome: string
          responsavel_id?: string | null
          valor_estimado?: number
        }
        Update: {
          created_at?: string
          evento_id?: string
          id?: string
          nome?: string
          responsavel_id?: string | null
          valor_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_itens_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_amigos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_pagamentos: {
        Row: {
          comprovante_url: string | null
          created_at: string
          evento_id: string
          id: string
          pagador_id: string
          recebedor_id: string
          status: string
          valor: number
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          evento_id: string
          id?: string
          pagador_id: string
          recebedor_id: string
          status?: string
          valor: number
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          evento_id?: string
          id?: string
          pagador_id?: string
          recebedor_id?: string
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_pagamentos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_amigos"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_participantes: {
        Row: {
          created_at: string
          evento_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evento_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evento_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_participantes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_amigos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_amigos: {
        Row: {
          condominio_id: string
          created_at: string
          criador_id: string
          descricao: string | null
          id: string
          imagem_url: string | null
          pix_chave: string | null
          pix_tipo: string | null
          prestador_id: string | null
          status: string
          titulo: string
        }
        Insert: {
          condominio_id: string
          created_at?: string
          criador_id: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          pix_chave?: string | null
          pix_tipo?: string | null
          prestador_id?: string | null
          status?: string
          titulo: string
        }
        Update: {
          condominio_id?: string
          created_at?: string
          criador_id?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          pix_chave?: string | null
          pix_tipo?: string | null
          prestador_id?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_amigos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_amigos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
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
      function_logs: {
        Row: {
          created_at: string
          details: Json | null
          duration_ms: number | null
          error: string | null
          function_name: string
          id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          duration_ms?: number | null
          error?: string | null
          function_name: string
          id?: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          duration_ms?: number | null
          error?: string | null
          function_name?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      indicacoes: {
        Row: {
          created_at: string
          id: string
          indicado_id: string
          indicador_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          indicado_id: string
          indicador_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          indicado_id?: string
          indicador_id?: string
          status?: string
        }
        Relationships: []
      }
      lojas: {
        Row: {
          ativa: boolean
          banner_url: string | null
          cardapio_ativo: boolean
          condominio_id: string
          created_at: string
          descricao: string | null
          horario_funcionamento: string | null
          id: string
          nome: string
          prestador_id: string
          slug: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativa?: boolean
          banner_url?: string | null
          cardapio_ativo?: boolean
          condominio_id: string
          created_at?: string
          descricao?: string | null
          horario_funcionamento?: string | null
          id?: string
          nome: string
          prestador_id: string
          slug?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativa?: boolean
          banner_url?: string | null
          cardapio_ativo?: boolean
          condominio_id?: string
          created_at?: string
          descricao?: string | null
          horario_funcionamento?: string | null
          id?: string
          nome?: string
          prestador_id?: string
          slug?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lojas_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lojas_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: true
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
      lp_content: {
        Row: {
          chave: string
          created_at: string
          id: string
          imagem_url: string | null
          ordem: number
          secao: string
          updated_at: string
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          imagem_url?: string | null
          ordem?: number
          secao: string
          updated_at?: string
          valor?: string
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          imagem_url?: string | null
          ordem?: number
          secao?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      morador_interesses: {
        Row: {
          categoria: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      noticias: {
        Row: {
          categoria: string
          conteudo: string
          created_at: string
          id: string
          imagem_emoji: string
          resumo: string
          titulo: string
        }
        Insert: {
          categoria: string
          conteudo: string
          created_at?: string
          id?: string
          imagem_emoji?: string
          resumo: string
          titulo: string
        }
        Update: {
          categoria?: string
          conteudo?: string
          created_at?: string
          id?: string
          imagem_emoji?: string
          resumo?: string
          titulo?: string
        }
        Relationships: []
      }
      noticias_categorias: {
        Row: {
          ativo: boolean
          created_at: string
          emoji: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          emoji?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          emoji?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
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
      page_views: {
        Row: {
          created_at: string
          id: string
          module: string | null
          page: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          module?: string | null
          page: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          module?: string | null
          page?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pedido_itens: {
        Row: {
          created_at: string
          id: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
        }
        Insert: {
          created_at?: string
          id?: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade?: number
        }
        Update: {
          created_at?: string
          id?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          condominio_id: string
          created_at: string
          id: string
          loja_id: string
          morador_id: string
          observacoes: string | null
          status: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          condominio_id: string
          created_at?: string
          id?: string
          loja_id: string
          morador_id: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Update: {
          condominio_id?: string
          created_at?: string
          id?: string
          loja_id?: string
          morador_id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      prestador_condominios: {
        Row: {
          condominio_id: string
          created_at: string
          id: string
          is_primeiro: boolean
          pagamento_aprovado_em: string | null
          pagamento_aprovado_por: string | null
          pagamento_comprovante_url: string | null
          pagamento_status: string | null
          prestador_user_id: string
          status: string
          trial_fim: string | null
          trial_inicio: string | null
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          condominio_id: string
          created_at?: string
          id?: string
          is_primeiro?: boolean
          pagamento_aprovado_em?: string | null
          pagamento_aprovado_por?: string | null
          pagamento_comprovante_url?: string | null
          pagamento_status?: string | null
          prestador_user_id: string
          status?: string
          trial_fim?: string | null
          trial_inicio?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          condominio_id?: string
          created_at?: string
          id?: string
          is_primeiro?: boolean
          pagamento_aprovado_em?: string | null
          pagamento_aprovado_por?: string | null
          pagamento_comprovante_url?: string | null
          pagamento_status?: string | null
          prestador_user_id?: string
          status?: string
          trial_fim?: string | null
          trial_inicio?: string | null
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "prestador_condominios_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      prestador_precos: {
        Row: {
          chave_pix: string | null
          id: string
          link_pagamento_automatico: string | null
          tipo_chave_pix: string | null
          trial_dias: number
          updated_at: string
          valor_mensal_condominio_extra: number
        }
        Insert: {
          chave_pix?: string | null
          id?: string
          link_pagamento_automatico?: string | null
          tipo_chave_pix?: string | null
          trial_dias?: number
          updated_at?: string
          valor_mensal_condominio_extra?: number
        }
        Update: {
          chave_pix?: string | null
          id?: string
          link_pagamento_automatico?: string | null
          tipo_chave_pix?: string | null
          trial_dias?: number
          updated_at?: string
          valor_mensal_condominio_extra?: number
        }
        Relationships: []
      }
      prestadores: {
        Row: {
          codigo_indicacao: string | null
          condominio_id: string
          created_at: string
          descricao: string | null
          especialidade: string
          id: string
          sub_especialidade: string | null
          user_id: string
          visivel: boolean
          visivel_ate: string | null
        }
        Insert: {
          codigo_indicacao?: string | null
          condominio_id: string
          created_at?: string
          descricao?: string | null
          especialidade: string
          id?: string
          sub_especialidade?: string | null
          user_id: string
          visivel?: boolean
          visivel_ate?: string | null
        }
        Update: {
          codigo_indicacao?: string | null
          condominio_id?: string
          created_at?: string
          descricao?: string | null
          especialidade?: string
          id?: string
          sub_especialidade?: string | null
          user_id?: string
          visivel?: boolean
          visivel_ate?: string | null
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
          imagem_url: string | null
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
          imagem_url?: string | null
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
          imagem_url?: string | null
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
          app_version: string | null
          avatar_url: string | null
          condicoes_aceitas_em: string | null
          created_at: string
          device_platform: string | null
          device_updated_at: string | null
          id: string
          nome: string
          numero_casa: string | null
          rua: string | null
          telefone: string | null
          termos_aceitos_em: string | null
          user_id: string
        }
        Insert: {
          app_version?: string | null
          avatar_url?: string | null
          condicoes_aceitas_em?: string | null
          created_at?: string
          device_platform?: string | null
          device_updated_at?: string | null
          id?: string
          nome?: string
          numero_casa?: string | null
          rua?: string | null
          telefone?: string | null
          termos_aceitos_em?: string | null
          user_id: string
        }
        Update: {
          app_version?: string | null
          avatar_url?: string | null
          condicoes_aceitas_em?: string | null
          created_at?: string
          device_platform?: string | null
          device_updated_at?: string | null
          id?: string
          nome?: string
          numero_casa?: string | null
          rua?: string | null
          telefone?: string | null
          termos_aceitos_em?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reservas: {
        Row: {
          condominio_id: string
          created_at: string
          data: string
          espaco_id: string
          horario_fim: string
          horario_inicio: string
          id: string
          morador_id: string
          status: string
        }
        Insert: {
          condominio_id: string
          created_at?: string
          data: string
          espaco_id: string
          horario_fim: string
          horario_inicio: string
          id?: string
          morador_id: string
          status?: string
        }
        Update: {
          condominio_id?: string
          created_at?: string
          data?: string
          espaco_id?: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          morador_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
        ]
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
      sub_especialidades: {
        Row: {
          categoria_nome: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          categoria_nome: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          categoria_nome?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
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
          aprovado: boolean
          condominio_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          aprovado?: boolean
          condominio_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          aprovado?: boolean
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
      _get_ator_nome: { Args: { _user_id: string }; Returns: string }
      belongs_to_condominio: {
        Args: { _condominio_id: string; _user_id: string }
        Returns: boolean
      }
      check_email_exists: { Args: { _email: string }; Returns: boolean }
      find_similar_emails: {
        Args: { _target_email: string }
        Returns: {
          email: string
          nome: string
        }[]
      }
      get_banner_last_actions: {
        Args: { _banner_ids: string[]; _banner_tipo: string }
        Returns: {
          acao: string
          ator_nome: string
          banner_id: string
          created_at: string
        }[]
      }
      get_condominio_morador_counts: {
        Args: never
        Returns: {
          condominio_id: string
          total: number
        }[]
      }
      get_condominio_moradores: {
        Args: { _condominio_id: string }
        Returns: {
          avatar_url: string
          nome: string
          user_id: string
        }[]
      }
      get_desapego_owner_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          nome: string
          telefone: string
          user_id: string
        }[]
      }
      get_evento_participant_profiles: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          nome: string
          telefone: string
          user_id: string
        }[]
      }
      get_phones_by_emails: {
        Args: { _emails: string[] }
        Returns: {
          email: string
          telefone: string
        }[]
      }
      get_prestador_codigo: { Args: { p_user_id: string }; Returns: string }
      get_prestador_profiles: {
        Args: { _user_ids: string[] }
        Returns: {
          avatar_url: string
          nome: string
          telefone: string
          user_id: string
        }[]
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
      is_approved: {
        Args: { _condominio_id: string; _user_id: string }
        Returns: boolean
      }
      is_evento_member: {
        Args: { _evento_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_trial_eligible: { Args: { _user_id: string }; Returns: boolean }
      search_prestadores_by_especialidade: {
        Args: { _condominio_id: string; _term: string }
        Returns: {
          especialidade: string
          id: string
          user_id: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role:
        | "morador"
        | "prestador"
        | "admin"
        | "platform_admin"
        | "porteiro"
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
      app_role: ["morador", "prestador", "admin", "platform_admin", "porteiro"],
    },
  },
} as const
