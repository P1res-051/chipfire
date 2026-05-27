import { Activity, AlertTriangle, Boxes, CheckCircle2, Info, MessageSquareText, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'

type MetricCardProps = {
  title: string
  value: React.ReactNode
  detail: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

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

  const health = (() => {
    if (dashboard.isPending) return { display: '…', label: '', variant: 'outline' as const, title: '' }
    const d = dashboard.data
    if (!d) return { display: 'N/A', label: 'Métrica em consolidação', variant: 'outline' as const, title: tooltipText }

    const hasSignal = (d.connectedInstances ?? 0) > 0 || (d.messagesSentToday ?? 0) > 0 || (d.messagesReceivedToday ?? 0) > 0
    const raw = d.healthAverage

    // Se o backend ainda não consolidou a métrica (0%), não mostrar como erro visual.
    if (!raw || raw <= 0) {
      if (!hasSignal) return { display: 'N/A', label: 'Métrica em consolidação', variant: 'outline' as const, title: tooltipText }

      // Estimativa simples (somente UI) baseada em sinais já existentes no dashboard.
      let score = 0
      if ((d.connectedInstances ?? 0) > 0) score += 40
      if ((d.messagesSentToday ?? 0) > 0 && (d.errorsToday ?? 0) === 0) score += 20
      if ((d.messagesReceivedToday ?? 0) > 0) score += 20
      if ((d.errorsToday ?? 0) === 0) score += 10
      if ((d.optOutContacts ?? 0) === 0) score += 10

      return { display: `${score}%`, label: `${classify(score)} (estimado)`, variant: badgeVariant(score), title: tooltipText }
    }

    const score = Math.max(0, Math.min(100, Math.round(raw)))
    return { display: `${score}%`, label: classify(score), variant: badgeVariant(score), title: tooltipText }
  })()

  const attentionItems = dashboard.data
    ? [
        {
          label: 'Instâncias desconectadas',
          value: dashboard.data.disconnectedInstances ?? 0,
          tone: (dashboard.data.disconnectedInstances ?? 0) > 0 ? 'warning' : 'success',
        },
        {
          label: 'Erros hoje',
          value: dashboard.data.errorsToday ?? 0,
          tone: (dashboard.data.errorsToday ?? 0) > 0 ? 'danger' : 'success',
        },
        {
          label: 'Campanhas ativas',
          value: dashboard.data.campaignsActive ?? 0,
          tone: (dashboard.data.campaignsActive ?? 0) > 0 ? 'default' : 'warning',
        },
      ]
    : []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/80 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Operação</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão global de operação: contatos autorizados, instâncias, mensagens e saúde.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusPill />
          <Badge variant={dashboard.isPending ? 'outline' : 'default'}>
            {dashboard.isPending ? 'Atualizando...' : 'Tempo real'}
          </Badge>
        </div>
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

        <MetricCard
          title="Usuários"
          value={dashboard.isPending ? '…' : dashboard.data?.totalUsers ?? 0}
          detail={dashboard.isPending ? 'Carregando...' : `${dashboard.data?.activeUsers ?? 0} ativos`}
          icon={Users}
        />

        <MetricCard
          title="Instâncias"
          value={dashboard.isPending ? '…' : dashboard.data?.totalInstances ?? 0}
          detail={dashboard.isPending ? 'Carregando...' : `${dashboard.data?.connectedInstances ?? 0} conectadas`}
          icon={Boxes}
          tone={(dashboard.data?.connectedInstances ?? 0) > 0 ? 'success' : 'warning'}
        />

        <MetricCard
          title="Mensagens hoje"
          value={
            dashboard.isPending
              ? '…'
              : (dashboard.data?.messagesSentToday ?? 0) + (dashboard.data?.messagesReceivedToday ?? 0)
          }
          detail={
            dashboard.isPending
              ? 'Carregando...'
              : `${dashboard.data?.messagesSentToday ?? 0} enviadas · ${dashboard.data?.messagesReceivedToday ?? 0} recebidas`
          }
          icon={MessageSquareText}
        />

        <MetricCard
          title="Saúde operacional"
          value={health.display}
          detail={
            <span className="inline-flex items-center gap-1">
              {health.label || 'Calculando'}
              <Info className="h-3.5 w-3.5 opacity-70" />
            </span>
          }
          icon={Activity}
          tone={health.variant === 'success' ? 'success' : health.variant === 'warning' ? 'warning' : 'default'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atenção agora</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {dashboard.isPending ? (
            <div className="text-sm text-muted-foreground md:col-span-3">Carregando sinais operacionais...</div>
          ) : (
            attentionItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md border border-border/70 bg-background/55 px-4 py-3">
                <div className="flex items-center gap-2">
                  {item.tone === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className={item.tone === 'danger' ? 'h-4 w-4 text-destructive' : 'h-4 w-4 text-warning'} />
                  )}
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ title, value, detail, icon: Icon, tone = 'default' }: MetricCardProps) {
  const toneClass = {
    default: 'bg-secondary text-muted-foreground',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
  }[tone]

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-muted-foreground">{title}</div>
          <span className={`flex h-8 w-8 items-center justify-center rounded-md ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
        </div>
      </CardContent>
    </Card>
  )
}

const tooltipText =
  'A saúde operacional considera conexão, erros, atividade e respostas. Será calculada após dados suficientes.'

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
