import * as React from 'react'

import { cn } from '@/lib/utils'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-lg border bg-secondary/20 px-3 py-2 text-sm transition-all duration-200',
          'border-primary/30 text-foreground',
          'hover:border-primary/50 hover:bg-secondary/25',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/60',
          'disabled:cursor-not-allowed disabled:bg-secondary/10 disabled:text-muted-foreground disabled:opacity-70 disabled:border-primary/15',
          '[color-scheme:dark]',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)

Select.displayName = 'Select'
