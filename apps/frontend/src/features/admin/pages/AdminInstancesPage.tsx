import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlugZap, Plus, QrCode, RefreshCcw, Trash2, Unplug } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { getErrorMessage } from '@/lib/http'

type InstanceStatus = 'WAITING_QR' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PAUSED'

type Instance = {
  id: string
  userId: string
  instanceName: string
  phoneNumber: string | null
  status: InstanceStatus
  qrCode: string | null
  messagesSentToday: number
  messagesReceivedToday: number
  healthScore: number
  healthLabel: string
  lastActivityAt: string | null
  createdAt: string
  user?: { id: string; name: string; email: string }
}

type UserOption = { id: string; name: string; email: string }

const createSchema = z.object({
  userId: z.string().min(1, 'Selecione um usuário'),
  instanceName: z.string().min(2, 'Informe um nome'),
  phoneNumber: z.string().optional(),
})

type CreateValues = z.infer<typeof createSchema>

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

export function AdminInstancesPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const [filterUserId, setFilterUserId] = React.useState<string>('')
  const [filterStatus, setFilterStatus] = React.useState<string>('')

  const users = useQuery({
    queryKey: ['admin', 'users', 'options'],
    queryFn: async () => {
      const { data } = await api.get('/users')
      return (data as Array<{ id: string; name: string; email: string }>).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      })) as UserOption[]
    },
  })

  const instances = useQuery({
    queryKey: ['admin', 'instances', { userId: filterUserId, status: filterStatus }],
    queryFn: async () => {
      const { data } = await api.get('/instances', {
        params: {
          userId: filterUserId || undefined,
          status: filterStatus || undefined,
        },
      })
      return data as Instance[]
    },
  })

  const [createOpen, setCreateOpen] = React.useState(false)
  const [qrOpen, setQrOpen] = React.useState(false)
  const [qrValue, setQrValue] = React.useState<string | null>(null)
  const [qrTitle, setQrTitle] = React.useState<string>('QR Code')
  const [qrError, setQrError] = React.useState<string | null>(null)
  const [qrImageSrc, setQrImageSrc] = React.useState<string | null>(null)

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

      // Caso seja um "code" textual da Evolution, geramos a imagem QR localmente.
      try {
        const qr = await import('qrcode')
        const url = await qr.toDataURL(qrValue, { margin: 1, width: 320 })
        if (!cancelled) setQrImageSrc(url)
      } catch {
        if (!cancelled) setQrImageSrc(null)
      }
    }

    build()
    return () => {
      cancelled = true
    }
  }, [qrValue])

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      userId: '',
      instanceName: '',
      phoneNumber: '',
    },
  })

  const createInstance = useMutation({
    mutationFn: async (values: CreateValues) => {
      const { data } = await api.post('/instances/admin', {
        userId: values.userId,
        instanceName: values.instanceName,
        phoneNumber: values.phoneNumber?.trim() || undefined,
      })
      return data as Instance
    },
    onSuccess: async () => {
      toast({ title: 'Instância criada', variant: 'success' })
      setCreateOpen(false)
      createForm.reset()
      await qc.invalidateQueries({ queryKey: ['admin', 'instances'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao criar instância',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const fetchQr = useMutation({
    mutationFn: async (instance: Instance) => {
      const { data } = await api.get(`/instances/${instance.id}/qrcode`)
      return data as { success: boolean; qrcode?: string; code?: string; message?: string }
    },
    onSuccess: (data) => {
      setQrError(!data.success ? data.message ?? 'QR Code não disponível' : null)
      setQrValue(data.qrcode ?? data.code ?? null)
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
      toast({ title: 'Falha ao consultar status', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const reconnect = useMutation({
    mutationFn: async (instance: Instance) => {
      const { data } = await api.put(`/instances/${instance.id}/reconnect`)
      return data as any
    },
    onSuccess: async () => {
      toast({ title: 'Reconectando…', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'instances'] })
    },
    onError: (e) =>
      toast({ title: 'Falha ao reconectar', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const disconnect = useMutation({
    mutationFn: async (instance: Instance) => {
      const { data } = await api.put(`/instances/${instance.id}/disconnect`)
      return data as any
    },
    onSuccess: async () => {
      toast({ title: 'Instância desconectada', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'instances'] })
    },
    onError: (e) =>
      toast({ title: 'Falha ao desconectar', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const remove = useMutation({
    mutationFn: async (instance: Instance) => {
      const { data } = await api.delete(`/instances/${instance.id}`)
      return data as { ok: boolean }
    },
    onSuccess: async () => {
      toast({ title: 'Instância removida', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'instances'] })
    },
    onError: (e) =>
      toast({ title: 'Falha ao remover', description: getErrorMessage(e), variant: 'destructive' }),
  })

  function getHealthInfo(i: Instance) {
    const tooltip =
      'A saúde operacional considera conexão, erros, atividade e respostas. Será calculada após dados suficientes.'

    // Se o backend já manda uma pontuação válida, usamos.
    if (typeof i.healthScore === 'number' && i.healthScore > 0) {
      const score = clampScore(i.healthScore)
      return { display: `${score}%`, label: classify(score), variant: badgeVariant(score), title: tooltip }
    }

    // Estimativa simples (somente UI) baseada em sinais disponíveis na listagem.
    const hasSignal =
      i.status === 'CONNECTED' ||
      (i.messagesSentToday ?? 0) > 0 ||
      (i.messagesReceivedToday ?? 0) > 0 ||
      Boolean(i.lastActivityAt)

    if (!hasSignal) return { display: 'N/A', label: 'Métrica em consolidação', variant: 'outline' as const, title: tooltip }

    let score = 0
    if (i.status === 'CONNECTED') score += 40
    if ((i.messagesSentToday ?? 0) > 0) score += 20
    if ((i.messagesReceivedToday ?? 0) > 0) score += 20
    if (i.status !== 'ERROR' && i.status !== 'DISCONNECTED') score += 10

    // bônus de atividade recente (últimas 24h)
    if (i.lastActivityAt) {
      const last = new Date(i.lastActivityAt).getTime()
      if (!Number.isNaN(last) && Date.now() - last < 24 * 60 * 60 * 1000) score += 10
    }

    const finalScore = clampScore(score)
    return { display: `${finalScore}%`, label: `${classify(finalScore)} (estimado)`, variant: badgeVariant(finalScore), title: tooltip }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Instâncias</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-muted-foreground">
            Operação e visibilidade: status, QR Code, reconexão e remoção.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          <Plus /> Nova instância
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lista</CardTitle>
            <div className="text-sm text-muted-foreground">
              {instances.isPending ? 'Carregando…' : `${instances.data?.length ?? 0} registros`}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Usuário</label>
              <Select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)}>
                <option value="">Todos</option>
                {(users.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Status</label>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="CONNECTED">CONNECTED</option>
                <option value="WAITING_QR">WAITING_QR</option>
                <option value="DISCONNECTED">DISCONNECTED</option>
                <option value="PAUSED">PAUSED</option>
                <option value="ERROR">ERROR</option>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterUserId('')
                  setFilterStatus('')
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {instances.isError ? (
            <div className="text-sm text-destructive">{getErrorMessage(instances.error)}</div>
          ) : null}

          <Table className="mt-2 min-w-[1040px]">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[24%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[9%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[130px]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Instância</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Msgs</TableHead>
                <TableHead>Saúde</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(instances.data ?? []).map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium max-w-[190px] truncate" title={i.instanceName}>
                    {i.instanceName}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[260px] truncate" title={i.user ? `${i.user.name} · ${i.user.email}` : i.userId}>
                    {i.user ? `${i.user.name} · ${i.user.email}` : i.userId}
                  </TableCell>
                  <TableCell>{statusBadge(i.status)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap" title={i.phoneNumber ?? ''}>
                    {i.phoneNumber ?? '—'}
                  </TableCell>
                  <TableCell className="text-center">{(i.messagesSentToday ?? 0) + (i.messagesReceivedToday ?? 0)}</TableCell>
                  <TableCell className="text-muted-foreground truncate" title={getHealthInfo(i).title}>
                    {(() => {
                      const h = getHealthInfo(i)
                      return (
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant={h.variant} className="whitespace-nowrap">
                            {h.display}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate" title={h.label}>
                            {h.label}
                          </span>
                        </div>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{formatDateTime(i.lastActivityAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        title="Mostrar QR Code"
                        aria-label={`Mostrar QR Code de ${i.instanceName}`}
                        onClick={() => {
                          setQrTitle(`QR Code · ${i.instanceName}`)
                          fetchQr.mutate(i)
                        }}
                        disabled={fetchQr.isPending}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        title="Consultar status"
                        aria-label={`Consultar status de ${i.instanceName}`}
                        onClick={() => fetchStatus.mutate(i)}
                        disabled={fetchStatus.isPending}
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        title="Reconectar"
                        aria-label={`Reconectar ${i.instanceName}`}
                        onClick={() => {
                          const ok = window.confirm(`Reconectar a instância "${i.instanceName}"?`)
                          if (!ok) return
                          reconnect.mutate(i)
                        }}
                        disabled={reconnect.isPending}
                      >
                        <PlugZap className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        title="Desconectar"
                        aria-label={`Desconectar ${i.instanceName}`}
                        onClick={() => {
                          const ok = window.confirm(`Desconectar a instância "${i.instanceName}"?`)
                          if (!ok) return
                          disconnect.mutate(i)
                        }}
                        disabled={disconnect.isPending}
                      >
                        <Unplug className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        title="Remover"
                        aria-label={`Remover ${i.instanceName}`}
                        onClick={() => {
                          const ok = window.confirm(`Remover instância "${i.instanceName}"?`)
                          if (ok) remove.mutate(i)
                        }}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!instances.isPending && (instances.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma instância encontrada.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Criar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent title="Nova instância" description="Cria a instância na Evolution API e associa ao usuário.">
          <form
            className="space-y-4"
            onSubmit={createForm.handleSubmit((v) => createInstance.mutate(v))}
          >
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Usuário</label>
              <Select {...createForm.register('userId')}>
                <option value="">Selecione…</option>
                {(users.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </Select>
              {createForm.formState.errors.userId?.message ? (
                <p className="text-sm text-red-400">{createForm.formState.errors.userId.message}</p>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Nome da instância</label>
                <Input {...createForm.register('instanceName')} />
                {createForm.formState.errors.instanceName?.message ? (
                  <p className="text-sm text-red-400">{createForm.formState.errors.instanceName.message}</p>
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
                {createInstance.isPending ? 'Criando…' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
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
                  Código recebido (não foi possível renderizar imagem):
                  <pre className="mt-2 overflow-auto text-xs">{qrValue}</pre>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Se a imagem não renderizar, copie o valor bruto abaixo e valide no backend.
              </div>
              <pre className="max-h-40 overflow-auto rounded-lg border bg-secondary/30 p-3 text-xs">
                {qrValue}
              </pre>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Sem QR Code retornado.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function clampScore(v: number) {
  const n = Math.round(Number(v) || 0)
  return Math.max(0, Math.min(100, n))
}

function classify(score: number) {
  if (score < 40) return 'Crítica'
  if (score < 60) return 'Atenção'
  if (score < 80) return 'Boa'
  return 'Excelente'
}

function badgeVariant(score: number): React.ComponentProps<typeof Badge>['variant'] {
  if (score < 40) return 'destructive'
  if (score < 60) return 'warning'
  if (score < 80) return 'default'
  return 'success'
}
