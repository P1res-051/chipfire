import { Activity, MessageSquareText, QrCode } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'

export function UserDashboard() {
  const dashboard = useQuery({
    queryKey: ['user', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/user')
      return data as {
        myInstances: number
        connectedInstances: number
        messagesSentToday: number
        messagesReceivedToday: number
        errorsToday: number
        optOutsToday: number
        healthAverage: number
      }
    },
    staleTime: 15_000,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">Meu Dashboard</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas instâncias, inbox e saúde operacional.
          </p>
        </div>
        <Button asChild>
          <Link to="/user/instances">
            <QrCode />
            Nova Instância
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboard.isError ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Falha ao carregar dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-destructive">{getErrorMessage(dashboard.error)}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Instâncias</CardTitle>
            <Activity className="text-neon-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {dashboard.isPending ? '…' : dashboard.data?.myInstances ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
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
