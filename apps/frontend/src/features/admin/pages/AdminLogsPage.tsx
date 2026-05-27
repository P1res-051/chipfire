import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { ListX } from 'lucide-react'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { getErrorMessage } from '@/lib/http'

type MessageLog = {
  id: string
  userId: string
  instanceId: string | null
  contactId: string | null
  campaignId: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  status: string
  errorType: string | null
  errorMessage: string | null
  meta?: any
  createdAt: string
  instance?: { instanceName: string | null; phoneNumber: string | null }
  contact?: { name: string; phone: string; tag: string | null }
  campaign?: { name: string }
  user?: { email: string }
}

type AuditLog = {
  id: string
  userId: string | null
  action: string
  entity: string | null
  entityId: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: { email: string } | null
}

type UserOption = { id: string; name: string; email: string }
type InstanceOption = { id: string; instanceName: string }

function statusBadge(status: string) {
  if (status === 'SUCCESS' || status === 'SENT' || status === 'RECEIVED') return <Badge variant="success">{status}</Badge>
  if (status === 'PENDING') return <Badge variant="warning">PENDING</Badge>
  return <Badge variant="destructive">{status}</Badge>
}

export function AdminLogsPage() {
  const [from, setFrom] = React.useState('')
  const [to, setTo] = React.useState('')
  const [userId, setUserId] = React.useState('')
  const [instanceId, setInstanceId] = React.useState('')
  const [direction, setDirection] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [auditAction, setAuditAction] = React.useState('')
  const [metaOpen, setMetaOpen] = React.useState(false)
  const [metaLog, setMetaLog] = React.useState<MessageLog | null>(null)

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
    queryKey: ['admin', 'instances', 'options'],
    queryFn: async () => {
      const { data } = await api.get('/instances')
      return (data as Array<{ id: string; instanceName: string }>).map((i) => ({
        id: i.id,
        instanceName: i.instanceName,
      })) as InstanceOption[]
    },
  })

  const messageLogs = useQuery({
    queryKey: ['admin', 'logs', { from, to, userId, instanceId, direction, status }],
    queryFn: async () => {
      const { data } = await api.get('/logs', {
        params: {
          from: from || undefined,
          to: to || undefined,
          userId: userId || undefined,
          instanceId: instanceId || undefined,
          direction: direction || undefined,
          status: status || undefined,
        },
      })
      return data as MessageLog[]
    },
  })

  const auditLogs = useQuery({
    queryKey: ['admin', 'audit', { from, to, userId, auditAction }],
    queryFn: async () => {
      const { data } = await api.get('/logs/audit', {
        params: {
          from: from || undefined,
          to: to || undefined,
          userId: userId || undefined,
          action: auditAction || undefined,
        },
      })
      return data as AuditLog[]
    },
  })

  return (
    <div className="space-y-6">
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-gradient-to-br from-[#071418] via-[#071418] to-[#0F5739]/30 p-6 md:flex-row md:items-center md:justify-between">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#45C9A4] via-[#52C9EB] to-[#46B5A9]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#52C9EB]/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#45C9A4]/10 blur-2xl" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">Logs</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-white/70">
            MessageLog (envio/recebimento/erros) e AuditLog (ações administrativas). Use filtros para investigar incidentes.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-[#3D8E66]/25">
        <CardHeader className="bg-gradient-to-r from-[#071418]/10 via-transparent to-[#0F5739]/10">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Data inicial (ISO)</label>
              <Input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="2026-05-01T00:00:00Z"
                className="focus-visible:ring-[#52C9EB]/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Data final (ISO)</label>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="2026-05-09T23:59:59Z"
                className="focus-visible:ring-[#52C9EB]/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Usuário</label>
              <Select value={userId} onChange={(e) => setUserId(e.target.value)} className="focus-visible:ring-[#52C9EB]/40">
                <option value="">Todos</option>
                {(users.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                className="border-[#3D8E66]/40 bg-transparent hover:bg-[#79D6BB]/10"
                onClick={() => {
                  setFrom('')
                  setTo('')
                  setUserId('')
                  setInstanceId('')
                  setDirection('')
                  setStatus('')
                  setAuditAction('')
                }}
              >
                Limpar
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Instância</label>
              <Select value={instanceId} onChange={(e) => setInstanceId(e.target.value)} className="focus-visible:ring-[#52C9EB]/40">
                <option value="">Todas</option>
                {(instances.data ?? []).map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.instanceName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Direção</label>
              <Select value={direction} onChange={(e) => setDirection(e.target.value)} className="focus-visible:ring-[#52C9EB]/40">
                <option value="">Todas</option>
                <option value="INBOUND">INBOUND</option>
                <option value="OUTBOUND">OUTBOUND</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Status (MessageLog)</label>
              <Input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="SUCCESS / ERROR / ..."
                className="focus-visible:ring-[#52C9EB]/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Ação (AuditLog)</label>
              <Input
                value={auditAction}
                onChange={(e) => setAuditAction(e.target.value)}
                placeholder="ADMIN_USER_CREATE"
                className="focus-visible:ring-[#52C9EB]/40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[#3D8E66]/25">
        <CardHeader className="flex flex-col gap-2 bg-gradient-to-r from-[#071418]/10 via-transparent to-[#0F5739]/10 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>MessageLog</CardTitle>
          <div className="text-sm text-muted-foreground">
            {messageLogs.isPending ? 'Carregando…' : `${messageLogs.data?.length ?? 0} itens`}
          </div>
        </CardHeader>
        <CardContent>
          {messageLogs.isError ? <div className="text-sm text-destructive">{getErrorMessage(messageLogs.error)}</div> : null}

          {!messageLogs.isPending && (messageLogs.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ListX className="h-6 w-6" />}
              title="Nenhum log encontrado"
              description="Ajuste os filtros (datas, direção, status) para visualizar eventos."
              className="border-[#3D8E66]/25 bg-gradient-to-br from-[#071418]/5 via-transparent to-[#0F5739]/10"
            />
          ) : (
            <div className="mt-2 overflow-x-auto rounded-xl border border-border/70 bg-background/30">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#071418]/5 via-transparent to-[#0F5739]/10">
                  <TableHead className="w-[170px]">Quando</TableHead>
                  <TableHead className="w-[240px]">Usuário</TableHead>
                  <TableHead className="w-[220px]">Instância</TableHead>
                  <TableHead className="w-[260px]">Contato</TableHead>
                  <TableHead className="w-[110px]">Direção</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[160px]">Erro</TableHead>
                  <TableHead className="w-[110px] sticky right-0 z-20 border-l bg-card/95">Meta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(messageLogs.data ?? []).map((l) => (
                    <TableRow key={l.id} className="hover:bg-[#79D6BB]/10">
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{formatDateTime(l.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[240px] truncate" title={l.user?.email ?? l.userId}>
                      {l.user?.email ?? l.userId}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[220px] truncate" title={l.instance?.instanceName ?? l.instanceId ?? '—'}>
                      {l.instance?.instanceName ?? l.instanceId ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[260px] truncate" title={l.contact ? `${l.contact.name} · ${l.contact.phone}` : l.contactId ?? '—'}>
                      {l.contact ? `${l.contact.name} · ${l.contact.phone}` : l.contactId ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.direction}</Badge>
                    </TableCell>
                    <TableCell>{statusBadge(l.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.errorType || l.errorMessage ? (
                        <span className="block max-w-[160px] truncate" title={l.errorMessage ?? ''}>
                          {l.errorType ?? 'ERROR'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 border-l bg-card/95">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMetaLog(l)
                          setMetaOpen(true)
                        }}
                        disabled={!l.meta}
                        title={!l.meta ? 'Sem meta' : 'Ver meta'}
                        className="border-[#3D8E66]/40 bg-transparent hover:bg-[#79D6BB]/10"
                      >
                        Meta
                      </Button>
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={metaOpen} onOpenChange={setMetaOpen}>
        <DialogContent
          title={metaLog ? `MessageLog.meta · ${metaLog.id}` : 'MessageLog.meta'}
          description="Meta salva no MessageLog para auditoria (pode conter templateOriginal/renderedText/dynamicGroups/warnings/errors)."
          className="max-w-4xl"
        >
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[#3D8E66]/20 bg-gradient-to-br from-[#071418]/40 via-black/20 to-[#0F5739]/20 p-3 text-xs text-muted-foreground">
            {metaLog?.meta ? JSON.stringify(metaLog.meta, null, 2) : '—'}
          </pre>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border-[#3D8E66]/25">
        <CardHeader className="flex flex-col gap-2 bg-gradient-to-r from-[#071418]/10 via-transparent to-[#0F5739]/10 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>AuditLog</CardTitle>
          <div className="text-sm text-muted-foreground">{auditLogs.isPending ? 'Carregando…' : `${auditLogs.data?.length ?? 0} itens`}</div>
        </CardHeader>
        <CardContent>
          {auditLogs.isError ? <div className="text-sm text-destructive">{getErrorMessage(auditLogs.error)}</div> : null}

          {!auditLogs.isPending && (auditLogs.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ListX className="h-6 w-6" />}
              title="Nenhum audit log encontrado"
              description="Ajuste o filtro de ação (ex.: ADMIN_USER_CREATE) ou o intervalo de datas."
              className="border-[#3D8E66]/25 bg-gradient-to-br from-[#071418]/5 via-transparent to-[#0F5739]/10"
            />
          ) : (
            <div className="mt-2 overflow-x-auto rounded-xl border border-border/70 bg-background/30">
              <Table className="min-w-[980px]">
                <colgroup>
                  <col className="w-[16%]" />
                  <col className="w-[22%]" />
                  <col className="w-[20%]" />
                  <col className="w-[28%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#071418]/5 via-transparent to-[#0F5739]/10">
                    <TableHead>Quando</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(auditLogs.data ?? []).map((a) => (
                    <TableRow key={a.id} className="hover:bg-[#79D6BB]/10">
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{formatDateTime(a.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[260px] truncate" title={a.user?.email ?? a.userId ?? '—'}>
                      {a.user?.email ?? a.userId ?? '—'}
                    </TableCell>
                    <TableCell className="font-medium max-w-[220px] truncate" title={a.action}>
                      {a.action}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate" title={a.entity ? `${a.entity}${a.entityId ? `#${a.entityId}` : ''}` : '—'}>
                      {a.entity ? `${a.entity}${a.entityId ? `#${a.entityId}` : ''}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{a.ipAddress ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
