import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, max, onInput, onChange, ...props }, ref) => {
    function limitDateYear(input: HTMLInputElement) {
      if (type !== 'date' || !input.value) return
      const [year, month, day] = input.value.split('-')
      if (year.length > 4) input.value = [year.slice(0, 4), month, day].filter(Boolean).join('-')
    }

    return (
      <input
        type={type}
        max={type === 'date' ? max ?? '9999-12-31' : max}
        onInput={(event) => {
          limitDateYear(event.currentTarget)
          onInput?.(event)
        }}
        onChange={(event) => {
          limitDateYear(event.currentTarget)
          onChange?.(event)
        }}
        className={cn(
          'flex h-11 w-full items-center rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-none shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-10',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
