import { Activity, Boxes, MessageSquareText, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'

export function AdminDashboard() {
  const dashboard = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/admin')
      return data as {
        totalUsers: number
        activeUsers: number
        totalInstances: number
        connectedInstances: number
        disconnectedInstances: number
        totalContacts: number
        optOutContacts: number
        messagesSentToday: number
        messagesReceivedToday: number
        errorsToday: number
        campaignsActive: number
        healthAverage: number
      }
    },
    staleTime: 15_000,
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Dashboard Admin</h1>
          <ApiStatusPill />
        </div>
        <p className="text-sm text-muted-foreground">
          Visão global de operação (contatos autorizados, instâncias e mensagens).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboard.isError ? (
          <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader>
              <CardTitle>Falha ao carregar dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-destructive">{getErrorMessage(dashboard.error)}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Total de usuários</CardTitle>
            <Users className="text-neon-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {dashboard.isPending ? '…' : dashboard.data?.totalUsers ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Ativos / Inativos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.isPending ? '…' : `${dashboard.data?.activeUsers ?? 0} ativos`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Total de instâncias</CardTitle>
            <Boxes className="text-neon-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {dashboard.isPending ? '…' : dashboard.data?.totalInstances ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Online / Offline</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.isPending ? '…' : `${dashboard.data?.connectedInstances ?? 0} conectadas`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Mensagens hoje</CardTitle>
            <MessageSquareText className="text-neon-green" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {dashboard.isPending
                ? '…'
                : (dashboard.data?.messagesSentToday ?? 0) +
                  (dashboard.data?.messagesReceivedToday ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.isPending
                ? '…'
                : `${dashboard.data?.messagesSentToday ?? 0} enviadas · ${dashboard.data?.messagesReceivedToday ?? 0} recebidas`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Saúde Operacional</CardTitle>
            <Activity className="text-neon-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {dashboard.isPending ? '…' : `${dashboard.data?.healthAverage ?? 0}%`}
            </div>
            <p className="text-xs text-muted-foreground">Média de Saúde Operacional (0–100)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
