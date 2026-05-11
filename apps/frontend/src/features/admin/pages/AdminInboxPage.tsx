import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import * as React from 'react'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

import { ConversationList } from '../components/ConversationList'
import { ConversationDetail } from '../components/ConversationDetail'
import { ConversationFilters } from '../components/ConversationFilters'

type Conversation = {
  id: string
  contactId: string
  instanceId: string
  contact: {
    id: string
    name: string
    phone: string
    tag: string | null
    status: string
    optIn: boolean
    optOutAt: string | null
    userId: string
  }
  instance: {
    id: string
    instanceName: string
    phoneNumber: string | null
    status: string
    userId: string
    user: {
      id: string
      name: string
      email: string
    }
  }
  lastMessageAt: string | null
  lastMessage: {
    text: string | null
    type: string
    direction: string
    createdAt: string
  } | null
  createdAt: string
  updatedAt: string
}

export function AdminInboxPage() {
  const qc = useQueryClient()
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null)

  const [filters, setFilters] = React.useState({
    userId: '',
    instanceId: '',
    search: '',
    status: '',
  })

  // Buscar conversas
  const conversationsQuery = useQuery({
    queryKey: ['admin', 'conversations', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.instanceId) params.append('instanceId', filters.instanceId)
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)

      const { data } = await api.get(`/conversations?${params.toString()}`)
      return data as {
        items: Conversation[]
        total: number
      }
    },
  })

  const selectedConversation = conversationsQuery.data?.items.find(
    (c) => c.id === selectedConversationId,
  ) || null

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-4">
      {/* Sidebar */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-semibold">Inbox</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-muted-foreground">
            Conversas e histórico de mensagens
          </p>
        </div>

        {/* Filtros */}
        <ConversationFilters
          filters={filters}
          onFiltersChange={setFilters}
          isLoading={conversationsQuery.isPending}
        />

        {/* Lista de Conversas */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Conversas</CardTitle>
            <div className="text-xs text-muted-foreground">
              {conversationsQuery.isPending ? 'Carregando…' : `${conversationsQuery.data?.total || 0}`}
            </div>
          </CardHeader>
          <CardContent>
            <ConversationList
              conversations={conversationsQuery.data?.items || []}
              isLoading={conversationsQuery.isPending}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div>
        {selectedConversation ? (
          <ConversationDetail
            conversation={selectedConversation}
            onOptOut={() => {
              qc.invalidateQueries({ queryKey: ['admin', 'conversations'] })
              setSelectedConversationId(null)
            }}
          />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Selecione uma conversa para ver o histórico</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
