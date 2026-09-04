import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  children: ReactNode
  className?: string
}

export function FilterField({ label, children, className }: Props) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <span className="block h-4 text-[11px] font-medium leading-4 text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
