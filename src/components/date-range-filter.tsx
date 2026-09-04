import { Input } from '@/components/ui/input'

interface Props {
  inicio: string
  fim: string
  onInicioChange: (value: string) => void
  onFimChange: (value: string) => void
  label?: string
}

export function DateRangeFilter({ inicio, fim, onInicioChange, onFimChange, label = 'Período' }: Props) {
  return (
    <div className="grid min-w-0 grid-cols-2 items-end gap-2 sm:flex-none">
      <label className="min-w-0 text-[11px] font-medium text-muted-foreground">
        <span className="mb-1 block h-4 leading-4">{label} — de</span>
        <Input type="date" value={inicio} onChange={(event) => onInicioChange(event.target.value)} className="sm:w-[150px]" />
      </label>
      <label className="min-w-0 text-[11px] font-medium text-muted-foreground">
        <span className="mb-1 block h-4 leading-4">Até</span>
        <Input type="date" value={fim} min={inicio || undefined} onChange={(event) => onFimChange(event.target.value)} className="sm:w-[150px]" />
      </label>
    </div>
  )
}
