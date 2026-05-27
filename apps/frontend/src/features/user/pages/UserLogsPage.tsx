import { useQuery } from '@tanstack/react-query'
import * as React from 'react'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { getErrorMessage } from '@/lib/http'

type MessageLog = {
  id: string
  instanceId: string | null
  contactId: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  status: string
  errorType: string | null
  errorMessage: string | null
  createdAt: string
  instance?: { instanceName: string | null }
  contact?: { name: string; phone: string }
}

type AuditLog = {
  id: string
  action: string
  entity: string | null
  entityId: string | null
  createdAt: string
}

type InstanceOption = { id: string; instanceName: string }

function statusBadge(status: string) {
  if (status === 'SUCCESS' || status === 'SENT' || status === 'RECEIVED') return <Badge variant="success">{status}</Badge>
  if (status === 'PENDING') return <Badge variant="warning">PENDING</Badge>
  return <Badge variant="destructive">{status}</Badge>
}

export function UserLogsPage() {
  const [from, setFrom] = React.useState('')
  const [to, setTo] = React.useState('')
  const [instanceId, setInstanceId] = React.useState('')
  const [direction, setDirection] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [auditAction, setAuditAction] = React.useState('')

  const instances = useQuery({
    queryKey: ['user', 'instances', 'options'],
    queryFn: async () => {
      const { data } = await api.get('/instances')
      return (data as Array<{ id: string; instanceName: string }>).map((i) => ({
        id: i.id,
        instanceName: i.instanceName,
      })) as InstanceOption[]
    },
  })

  const messageLogs = useQuery({
    queryKey: ['user', 'logs', { from, to, instanceId, direction, status }],
    queryFn: async () => {
      const { data } = await api.get('/logs', {
        params: {
          from: from || undefined,
          to: to || undefined,
          instanceId: instanceId || undefined,
          direction: direction || undefined,
          status: status || undefined,
        },
      })
      return data as MessageLog[]
    },
  })

  const auditLogs = useQuery({
    queryKey: ['user', 'audit', { from, to, auditAction }],
    queryFn: async () => {
      const { data } = await api.get('/logs/audit', {
        params: {
          from: from || undefined,
          to: to || undefined,
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
          <p className="text-sm text-white/70">Logs das suas instâncias e ações da sua conta.</p>
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
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                className="border-[#3D8E66]/40 bg-transparent hover:bg-[#79D6BB]/10"
                onClick={() => {
                  setFrom('')
                  setTo('')
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

          <div className="mt-4 grid gap-3 md:grid-cols-3">
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
                placeholder="USER_INSTANCE_CREATE"
                className="focus-visible:ring-[#52C9EB]/40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[#3D8E66]/25">
        <CardHeader className="flex-row items-center justify-between space-y-0 bg-gradient-to-r from-[#071418]/10 via-transparent to-[#0F5739]/10">
          <CardTitle>MessageLog</CardTitle>
          <div className="text-sm text-muted-foreground">{messageLogs.isPending ? 'Carregando…' : `${messageLogs.data?.length ?? 0} itens`}</div>
        </CardHeader>
        <CardContent>
          {messageLogs.isError ? <div className="text-sm text-destructive">{getErrorMessage(messageLogs.error)}</div> : null}

          <div className="mt-2 overflow-x-auto rounded-xl border border-border/70 bg-background/30">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#071418]/5 via-transparent to-[#0F5739]/10">
                <TableHead>Quando</TableHead>
                <TableHead>Instância</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Direção</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(messageLogs.data ?? []).map((l) => (
                  <TableRow key={l.id} className="hover:bg-[#79D6BB]/10">
                  <TableCell className="text-muted-foreground">{formatDateTime(l.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{l.instance?.instanceName ?? l.instanceId ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {l.contact ? `${l.contact.name} · ${l.contact.phone}` : l.contactId ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{l.direction}</Badge>
                  </TableCell>
                  <TableCell>{statusBadge(l.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{l.errorType || l.errorMessage ? (l.errorType ?? 'ERROR') : '—'}</TableCell>
                  </TableRow>
                ))}
                {!messageLogs.isPending && (messageLogs.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum log encontrado.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-[#3D8E66]/25">
        <CardHeader className="flex-row items-center justify-between space-y-0 bg-gradient-to-r from-[#071418]/10 via-transparent to-[#0F5739]/10">
          <CardTitle>AuditLog</CardTitle>
          <div className="text-sm text-muted-foreground">{auditLogs.isPending ? 'Carregando…' : `${auditLogs.data?.length ?? 0} itens`}</div>
        </CardHeader>
        <CardContent>
          {auditLogs.isError ? <div className="text-sm text-destructive">{getErrorMessage(auditLogs.error)}</div> : null}

          <div className="mt-2 overflow-x-auto rounded-xl border border-border/70 bg-background/30">
            <Table className="min-w-[540px]">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-[#071418]/5 via-transparent to-[#0F5739]/10">
                <TableHead>Quando</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(auditLogs.data ?? []).map((a) => (
                  <TableRow key={a.id} className="hover:bg-[#79D6BB]/10">
                  <TableCell className="text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                  <TableCell className="font-medium">{a.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.entity ? `${a.entity}${a.entityId ? `#${a.entityId}` : ''}` : '—'}
                  </TableCell>
                  </TableRow>
                ))}
                {!auditLogs.isPending && (auditLogs.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum audit log encontrado.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
