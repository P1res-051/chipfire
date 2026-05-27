import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  MessageSquareText,
  Moon,
  RadioTower,
  ShieldCheck,
  Sun,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import chipfireIcon from '@/assets/icon-chipfire.png'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useTheme } from '@/theme/theme'
import { useAuthStore } from './auth.store'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const setSession = useAuthStore((state) => state.setSession)
  const { theme, toggleTheme } = useTheme()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const login = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post('/auth/login', values)
      return data as {
        accessToken: string
        refreshToken: string
        role: 'ADMIN' | 'USER'
        mustChangePassword: boolean
      }
    },
    onSuccess: (data) => {
      setSession(data)
      window.location.href = data.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'
    },
  })

  return (
    <div className="min-h-screen bg-grid px-4 py-6">
      <div className="mx-auto flex w-full max-w-7xl justify-end">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 bg-card/80"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <img src={chipfireIcon} alt="ChipFire" className="h-10 w-10 object-contain" />
            </span>
            <div>
              <div className="text-3xl font-semibold tracking-tight text-primary">ChipFire</div>
              <div className="text-sm text-muted-foreground">Central de operação WhatsApp</div>
            </div>
          </div>

          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Operação segura para contatos autorizados
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
              Controle instâncias, campanhas e conversas em uma única mesa de operação.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Um painel direto para equipes que precisam acompanhar números conectados, mensagens, mídia,
              contatos e logs sem perder tempo procurando informação.
            </p>
          </div>

          <div className="grid max-w-3xl gap-3 md:grid-cols-3">
            {[
              { icon: RadioTower, label: 'Instâncias', text: 'status, QR Code e conexão' },
              { icon: MessageSquareText, label: 'Inbox', text: 'conversas e histórico' },
              { icon: CheckCircle2, label: 'Campanhas', text: 'envio controlado e logs' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-lg border border-border/80 bg-card/78 p-4 shadow-[var(--card-shadow)]">
                  <Icon className="mb-4 h-5 w-5 text-primary" />
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</div>
                </div>
              )
            })}
          </div>

          <div className="hidden max-w-3xl rounded-xl border border-border/80 bg-card/88 p-3 shadow-[var(--card-shadow)] md:block">
            <div className="mb-3 flex items-center justify-between border-b border-border/70 px-2 pb-3">
              <div className="text-sm font-medium">Operação em tempo real</div>
              <div className="rounded-full bg-success/10 px-2 py-1 text-xs text-success">Ativo</div>
            </div>
            <div className="grid gap-2">
              {['chipfire-vendas', 'chipfire-suporte', 'chipfire-campanhas'].map((name, index) => (
                <div key={name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md bg-background/70 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground">{index + 2} conversas recentes</div>
                  </div>
                  <span className="rounded-full bg-success/10 px-2 py-1 text-xs text-success">Conectada</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl">Entrar no sistema</CardTitle>
            <CardDescription>Use suas credenciais para continuar no painel do ChipFire.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => login.mutate(values))}>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="admin@local.com"
                    autoComplete="email"
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email ? (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-10" type="password" autoComplete="current-password" {...form.register('password')} />
                </div>
                {form.formState.errors.password ? (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <p className="mx-auto max-w-7xl pb-4 text-center text-xs text-muted-foreground">
        Envio apenas para contatos com opt-in. Sem recursos de spam ou abuso.
      </p>
    </div>
  )
}
