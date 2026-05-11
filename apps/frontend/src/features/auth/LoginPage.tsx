import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Lock, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import chipfireIcon from '@/assets/icon-chipfire.png'
import { api } from '@/lib/api'
import { useAuthStore } from './auth.store'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const setSession = useAuthStore((s) => s.setSession)

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
      window.location.href =
        data.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'
    },
  })

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="neon-border">
          <CardHeader>
            <div className="flex flex-col items-center gap-3">
              <img
                src={chipfireIcon}
                alt="ChipFire"
                className="h-20 w-20 object-contain drop-shadow-[0_0_14px_rgba(255,109,0,0.22)]"
              />
              <CardTitle className="text-2xl text-center">ChipFire</CardTitle>
              <CardDescription className="text-center">
                Operação inteligente · Segurança · Automação
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((v) => login.mutate(v))}
            >
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
                {form.formState.errors.email && (
                  <p className="text-sm text-red-400">
                    {form.formState.errors.email.message}
                  </p>
                )}
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
                {form.formState.errors.password && (
                  <p className="text-sm text-red-400">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={login.isPending}
              >
                {login.isPending ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Envio apenas para contatos com opt-in. Sem recursos de spam/abuso.
        </p>
      </div>
    </div>
  )
}
