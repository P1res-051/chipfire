import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Megaphone, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/EmptyState'
import { api } from '@/lib/api'
import { CampaignList } from '../components/campaigns/CampaignList'
import { CampaignDetail } from '../components/campaigns/CampaignDetail'
import { CreateCampaignDialog } from '../components/campaigns/CreateCampaignDialog'

interface Campaign {
  id: string
  name: string
  description?: string
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FINISHED'
  contactCount: number
  instanceCount: number
  sentCount: number
  errorCount: number
  createdAt: string
}

interface ListResponse {
  items: Campaign[]
  total: number
  limit: number
  offset: number
}

export function AdminCampaignsPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Listar campanhas
  const campaignsQuery = useQuery({
    queryKey: ['campaigns', searchTerm],
    queryFn: async () => {
      const { data } = await api.get('/campaigns', {
        params: { limit: 100 },
      })
      return data as ListResponse
    },
  })

  const campaigns = campaignsQuery.data?.items || []
  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Campanhas</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Disparos, segmentação e execução de campanhas WhatsApp.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Lista lateral */}
        <div className="space-y-4">
          <Input
            placeholder="Buscar campanha…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          {campaignsQuery.isLoading ? (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : filteredCampaigns.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="h-6 w-6" />}
              title="Nenhuma campanha encontrada"
              description="Crie sua primeira campanha e valide a simulação antes de executar."
              primaryAction={{ label: 'Nova Campanha', onClick: () => setIsCreateDialogOpen(true) }}
            />
          ) : (
            <CampaignList
              campaigns={filteredCampaigns}
              selectedId={selectedCampaignId}
              onSelect={setSelectedCampaignId}
            />
          )}
        </div>

        {/* Detalhe ou vazio */}
        <div>
          {selectedCampaign ? (
            <CampaignDetail
              campaign={selectedCampaign}
              campaignId={selectedCampaignId!}
              onCampaignUpdate={() => campaignsQuery.refetch()}
            />
          ) : (
            <EmptyState
              icon={<Megaphone className="h-6 w-6" />}
              title="Selecione uma campanha"
              description="Escolha uma campanha na lista ao lado para ver detalhes, simulação e status."
              primaryAction={{ label: 'Nova Campanha', onClick: () => setIsCreateDialogOpen(true) }}
              secondaryAction={{ label: 'Limpar busca', onClick: () => setSearchTerm(''), variant: 'outline' }}
            />
          )}
        </div>
      </div>

      {/* Dialog para criar campanha */}
      <CreateCampaignDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          campaignsQuery.refetch()
        }}
      />
    </div>
  )
}
