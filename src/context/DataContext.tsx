import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type {
  Profile,
  Loja,
  Contato,
  Interacao,
  Brinde,
  Campanha,
  CampanhaParticipante,
  Treinamento,
  TreinamentoParticipante,
} from '@/types'

interface DataContextValue {
  profiles: Profile[]
  lojas: Loja[]
  contatos: Contato[]
  interacoes: Interacao[]
  brindes: Brinde[]
  campanhas: Campanha[]
  campanhaParticipantes: CampanhaParticipante[]
  treinamentos: Treinamento[]
  treinamentoParticipantes: TreinamentoParticipante[]
  loading: boolean
  loadAll: () => Promise<void>
  getLoja: (id: string) => Loja | undefined
  getContatosDaLoja: (lojaId: string) => Contato[]
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [interacoes, setInteracoes] = useState<Interacao[]>([])
  const [brindes, setBrindes] = useState<Brinde[]>([])
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [campanhaParticipantes, setCampanhaParticipantes] = useState<CampanhaParticipante[]>([])
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([])
  const [treinamentoParticipantes, setTreinamentoParticipantes] = useState<TreinamentoParticipante[]>([])
  const [loading, setLoading] = useState(false)

  const loadLojas = useCallback(async () => {
    const { data } = await supabase
      .from('lojas')
      .select('*, vendedor:profiles!lojas_vendedor_responsavel_id_fkey(*)')
      .order('nome_fantasia')
    setLojas((data as Loja[]) ?? [])
  }, [])

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    await Promise.all([
      loadLojas(),
      supabase.from('contatos_loja').select('*, loja:lojas(*)').then(({ data }) =>
        setContatos((data as Contato[]) ?? []),
      ),
      supabase
        .from('interacoes')
        .select('*, loja:lojas(*), contato:contatos_loja(*), usuario:profiles!interacoes_usuario_id_fkey(*)')
        .order('data_interacao', { ascending: false })
        .limit(300)
        .then(({ data }) => setInteracoes((data as Interacao[]) ?? [])),
      supabase
        .from('brindes')
        .select('*, loja:lojas(*), contato:contatos_loja(*), vendedor:profiles!brindes_vendedor_responsavel_id_fkey(*)')
        .order('created_at', { ascending: false })
        .then(({ data }) => setBrindes((data as Brinde[]) ?? [])),
      supabase
        .from('campanhas')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => setCampanhas((data as Campanha[]) ?? [])),
      supabase
        .from('campanha_participantes')
        .select('*, loja:lojas(*), contato:contatos_loja(*)')
        .then(({ data }) => setCampanhaParticipantes((data as CampanhaParticipante[]) ?? [])),
      supabase
        .from('treinamentos')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => setTreinamentos((data as Treinamento[]) ?? [])),
      supabase
        .from('treinamento_participantes')
        .select('*, loja:lojas(*), contato:contatos_loja(*)')
        .then(({ data }) => setTreinamentoParticipantes((data as TreinamentoParticipante[]) ?? [])),
      supabase
        .from('profiles')
        .select('*')
        .order('nome')
        .then(({ data }) => setProfiles((data as Profile[]) ?? [])),
    ])
    setLoading(false)
  }, [user, loadLojas])

  useEffect(() => {
    if (user) loadAll()
  }, [user, loadAll])

  const getLoja = useCallback(
    (id: string) => lojas.find((l) => l.id === id),
    [lojas],
  )

  const getContatosDaLoja = useCallback(
    (lojaId: string) => contatos.filter((c) => c.loja_id === lojaId && c.ativo),
    [contatos],
  )

  return (
    <DataContext.Provider
      value={{
        profiles,
        lojas,
        contatos,
        interacoes,
        brindes,
        campanhas,
        campanhaParticipantes,
        treinamentos,
        treinamentoParticipantes,
        loading,
        loadAll,
        getLoja,
        getContatosDaLoja,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData deve ser usado dentro de DataProvider')
  return ctx
}
