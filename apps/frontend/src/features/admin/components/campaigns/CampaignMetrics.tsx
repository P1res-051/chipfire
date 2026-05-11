import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MessageLog {
  id: string
  status: 'SUCCESS' | 'ERROR'
  errorType?: string | null
  createdAt: string
}

interface CampaignMetricsProps {
  metrics: {
    campaignId: string
    name: string
    status: string
    totalContacts: number
    sent: number
    failed: number
    pending: number
    errorRate: number
    logs: MessageLog[]
  }
}

export function CampaignMetrics({ metrics }: CampaignMetricsProps) {
  const successRate = Math.round((metrics.sent / metrics.totalContacts) * 100) || 0
  const pendingRate = Math.round((metrics.pending / metrics.totalContacts) * 100) || 0

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Progresso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Success Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Enviadas</span>
              <span className="font-semibold text-green-600">
                {metrics.sent} ({successRate}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-full transition-all"
                style={{
                  width: `${(metrics.sent / metrics.totalContacts) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Pending Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Pendentes</span>
              <span className="font-semibold text-blue-600">
                {metrics.pending} ({pendingRate}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all"
                style={{
                  width: `${(metrics.pending / metrics.totalContacts) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Error Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Erros</span>
              <span className="font-semibold text-red-600">
                {metrics.failed} ({metrics.errorRate}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-600 h-full transition-all"
                style={{
                  width: `${(metrics.failed / metrics.totalContacts) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="pt-2 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold">{metrics.totalContacts}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Taxa Sucesso</p>
              <p className="font-semibold text-green-600">{successRate}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Taxa Erro</p>
              <p className="font-semibold text-red-600">{metrics.errorRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Últimas Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {metrics.logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma mensagem registrada</p>
            ) : (
              metrics.logs.map(log => (
                <div key={log.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      log.status === 'SUCCESS' ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">
                      {log.status === 'SUCCESS' ? 'Enviada' : 'Erro'}
                    </span>
                    {log.errorType && (
                      <span className="text-muted-foreground ml-1">
                        ({log.errorType})
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
