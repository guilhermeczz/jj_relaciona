export interface Aniversariante {
  tipo: 'loja' | 'contato'
  nome: string
  data: string
  mes: number
  dia: number
  lojaId?: string
  lojaNome?: string
  contatoId?: string
  telefone?: string | null
  email?: string | null
  vendedorNome?: string
  vendedorId?: string | null
}

function birthdayThisYear(mes: number, dia: number): Date {
  const now = new Date()
  return new Date(now.getFullYear(), mes - 1, dia, 12, 0, 0, 0)
}

export function isToday(a: Aniversariante, ref = new Date()): boolean {
  const d = birthdayThisYear(a.mes, a.dia)
  return d.getDate() === ref.getDate() && d.getMonth() === ref.getMonth()
}

export function isNextNDays(a: Aniversariante, ref = new Date(), days = 7): boolean {
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 12, 0, 0, 0)
  const target = birthdayThisYear(a.mes, a.dia)
  const diffDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= days
}

export function isNext30Days(a: Aniversariante, ref = new Date()): boolean {
  return isNextNDays(a, ref, 30)
}

export function isThisMonth(a: Aniversariante, ref = new Date()): boolean {
  return a.mes === ref.getMonth() + 1
}

export type AniversarioFiltro = 'hoje' | '7dias' | '30dias' | 'mes' | 'personalizado' | 'todos'

export function isBirthdayWithinRange(a: Aniversariante, inicio: string, fim: string): boolean {
  if (!inicio && !fim) return true
  const start = inicio ? new Date(`${inicio}T00:00:00`) : new Date(2000, 0, 1)
  const end = fim ? new Date(`${fim}T23:59:59`) : new Date(2100, 11, 31, 23, 59, 59)
  for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
    const occurrence = new Date(year, a.mes - 1, a.dia, 12)
    if (occurrence >= start && occurrence <= end) return true
  }
  return false
}

export function filterAniversariantes(
  lista: Aniversariante[],
  filtro: AniversarioFiltro,
  ref = new Date(),
): Aniversariante[] {
  switch (filtro) {
    case 'hoje':
      return lista.filter((a) => isToday(a, ref))
    case '7dias':
      return lista.filter((a) => isNextNDays(a, ref, 7))
    case '30dias':
      return lista.filter((a) => isNext30Days(a, ref))
    case 'mes':
      return lista.filter((a) => isThisMonth(a, ref))
    default:
      return [...lista]
  }
}

export function formatDataBR(data?: string | null): string {
  if (!data) return '-'
  const d = new Date(data)
  return d.toLocaleDateString('pt-BR')
}
