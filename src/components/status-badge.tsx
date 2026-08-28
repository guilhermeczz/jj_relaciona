import { Badge } from '@/components/ui/badge'

export function statusVariant(value: string): {
  variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'accent' | 'neutral'
  label: string
} {
  const lower = value.toLowerCase()
  if (['ativo', 'enviado', 'realizado', 'concluido', 'ativa', 'sim', 'confirmado'].includes(lower)) {
    return { variant: 'success', label: value }
  }
  if (['pendente', 'separado', 'rascunho', 'participando', 'programado'].includes(lower)) {
    return { variant: 'warning', label: value }
  }
  if (['inativo', 'cancelado', 'cancelada', 'encerrada', 'convidado'].includes(lower)) {
    return { variant: 'secondary', label: value }
  }
  return { variant: 'neutral', label: value }
}

export function StatusBadge({ value, className }: { value?: string | null; className?: string }) {
  if (!value) return null
  const { variant, label } = statusVariant(value)
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1)
  return (
    <Badge variant={variant} className={className}>
      {capitalized}
    </Badge>
  )
}

export function CargoTraducao(cargo?: string | null): string {
  if (!cargo) return '-'
  const map: Record<string, string> = {
    proprietario: 'Proprietário',
    gerente: 'Gerente',
    comprador: 'Comprador',
    vendedor: 'Vendedor',
    balconista: 'Balconista',
    financeiro: 'Financeiro',
    outro: 'Outro',
  }
  return map[cargo] ?? cargo
}
