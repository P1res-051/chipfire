import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Action = {
  label: string
  onClick: () => void
  variant?: React.ComponentProps<typeof Button>['variant']
}

export function EmptyState(props: {
  icon?: React.ReactNode
  title: string
  description?: string
  primaryAction?: Action
  secondaryAction?: Action
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border bg-secondary/20 p-8 text-center', props.className)}>
      {props.icon ? (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border bg-background/40 text-muted-foreground">
          {props.icon}
        </div>
      ) : null}
      <div className="text-base font-semibold">{props.title}</div>
      {props.description ? <div className="mt-1 text-sm text-muted-foreground">{props.description}</div> : null}
      {props.primaryAction || props.secondaryAction ? (
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          {props.primaryAction ? (
            <Button onClick={props.primaryAction.onClick} variant={props.primaryAction.variant ?? 'default'}>
              {props.primaryAction.label}
            </Button>
          ) : null}
          {props.secondaryAction ? (
            <Button onClick={props.secondaryAction.onClick} variant={props.secondaryAction.variant ?? 'outline'}>
              {props.secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

