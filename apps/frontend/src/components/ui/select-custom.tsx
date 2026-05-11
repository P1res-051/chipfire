import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectCustomProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export const SelectCustom = React.forwardRef<HTMLSelectElement, SelectCustomProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full appearance-none rounded-lg border bg-secondary/20 px-3 py-2 text-sm transition-all duration-200 pr-10',
            'border-primary/30 text-foreground placeholder:text-muted-foreground/60',
            'hover:border-primary/50 hover:bg-secondary/25',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:bg-secondary/10 disabled:text-muted-foreground disabled:opacity-70 disabled:border-primary/15',
            '[color-scheme:dark]',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-60 transition-opacity duration-200" />
      </div>
    )
  },
)

SelectCustom.displayName = 'SelectCustom'
