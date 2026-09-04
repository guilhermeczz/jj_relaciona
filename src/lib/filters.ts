export function isWithinDateRange(value: string | null | undefined, inicio: string, fim: string): boolean {
  if (!inicio && !fim) return true
  if (!value) return false
  const date = value.slice(0, 10)
  return (!inicio || date >= inicio) && (!fim || date <= fim)
}

export function comparePtBr(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
}
