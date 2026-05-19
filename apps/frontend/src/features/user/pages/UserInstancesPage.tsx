import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlugZap, Plus, QrCode, RefreshCcw, Settings2, Trash2, Unplug } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { getErrorMessage } from '@/lib/http'

type InstanceStatus = 'WAITING_QR' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PAUSED'
type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'

type Instance = {
  id: string
  instanceName: string
  phoneNumber: string | null
  status: InstanceStatus
  maturationEnabled: boolean
  maturationMessagesPerCycle: number
  maturationDailyLimit: number
  maturationIntervalMinSeconds: number
  maturationIntervalMaxSeconds: number
  maturationContentGroupSlugs: string[]
  maturationNextSendAt: string | null
  maturationLastSentAt: string | null
  maturationLastQueueAt: string | null
  maturationCurrentTargetName: string | null
  qrCode: string | null
  messagesSentToday: number
  messagesReceivedToday: number
  maturationMessagesToday: number
  healthScore: number
  healthLabel: string
  lastActivityAt: string | null
  lastMaturationLog: {
    targetInstanceName: string
    templateName: string | null
    occurredAt: string
    status: string
    messageType: MessageType
    contentGroupSlug: string | null
    text: string
    errorMessage: string | null
  } | null
  createdAt: string
}

const createSchema = z.object({
  instanceName: z.string().min(2, 'Informe um nome'),
  phoneNumber: z.string().optional(),
})

const maturationConfigSchema = z
  .object({
    messagesPerCycle: z.coerce.number().int().min(1).max(10),
    dailyLimit: z.coerce.number().int().min(1).max(500),
    intervalMinSeconds: z.coerce.number().int().min(15).max(3600),
    intervalMaxSeconds: z.coerce.number().int().min(15).max(3600),
    contentGroupSlugsText: z.string().default(''),
  })
  .refine((value) => value.intervalMaxSeconds >= value.intervalMinSeconds, {
    message: 'O intervalo maximo precisa ser maior ou igual ao minimo.',
    path: ['intervalMaxSeconds'],
  })

type CreateValues = z.infer<typeof createSchema>
type MaturationConfigFormValues = z.input<typeof maturationConfigSchema>
type MaturationConfigValues = z.output<typeof maturationConfigSchema>

function statusBadge(status: InstanceStatus) {
  switch (status) {
    case 'CONNECTED':
      return <Badge variant="success">CONNECTED</Badge>
    case 'WAITING_QR':
      return <Badge variant="warning">WAITING_QR</Badge>
    case 'DISCONNECTED':
      return <Badge variant="outline">DISCONNECTED</Badge>
    case 'PAUSED':
      return <Badge variant="outline">PAUSED</Badge>
    default:
      return <Badge variant="destructive">ERROR</Badge>
  }
}

function formatCountdown(target: string | null, now: number) {
  if (!target) return 'Sem agendamento'
  const diff = new Date(target).getTime() - now
  if (Number.isNaN(diff)) return 'Sem agendamento'
  if (diff <= 0) return 'Disparando...'

  const totalSeconds = Math.floor(diff / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function summarizeLastLog(instance: Instance) {
  const log = instance.lastMaturationLog
  if (!log) {
    return instance.maturationLastQueueAt
      ? `Na fila desde: ${formatDateTime(instance.maturationLastQueueAt)}`
      : 'Entrando na fila'
  }

  return `${instance.instanceName} -> ${log.targetInstanceName} as ${formatDateTime(log.occurredAt)}${log.templateName ? ` · ${log.templateName}` : ''}${log.contentGroupSlug ? ` · grupo:${log.contentGroupSlug}` : ''}${log.messageType !== 'TEXT' ? ` · ${log.messageType}` : ''}${log.status !== 'SENT' && log.errorMessage ? ` · ${log.errorMessage}` : ''}`
}

export function UserInstancesPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const instances = useQuery({
    queryKey: ['user', 'instances'],
    queryFn: async () => {
      const { data } = await api.get('/instances')
      return data as Instance[]
    },
  })

  const metrics = React.useMemo(() => {
    const list = instances.data ?? []
    const total = list.length
    const connected = list.filter((i) => i.status === 'CONNECTED').length
    const waitingQr = list.filter((i) => i.status === 'WAITING_QR').length
    const disconnected = list.filter((i) => i.status === 'DISCONNECTED').length
    const errors = list.filter((i) => i.status === 'ERROR').length
    const healthAvg = total
      ? Math.round(list.reduce((acc, i) => acc + (i.healthScore ?? 0), 0) / total)
      : 0
    return { total, connected, waitingQr, disconnected, errors, healthAvg }
  }, [instances.data])

  const [createOpen, setCreateOpen] = React.useState(false)
  const [qrOpen, setQrOpen] = React.useState(false)
  const [qrValue, setQrValue] = React.useState<string | null>(null)
  const [qrTitle, setQrTitle] = React.useState<string>('QR Code')
  const [qrError, setQrError] = React.useState<string | null>(null)
  const [qrImageSrc, setQrImageSrc] = React.useState<string | null>(null)
  const [qrInstanceId, setQrInstanceId] = React.useState<string | null>(null)
  const [configOpen, setConfigOpen] = React.useState(false)
  const [configInstance, setConfigInstance] = React.useState<Instance | null>(null)
  const [nowTs, setNowTs] = React.useState(() => Date.now())

  const closeQr = React.useCallback(() => {
    setQrOpen(false)
    setQrValue(null)
    setQrTitle('QR Code')
    setQrError(null)
    setQrImageSrc(null)
    setQrInstanceId(null)
  }, [])

  const handleQrOpenChange = React.useCallback(
    (open: boolean) => {
      if (open) {
        setQrOpen(true)
        return
      }

      closeQr()
    },
    [closeQr],
  )

  React.useEffect(() => {
    let cancelled = false

    async function build() {
      if (!qrValue) {
        setQrImageSrc(null)
        return
      }

      const isDataUrl = qrValue.startsWith('data:image')
      const isHttp = qrValue.startsWith('http')
      const looksBase64 = qrValue.length > 80 && /^[A-Za-z0-9+/=]+$/.test(qrValue)

      if (isDataUrl) return setQrImageSrc(qrValue)
      if (isHttp) return setQrImageSrc(qrValue)
      if (looksBase64) return setQrImageSrc(`data:image/png;base64,${qrValue}`)

      try {
        const qr = await import('qrcode')
        const url = await qr.toDataURL(qrValue, { margin: 1, width: 320 })
        if (!cancelled) setQrImageSrc(url)
      } catch {
        if (!cancelled) setQrImageSrc(null)
      }
    }

    void build()
    return () => {
      cancelled = true
    }
  }, [qrValue])

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { instanceName: '', phoneNumber: '' },
  })

  const configForm = useForm<MaturationConfigFormValues, unknown, MaturationConfigValues>({
    resolver: zodResolver(maturationConfigSchema),
    defaultValues: {
      messagesPerCycle: 1,
      dailyLimit: 24,
      intervalMinSeconds: 180,
      intervalMaxSeconds: 420,
      contentGroupSlugsText: '',
    },
  })

  const createInstance = useMutation({
    mutationFn: async (values: CreateValues) => {
      const { data } = await api.post('/instances', {
        instanceName: values.instanceName,
        phoneNumber: values.phoneNumber?.trim() || undefined,
      })
      return data as Instance
    },
    onSuccess: async () => {
      toast({ title: 'Instancia criada', variant: 'success' })
      setCreateOpen(false)
      createForm.reset()
      await qc.invalidateQueries({ queryKey: ['user', 'instances'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao criar instancia',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const fetchQr = useMutation({
    mutationFn: async (instance: Instance) => {
      const { data } = await api.get(`/instances/${instance.id}/qrcode`)
      return data as { success: boolean; qrcode?: string; code?: string; message?: string }
    },
    onSuccess: (data, instance) => {
      setQrError(!data.success ? data.message ?? 'QR Code nao disponivel' : null)
      setQrValue(data.qrcode ?? data.code ?? null)
      setQrInstanceId(instance.id)
      setQrOpen(true)
    },
    onError: (e) =>
      toast({
        title: 'Falha ao obter QR Code',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const fetchStatus = useMutation({
    mutationFn: async (instance: Instance) => {
      const { data } = await api.get(`/instances/${instance.id}/status`)
      return data as { providerState: string }
    },
    onSuccess: (data) =>
      toast({ title: 'Status do provedor', description: data.providerState, variant: 'success' }),
    onError: (e) =>
      toast({
        title: 'Falha ao consultar status',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const reconnect = useMutation({
    mutationFn: async (instance: Instance) => {
      const { data } = await api.put(`/instances/${instance.id}/reconnect`)
      return data as unknown
    },
    onSuccess: async () => {
      toast({ title: 'Reconectando...', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['user', 'instances'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao reconectar',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const disconnect = useMutation({
    mutationFn: async (instance: Instance) => {
      const { data } = await api.put(`/instances/${instance.id}/disconnect`)
      return data as unknown
    },
    onSuccess: async () => {
      toast({ title: 'Instancia desconectada', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['user', 'instances'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao desconectar',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const remove = useMutation({
    mutationFn: async (instance: Instance) => {
      const { data } = await api.delete(`/instances/${instance.id}`)
      return data as { ok: boolean }
    },
    onSuccess: async () => {
      toast({ title: 'Instancia removida', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['user', 'instances'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao remover',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const toggleMaturation = useMutation({
    mutationFn: async (payload: { instance: Instance; enabled: boolean }) => {
      const { data } = await api.put(`/instances/${payload.instance.id}/maturation`, {
        enabled: payload.enabled,
      })
      return data as Instance
    },
    onSuccess: async (_, payload) => {
      toast({
        title: payload.enabled ? 'Maturacao ligada' : 'Maturacao pausada',
        description: payload.enabled
          ? 'A instancia entrou na fila automatica de aquecimento.'
          : 'A instancia saiu da fila automatica.',
        variant: 'success',
      })
      await qc.invalidateQueries({ queryKey: ['user', 'instances'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao atualizar maturacao',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const triggerMaturation = useMutation({
    mutationFn: async (instance: Instance) => {
      const { data } = await api.post(`/instances/${instance.id}/maturation/trigger`)
      return data as { ok: boolean }
    },
    onSuccess: async () => {
      toast({
        title: 'Disparo enfileirado',
        description: 'A mensagem de maturacao foi colocada para envio imediato.',
        variant: 'success',
      })
      await qc.invalidateQueries({ queryKey: ['user', 'instances'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao disparar agora',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const saveMaturationConfig = useMutation({
    mutationFn: async (values: MaturationConfigValues) => {
      if (!configInstance) throw new Error('Selecione uma instancia para configurar')

      const contentGroupSlugs = values.contentGroupSlugsText
        .split(/[\n,;]/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)

      const { data } = await api.put(`/instances/${configInstance.id}/maturation/config`, {
        messagesPerCycle: values.messagesPerCycle,
        dailyLimit: values.dailyLimit,
        intervalMinSeconds: values.intervalMinSeconds,
        intervalMaxSeconds: values.intervalMaxSeconds,
        contentGroupSlugs,
      })
      return data as Instance
    },
    onSuccess: async () => {
      toast({
        title: 'Configuracao salva',
        description: 'A maturacao vai usar o novo ritmo e os grupos dinamicos configurados.',
        variant: 'success',
      })
      setConfigOpen(false)
      setConfigInstance(null)
      await qc.invalidateQueries({ queryKey: ['user', 'instances'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao salvar configuracao',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  React.useEffect(() => {
    if (!qrOpen || !qrInstanceId) return

    const timer = window.setInterval(() => {
      void qc.invalidateQueries({ queryKey: ['user', 'instances'] })
    }, 2500)

    return () => window.clearInterval(timer)
  }, [qrOpen, qrInstanceId, qc])

  React.useEffect(() => {
    if (!qrOpen || !qrInstanceId) return

    const current = (instances.data ?? []).find((i) => i.id === qrInstanceId)
    if (current?.status !== 'CONNECTED') return

    closeQr()
    toast({
      title: 'Instancia conectada',
      description: current.phoneNumber ? `Telefone ${current.phoneNumber}` : undefined,
      variant: 'success',
    })
  }, [closeQr, instances.data, qrInstanceId, qrOpen, toast])

  React.useEffect(() => {
    const hasEnabled = (instances.data ?? []).some((instance) => instance.maturationEnabled)
    if (!hasEnabled) return

    const timer = window.setInterval(() => {
      void qc.invalidateQueries({ queryKey: ['user', 'instances'] })
    }, 15000)

    return () => window.clearInterval(timer)
  }, [instances.data, qc])

  React.useEffect(() => {
    const hasEnabled = (instances.data ?? []).some((instance) => instance.maturationEnabled)
    if (!hasEnabled) return

    const timer = window.setInterval(() => {
      setNowTs(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [instances.data])

  React.useEffect(() => {
    if (!configOpen || !configInstance) return

    configForm.reset({
      messagesPerCycle: configInstance.maturationMessagesPerCycle ?? 1,
      dailyLimit: configInstance.maturationDailyLimit ?? 24,
      intervalMinSeconds: configInstance.maturationIntervalMinSeconds ?? 180,
      intervalMaxSeconds: configInstance.maturationIntervalMaxSeconds ?? 420,
      contentGroupSlugsText: (configInstance.maturationContentGroupSlugs ?? []).join('\n'),
    })
  }, [configForm, configInstance, configOpen])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Minhas instancias</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-muted-foreground">
            Crie instancias, pegue o QR Code e gerencie conexao e maturacao.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> Nova instancia
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-2xl font-semibold">
            {instances.isPending ? '-' : metrics.total}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Conectadas</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-2xl font-semibold">
            {instances.isPending ? '-' : metrics.connected}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Aguardando QR</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-2xl font-semibold">
            {instances.isPending ? '-' : metrics.waitingQr}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Desconectadas</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-2xl font-semibold">
            {instances.isPending ? '-' : metrics.disconnected}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Saude media</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-2xl font-semibold">
            {instances.isPending ? '-' : `${metrics.healthAvg}%`}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Lista</CardTitle>
            <p className="text-xs text-muted-foreground">
              Quando a maturacao estiver ligada, a instancia entra na fila e esta tela se atualiza sozinha.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {instances.isPending ? 'Carregando...' : `${instances.data?.length ?? 0} registros`}
          </div>
        </CardHeader>
        <CardContent>
          {instances.isError ? (
            <div className="text-sm text-destructive">{getErrorMessage(instances.error)}</div>
          ) : null}

          <Table className="mt-2 min-w-[1320px]">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[7%]" />
              <col className="w-[10%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[9%]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Instancia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Msgs hoje</TableHead>
                <TableHead>Saude</TableHead>
                <TableHead>Maturacao</TableHead>
                <TableHead>Destino atual</TableHead>
                <TableHead>Ultima atividade</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(instances.data ?? []).map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.instanceName}</TableCell>
                  <TableCell>{statusBadge(i.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{i.phoneNumber ?? '-'}</TableCell>
                  <TableCell className="text-center">
                    {(i.messagesSentToday ?? 0) + (i.messagesReceivedToday ?? 0)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {i.healthScore ?? 0}% · {i.healthLabel}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant={i.maturationEnabled ? 'secondary' : 'outline'}
                        className="h-7 px-3"
                        title={i.maturationEnabled ? 'Pausar maturacao' : 'Ligar maturacao'}
                        onClick={() =>
                          toggleMaturation.mutate({ instance: i, enabled: !i.maturationEnabled })
                        }
                        disabled={toggleMaturation.isPending}
                      >
                        {i.maturationEnabled ? 'Ligada' : 'OFF'}
                      </Button>
                      {i.maturationEnabled ? (
                        <>
                          <div className="text-xs text-muted-foreground">
                            Proximo envio em: {formatCountdown(i.maturationNextSendAt, nowTs)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Maturacao hoje: {i.maturationMessagesToday ?? 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Ciclo: {i.maturationMessagesPerCycle} msg · limite: {i.maturationDailyLimit}/dia
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Intervalo: {i.maturationIntervalMinSeconds}s - {i.maturationIntervalMaxSeconds}s
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Grupos: {i.maturationContentGroupSlugs?.length ? i.maturationContentGroupSlugs.join(', ') : 'template/admin/fallback'}
                          </div>
                          <div className="text-xs text-muted-foreground">{summarizeLastLog(i)}</div>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {i.maturationEnabled ? i.maturationCurrentTargetName ?? 'Definindo...' : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(i.lastActivityAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 px-3"
                        title="Disparar agora"
                        onClick={() => triggerMaturation.mutate(i)}
                        disabled={!i.maturationEnabled || triggerMaturation.isPending}
                      >
                        Disparar agora
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        title="Configurar maturacao"
                        onClick={() => {
                          setConfigInstance(i)
                          setConfigOpen(true)
                        }}
                      >
                        <Settings2 />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        title="Mostrar QR Code"
                        onClick={() => {
                          setQrTitle(`QR Code · ${i.instanceName}`)
                          fetchQr.mutate(i)
                        }}
                        disabled={fetchQr.isPending}
                      >
                        <QrCode />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        title="Consultar status"
                        onClick={() => fetchStatus.mutate(i)}
                        disabled={fetchStatus.isPending}
                      >
                        <RefreshCcw />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        title="Desconectar"
                        onClick={() => {
                          const ok = window.confirm(`Desconectar a instancia "${i.instanceName}"?`)
                          if (!ok) return
                          disconnect.mutate(i)
                        }}
                        disabled={disconnect.isPending}
                      >
                        <Unplug />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        title="Reconectar"
                        onClick={() => {
                          const ok = window.confirm(`Reconectar a instancia "${i.instanceName}"?`)
                          if (!ok) return
                          reconnect.mutate(i)
                        }}
                        disabled={reconnect.isPending}
                      >
                        <PlugZap />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        title="Remover"
                        onClick={() => {
                          const ok = window.confirm(`Remover instancia "${i.instanceName}"?`)
                          if (ok) remove.mutate(i)
                        }}
                        disabled={remove.isPending}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!instances.isPending && (instances.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma instancia encontrada.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          title="Nova instancia"
          description="Cria a instancia na Evolution API para seu usuario."
        >
          <form
            className="space-y-4"
            onSubmit={createForm.handleSubmit((v) => createInstance.mutate(v))}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Nome da instancia</label>
                <Input {...createForm.register('instanceName')} />
                {createForm.formState.errors.instanceName?.message ? (
                  <p className="text-sm text-red-400">
                    {createForm.formState.errors.instanceName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Telefone (opcional)</label>
                <Input placeholder="5511999999999" {...createForm.register('phoneNumber')} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createInstance.isPending}>
                {createInstance.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={handleQrOpenChange}>
        <DialogContent title={qrTitle} description="Use este QR Code para conectar o WhatsApp.">
          {qrError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {qrError}
            </div>
          ) : null}

          {qrValue ? (
            <div className="space-y-3">
              {qrImageSrc ? (
                <img
                  alt="QR Code"
                  className="mx-auto max-h-[320px] rounded-lg border bg-white p-3"
                  src={qrImageSrc}
                />
              ) : (
                <div className="rounded-lg border bg-secondary/30 p-3 text-sm">
                  Codigo recebido (nao foi possivel renderizar imagem):
                  <pre className="mt-2 overflow-auto text-xs">{qrValue}</pre>
                </div>
              )}
              <pre className="max-h-40 overflow-auto rounded-lg border bg-secondary/30 p-3 text-xs">
                {qrValue}
              </pre>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Sem QR Code retornado.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={configOpen}
        onOpenChange={(open) => {
          setConfigOpen(open)
          if (!open) setConfigInstance(null)
        }}
      >
        <DialogContent
          title={configInstance ? `Maturacao · ${configInstance.instanceName}` : 'Configurar maturacao'}
          description="Defina quantidade por ciclo, intervalo e quais grupos dinamicos entram na rotacao."
          className="max-w-2xl"
        >
          <form
            className="space-y-4"
            onSubmit={configForm.handleSubmit((values) => saveMaturationConfig.mutate(values))}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Mensagens por ciclo</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  {...configForm.register('messagesPerCycle', { valueAsNumber: true })}
                />
                {configForm.formState.errors.messagesPerCycle?.message ? (
                  <p className="text-sm text-red-400">
                    {configForm.formState.errors.messagesPerCycle.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Limite diario</label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  {...configForm.register('dailyLimit', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Intervalo minimo (segundos)</label>
                <Input
                  type="number"
                  min={15}
                  max={3600}
                  {...configForm.register('intervalMinSeconds', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Intervalo maximo (segundos)</label>
                <Input
                  type="number"
                  min={15}
                  max={3600}
                  {...configForm.register('intervalMaxSeconds', { valueAsNumber: true })}
                />
                {configForm.formState.errors.intervalMaxSeconds?.message ? (
                  <p className="text-sm text-red-400">
                    {configForm.formState.errors.intervalMaxSeconds.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Grupos dinamicos (slugs)</label>
              <Textarea
                rows={5}
                placeholder={'saudacoes\nfotos-rotina\naudios-curtos'}
                {...configForm.register('contentGroupSlugsText')}
              />
              <p className="text-xs text-muted-foreground">
                Um slug por linha. Se ficar vazio, a maturacao usa template, grupos do template e fallback admin.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setConfigOpen(false)
                  setConfigInstance(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMaturationConfig.isPending}>
                {saveMaturationConfig.isPending ? 'Salvando...' : 'Salvar configuracao'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
