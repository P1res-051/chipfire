import * as React from 'react'

import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'destructive'

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastItem = Required<Pick<ToastInput, 'title'>> &
  ToastInput & {
    id: string
    createdAt: number
  }

type ToastContextValue = {
  toast: (input: ToastInput) => void
  dismiss: (id: string) => void
  clear: () => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

export function ToastProvider(props: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clear = React.useCallback(() => setToasts([]), [])

  const toast = React.useCallback(
    (input: ToastInput) => {
      const item: ToastItem = {
        id: uid(),
        title: input.title,
        description: input.description,
        variant: input.variant ?? 'default',
        durationMs: input.durationMs ?? 4500,
        createdAt: Date.now(),
      }

      setToasts((prev) => [item, ...prev].slice(0, 5))

      window.setTimeout(() => {
        dismiss(item.id)
      }, item.durationMs)
    },
    [dismiss],
  )

  const value = React.useMemo(() => ({ toast, dismiss, clear }), [toast, dismiss, clear])

  return (
    <ToastContext.Provider value={value}>
      {props.children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider />')
  }
  return ctx
}

function Toaster(props: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {props.toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'rounded-xl border bg-card shadow-glow px-4 py-3 backdrop-blur',
            t.variant === 'success' && 'border-neon-green/50',
            t.variant === 'destructive' && 'border-destructive/60',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-5">{t.title}</div>
              {t.description ? (
                <div className="mt-1 text-sm text-muted-foreground">{t.description}</div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => props.onDismiss(t.id)}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary/60"
            >
              Fechar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

