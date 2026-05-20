import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Lock, Mail, Moon, ShieldCheck, Sun } from 'lucide-react'
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
    <div className="min-h-screen bg-grid px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl justify-end">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="min-h-[520px] overflow-hidden">
          <CardContent className="flex h-full flex-col justify-between p-8 lg:p-10">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <img src={chipfireIcon} alt="ChipFire" className="h-16 w-16 rounded-2xl object-contain" />
                <div>
                  <div className="text-3xl font-semibold text-primary">ChipFire</div>
                  <div className="text-sm text-muted-foreground">
                    Operacao inteligente · Seguranca · Automacao
                  </div>
                </div>
              </div>

              <div className="max-w-xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Ambiente corporativo
                </div>
                <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground">
                  Acesse sua operacao com uma interface limpa, clara e pronta para alternar entre claro e escuro.
                </h1>
                <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                  A linguagem visual enterprise agora vira base do sistema inteiro, com menos ruido e mais consistencia para operacao diaria.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Painel</div>
                <div className="mt-2 text-2xl font-semibold">24</div>
                <div className="mt-1 text-sm text-muted-foreground">instancias conectadas</div>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Fila</div>
                <div className="mt-2 text-2xl font-semibold">312</div>
                <div className="mt-1 text-sm text-muted-foreground">acoes em processamento</div>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Politica</div>
                <div className="mt-2 text-2xl font-semibold">Opt-in</div>
                <div className="mt-1 text-sm text-muted-foreground">somente contatos permitidos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="text-2xl">Entrar no sistema</CardTitle>
            <CardDescription>
              Use suas credenciais para continuar no painel do ChipFire.
            </CardDescription>
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
                  <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    type="password"
                    autoComplete="current-password"
                    {...form.register('password')}
                  />
                </div>
                {form.formState.errors.password ? (
                  <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-muted-foreground">
        Envio apenas para contatos com opt-in. Sem recursos de spam ou abuso.
      </p>
    </div>
  )
}
