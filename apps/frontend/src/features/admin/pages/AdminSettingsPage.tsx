import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'

type Settings = {
  id: string
  evolutionApiUrlInternal: string
  evolutionApiUrlPublic: string
  evolutionApiKeyHint: string | null
  evolutionWebhookBaseUrl: string | null
  evolutionTimeoutMs: number
  evolutionMaxRetries: number
  defaultDailyLimitPerInstance: number
  defaultAllowedStartTime: string
  defaultAllowedEndTime: string
  defaultIntervalMinSeconds: number
  defaultIntervalMaxSeconds: number
  maxErrorRatePercent: number
  maxOptOutRatePercent: number
  maxMediaSizeMb: number
  autoPauseOnInstability: boolean
  createdAt: string
  updatedAt: string
}

const schema = z.object({
  evolutionApiUrlInternal: z.string().url('URL interna inválida'),
  evolutionApiUrlPublic: z.string().url('URL pública inválida'),
  evolutionWebhookBaseUrl: z.string().url('Webhook base URL inválida').optional().nullable(),
  evolutionTimeoutMs: z.number().int().min(1000).max(120000),
  evolutionMaxRetries: z.number().int().min(0).max(10),

  defaultDailyLimitPerInstance: z.number().int().min(0).max(5000),
  defaultAllowedStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
  defaultAllowedEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
  defaultIntervalMinSeconds: z.number().int().min(0).max(3600),
  defaultIntervalMaxSeconds: z.number().int().min(0).max(3600),
  maxErrorRatePercent: z.number().int().min(0).max(100),
  maxOptOutRatePercent: z.number().int().min(0).max(100),
  maxMediaSizeMb: z.number().int().min(1).max(100),
  autoPauseOnInstability: z.boolean(),

  // Apenas informativo (não armazenamos o segredo)
  evolutionApiKeyHint: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof schema>

export function AdminSettingsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()

  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      return data as Settings
    },
    staleTime: 30_000,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      evolutionApiUrlInternal: '',
      evolutionApiUrlPublic: '',
      evolutionWebhookBaseUrl: null,
      evolutionTimeoutMs: 15000,
      evolutionMaxRetries: 3,
      defaultDailyLimitPerInstance: 200,
      defaultAllowedStartTime: '08:00',
      defaultAllowedEndTime: '20:00',
      defaultIntervalMinSeconds: 15,
      defaultIntervalMaxSeconds: 60,
      maxErrorRatePercent: 5,
      maxOptOutRatePercent: 2,
      maxMediaSizeMb: 25,
      autoPauseOnInstability: true,
      evolutionApiKeyHint: null,
    },
  })

  React.useEffect(() => {
    if (!settings.data) return
    form.reset({
      evolutionApiUrlInternal: settings.data.evolutionApiUrlInternal,
      evolutionApiUrlPublic: settings.data.evolutionApiUrlPublic,
      evolutionWebhookBaseUrl: settings.data.evolutionWebhookBaseUrl,
      evolutionTimeoutMs: settings.data.evolutionTimeoutMs,
      evolutionMaxRetries: settings.data.evolutionMaxRetries,
      defaultDailyLimitPerInstance: settings.data.defaultDailyLimitPerInstance,
      defaultAllowedStartTime: settings.data.defaultAllowedStartTime,
      defaultAllowedEndTime: settings.data.defaultAllowedEndTime,
      defaultIntervalMinSeconds: settings.data.defaultIntervalMinSeconds,
      defaultIntervalMaxSeconds: settings.data.defaultIntervalMaxSeconds,
      maxErrorRatePercent: settings.data.maxErrorRatePercent,
      maxOptOutRatePercent: settings.data.maxOptOutRatePercent,
      maxMediaSizeMb: settings.data.maxMediaSizeMb,
      autoPauseOnInstability: settings.data.autoPauseOnInstability,
      evolutionApiKeyHint: settings.data.evolutionApiKeyHint,
    })
  }, [settings.data, form])

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        evolutionWebhookBaseUrl: values.evolutionWebhookBaseUrl?.trim() ? values.evolutionWebhookBaseUrl : null,
        evolutionApiKeyHint: values.evolutionApiKeyHint?.trim() ? values.evolutionApiKeyHint : null,
      }
      const { data } = await api.patch('/settings', payload)
      return data as Settings
    },
    onSuccess: async () => {
      toast({ title: 'Configurações salvas', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao salvar',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Configurações</h1>
          <ApiStatusPill />
        </div>
        <p className="text-sm text-muted-foreground">
          Configurações globais (salvas no banco). Segredos sensíveis (ex.: API keys reais) permanecem no <code>.env</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações globais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.isPending ? (
            <div className="text-sm text-muted-foreground">Carregando configurações…</div>
          ) : settings.isError ? (
            <div className="text-sm text-destructive">{getErrorMessage(settings.error)}</div>
          ) : (
            <form className="space-y-4" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Evolution API (URL interna)" error={form.formState.errors.evolutionApiUrlInternal?.message}>
                  <Input {...form.register('evolutionApiUrlInternal')} placeholder="http://evolution-api:8080" />
                </Field>
                <Field label="Evolution API (URL pública)" error={form.formState.errors.evolutionApiUrlPublic?.message}>
                  <Input {...form.register('evolutionApiUrlPublic')} placeholder="http://localhost:8080" />
                </Field>
              </div>

              <Field label="Webhook base URL (opcional)" error={form.formState.errors.evolutionWebhookBaseUrl?.message}>
                <Input {...form.register('evolutionWebhookBaseUrl')} placeholder="https://seu-dominio.com/api/webhooks/evolution" />
              </Field>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Timeout (ms)" error={form.formState.errors.evolutionTimeoutMs?.message}>
                  <Input type="number" min={1000} max={120000} {...form.register('evolutionTimeoutMs', { valueAsNumber: true })} />
                </Field>
                <Field label="Max retries" error={form.formState.errors.evolutionMaxRetries?.message}>
                  <Input type="number" min={0} max={10} {...form.register('evolutionMaxRetries', { valueAsNumber: true })} />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Horário permitido (início)" error={form.formState.errors.defaultAllowedStartTime?.message}>
                  <Input {...form.register('defaultAllowedStartTime')} placeholder="08:00" />
                </Field>
                <Field label="Horário permitido (fim)" error={form.formState.errors.defaultAllowedEndTime?.message}>
                  <Input {...form.register('defaultAllowedEndTime')} placeholder="20:00" />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Limite diário padrão/instância" error={form.formState.errors.defaultDailyLimitPerInstance?.message}>
                  <Input type="number" min={0} max={5000} {...form.register('defaultDailyLimitPerInstance', { valueAsNumber: true })} />
                </Field>
                <Field label="Intervalo mínimo (s)" error={form.formState.errors.defaultIntervalMinSeconds?.message}>
                  <Input type="number" min={0} max={3600} {...form.register('defaultIntervalMinSeconds', { valueAsNumber: true })} />
                </Field>
                <Field label="Intervalo máximo (s)" error={form.formState.errors.defaultIntervalMaxSeconds?.message}>
                  <Input type="number" min={0} max={3600} {...form.register('defaultIntervalMaxSeconds', { valueAsNumber: true })} />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Taxa máx. erro (%)" error={form.formState.errors.maxErrorRatePercent?.message}>
                  <Input type="number" min={0} max={100} {...form.register('maxErrorRatePercent', { valueAsNumber: true })} />
                </Field>
                <Field label="Taxa máx. opt-out (%)" error={form.formState.errors.maxOptOutRatePercent?.message}>
                  <Input type="number" min={0} max={100} {...form.register('maxOptOutRatePercent', { valueAsNumber: true })} />
                </Field>
                <Field label="Tamanho máx. mídia (MB)" error={form.formState.errors.maxMediaSizeMb?.message}>
                  <Input type="number" min={1} max={100} {...form.register('maxMediaSizeMb', { valueAsNumber: true })} />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-secondary/20 p-3">
                <div>
                  <div className="text-sm font-medium">Pausa automática em instabilidade</div>
                  <div className="text-xs text-muted-foreground">
                    Recomendado para segurança operacional (não é recurso de evasão).
                  </div>
                </div>
                <input
                  type="checkbox"
                  {...form.register('autoPauseOnInstability')}
                  className="h-5 w-5 accent-[hsl(var(--neon-green))]"
                />
              </div>

              <div className="rounded-xl border bg-secondary/20 p-4 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">Nota de segurança</div>
                <p className="mt-1">
                  A chave real da Evolution API e o segredo do webhook ficam no <code>.env</code>. Aqui salvamos apenas parâmetros operacionais e dicas/URLs.
                </p>
              </div>

              <Field label="Observação (dica de API key — opcional)" error={form.formState.errors.evolutionApiKeyHint?.message}>
                <Textarea rows={3} {...form.register('evolutionApiKeyHint')} placeholder="Ex.: 'Chave configurada no .env'" />
              </Field>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Desfazer
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
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
