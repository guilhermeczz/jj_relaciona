import { Button } from '@/components/ui/button'

interface Props {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  itemLabel: string
}

export function ListPagination({ page, pageSize, total, onPageChange, itemLabel }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)

  return (
    <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>{start}–{end} de {total} {itemLabel} · ordem alfabética</p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={current === 1} onClick={() => onPageChange(current - 1)}>Anterior</Button>
          <span className="min-w-16 text-center">{current} de {pages}</span>
          <Button type="button" size="sm" variant="outline" disabled={current === pages} onClick={() => onPageChange(current + 1)}>Próxima</Button>
        </div>
      )}
    </div>
  )
}
