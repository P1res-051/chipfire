import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAuthStore } from '@/features/auth/auth.store'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'

const schema = z
  .object({
    currentPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmNewPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  })
  .refine((v) => v.newPassword === v.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'As senhas não coincidem',
  })

type Values = z.infer<typeof schema>

export function UserProfilePage() {
  const { toast } = useToast()
  const role = useAuthStore((s) => s.role)
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const changePassword = useMutation({
    mutationFn: async (values: Values) => {
      const { data } = await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      return data as { ok: boolean }
    },
    onSuccess: () => {
      toast({ title: 'Senha alterada', variant: 'success' })
      form.reset()
    },
    onError: (e) =>
      toast({ title: 'Falha ao alterar senha', description: getErrorMessage(e), variant: 'destructive' }),
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Meu perfil</h1>
          <ApiStatusPill />
        </div>
        <p className="text-sm text-muted-foreground">Preferências e segurança.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border bg-secondary/20 p-3">
              <div>
                <div className="text-sm font-medium">Role</div>
                <div className="text-xs text-muted-foreground">Permissões atuais</div>
              </div>
              <Badge variant="outline">{role ?? '—'}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border bg-secondary/20 p-3">
              <div>
                <div className="text-sm font-medium">Troca de senha</div>
                <div className="text-xs text-muted-foreground">Flag mustChangePassword</div>
              </div>
              {mustChangePassword ? (
                <Badge variant="warning">Obrigatória</Badge>
              ) : (
                <Badge variant="success">Ok</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alterar senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit((v) => changePassword.mutate(v))}>
              <Field label="Senha atual" error={form.formState.errors.currentPassword?.message}>
                <Input type="password" autoComplete="current-password" {...form.register('currentPassword')} />
              </Field>
              <Field label="Nova senha" error={form.formState.errors.newPassword?.message}>
                <Input type="password" autoComplete="new-password" {...form.register('newPassword')} />
              </Field>
              <Field label="Confirmar nova senha" error={form.formState.errors.confirmNewPassword?.message}>
                <Input type="password" autoComplete="new-password" {...form.register('confirmNewPassword')} />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? 'Salvando…' : 'Atualizar senha'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field(props: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground">{props.label}</label>
      {props.children}
      {props.error ? <p className="text-sm text-red-400">{props.error}</p> : null}
    </div>
  )
}

