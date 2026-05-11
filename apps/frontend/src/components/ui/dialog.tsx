import * as React from 'react'

import { cn } from '@/lib/utils'

type DialogContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export function Dialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  const value = React.useMemo(
    () => ({ open: props.open, onOpenChange: props.onOpenChange }),
    [props.open, props.onOpenChange],
  )

  return <DialogContext.Provider value={value}>{props.children}</DialogContext.Provider>
}

export function DialogTrigger(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error('DialogTrigger deve ser usado dentro de <Dialog />')

  return (
    <button
      type="button"
      {...props}
      onClick={(e) => {
        props.onClick?.(e)
        ctx.onOpenChange(true)
      }}
    />
  )
}

export function DialogContent(props: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error('DialogContent deve ser usado dentro de <Dialog />')
  const { open, onOpenChange } = ctx

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onMouseDown={() => onOpenChange(false)}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            // evita que modais grandes “estourem” fora da viewport; o conteúdo vira scroll quando necessário
            'flex w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-card shadow-glow max-h-[85vh]',
            props.className,
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b p-5">
            <div className="min-w-0">
              <div className="text-base font-semibold">{props.title}</div>
              {props.description ? (
                <div className="mt-1 text-sm text-muted-foreground">{props.description}</div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-secondary/60"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </button>
          </div>
          <div className="flex-1 overflow-auto p-5">{props.children}</div>
        </div>
      </div>
    </div>
  )
}
