import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border/60 bg-secondary/30 text-foreground hover:bg-secondary/40',
        success: 'border-success/50 bg-success/15 text-foreground font-medium',
        warning: 'border-warning/50 bg-warning/15 text-foreground font-medium',
        destructive: 'border-destructive/50 bg-destructive/15 text-foreground font-medium',
        outline: 'border-border/50 bg-transparent text-muted-foreground hover:text-foreground hover:border-border/70',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
