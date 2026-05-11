import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border bg-secondary/20 px-3 py-2 text-sm transition-all duration-200',
          'border-primary/30 text-foreground placeholder:text-muted-foreground/60',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'hover:border-primary/50 hover:bg-secondary/25',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/60',
          'disabled:cursor-not-allowed disabled:bg-secondary/10 disabled:text-muted-foreground disabled:opacity-70 disabled:border-primary/15',
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
