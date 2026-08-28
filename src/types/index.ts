export interface Profile {
  id: string
  nome: string
  email: string
  perfil: 'admin' | 'vendedor'
  telefone?: string | null
  ativo: boolean
  created_at: string
  updated_at?: string
}

export interface Loja {
  id: string
  razao_social?: string | null
  nome_fantasia: string
  cnpj?: string | null
  data_fundacao?: string | null
  whatsapp?: string | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
  numero?: string | null
  bairro?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  segmento?: string | null
  vendedor_responsavel_id?: string | null
  status: 'ativo' | 'inativo'
  observacoes?: string | null
  created_at: string
  updated_at?: string
  vendedor?: Profile | null
  contatos_count?: number
  ultima_interacao?: string | null
}

export interface Contato {
  id: string
  loja_id: string
  nome: string
  cargo?: string | null
  whatsapp?: string | null
  telefone?: string | null
  email?: string | null
  data_nascimento?: string | null
  recebe_mensagens: boolean
  recebe_campanhas: boolean
  recebe_treinamentos: boolean
  observacoes?: string | null
  ativo: boolean
  created_at: string
  updated_at?: string
  loja?: Loja | null
}

export interface Interacao {
  id: string
  loja_id: string
  contato_id?: string | null
  usuario_id: string
  tipo: string
  descricao: string
  data_interacao: string
  created_at?: string
  loja?: Loja | null
  contato?: Contato | null
  usuario?: Profile | null
}

export interface Brinde {
  id: string
  loja_id: string
  contato_id?: string | null
  motivo?: string | null
  descricao: string
  status: 'pendente' | 'separado' | 'enviado' | 'cancelado'
  data_prevista?: string | null
  data_envio?: string | null
  vendedor_responsavel_id?: string | null
  observacoes?: string | null
  created_at: string
  updated_at?: string
  loja?: Loja | null
  contato?: Contato | null
  vendedor?: Profile | null
}

export interface Campanha {
  id: string
  nome: string
  descricao?: string | null
  produto_marca?: string | null
  regra?: string | null
  premio?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  status: 'rascunho' | 'ativa' | 'encerrada' | 'cancelada'
  observacoes?: string | null
  created_at: string
  updated_at?: string
}

export interface CampanhaParticipante {
  id: string
  campanha_id: string
  loja_id: string
  contato_id?: string | null
  status: 'convidado' | 'participando' | 'concluido' | 'cancelado'
  observacoes?: string | null
  created_at: string
  updated_at?: string
  loja?: Loja | null
  contato?: Contato | null
}

export interface Treinamento {
  id: string
  nome: string
  tema?: string | null
  parceiro?: string | null
  data?: string | null
  horario?: string | null
  local?: string | null
  vagas?: number | null
  descricao?: string | null
  status: 'programado' | 'realizado' | 'cancelado'
  created_at: string
  updated_at?: string
}

export interface TreinamentoParticipante {
  id: string
  treinamento_id: string
  loja_id: string
  contato_id?: string | null
  confirmado: boolean
  compareceu: boolean
  observacoes?: string | null
  created_at: string
  updated_at?: string
  loja?: Loja | null
  contato?: Contato | null
}

export type Perfil = 'admin' | 'vendedor'
