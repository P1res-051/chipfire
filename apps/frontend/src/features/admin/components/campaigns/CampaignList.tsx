import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Campaign {
  id: string
  name: string
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FINISHED'
  sentCount: number
  errorCount: number
}

interface CampaignListProps {
  campaigns: Campaign[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function getStatusBadge(status: Campaign['status']) {
  const variants: Record<Campaign['status'], string> = {
    DRAFT: 'bg-slate-500 text-white',
    ACTIVE: 'bg-green-600 text-white',
    PAUSED: 'bg-yellow-600 text-white',
    FINISHED: 'bg-slate-700 text-white',
  }

  const labels: Record<Campaign['status'], string> = {
    DRAFT: 'Rascunho',
    ACTIVE: 'Ativa',
    PAUSED: 'Pausada',
    FINISHED: 'Finalizada',
  }

  return (
    <Badge className={variants[status]}>
      {labels[status]}
    </Badge>
  )
}

export function CampaignList({
  campaigns,
  selectedId,
  onSelect,
}: CampaignListProps) {
  return (
    <div className="space-y-2">
      {campaigns.map(campaign => (
        <Button
          key={campaign.id}
          variant={selectedId === campaign.id ? 'default' : 'outline'}
          className="w-full h-auto justify-start p-3 text-left"
          onClick={() => onSelect(campaign.id)}
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{campaign.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {campaign.sentCount} enviadas
              </span>
              {campaign.errorCount > 0 && (
                <span className="text-xs text-red-500">
                  {campaign.errorCount} erros
                </span>
              )}
            </div>
            <div className="mt-2">
              {getStatusBadge(campaign.status)}
            </div>
          </div>
        </Button>
      ))}
    </div>
  )
}
