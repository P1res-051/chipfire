import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'min-h-24 w-full rounded-lg border bg-secondary/20 px-3 py-2 text-sm transition-all duration-200 resize-vertical',
          'border-primary/30 text-foreground placeholder:text-muted-foreground/60',
          'hover:border-primary/50 hover:bg-secondary/25',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/60',
          'disabled:cursor-not-allowed disabled:bg-secondary/10 disabled:text-muted-foreground disabled:opacity-70 disabled:border-primary/15',
          className,
        )}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'
