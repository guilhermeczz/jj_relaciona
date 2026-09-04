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
    <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2 sm:flex-none">
      <label className="min-w-[138px] flex-1 space-y-1 text-[11px] font-medium text-muted-foreground sm:flex-none">
        {label} — de
        <Input type="date" value={inicio} onChange={(event) => onInicioChange(event.target.value)} className="mt-1 sm:w-[150px]" />
      </label>
      <label className="min-w-[138px] flex-1 space-y-1 text-[11px] font-medium text-muted-foreground sm:flex-none">
        até
        <Input type="date" value={fim} min={inicio || undefined} onChange={(event) => onFimChange(event.target.value)} className="mt-1 sm:w-[150px]" />
      </label>
    </div>
  )
}
