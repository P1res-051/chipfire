import { useMutation, useQuery } from '@tanstack/react-query'
import { Phone, ShieldOff, AlertCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'

import { MessageList } from './MessageList'

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
  createdAt: string
}

interface ConversationDetailProps {
  conversation: Conversation
  onOptOut: () => void
}

export function ConversationDetail({
  conversation,
  onOptOut,
}: ConversationDetailProps) {
  const { toast } = useToast()

  // Buscar mensagens
  const messagesQuery = useQuery({
    queryKey: ['admin', 'conversation', conversation.id, 'messages'],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversation.id}/messages`)
      return data as {
        items: Array<{
          id: string
          text: string | null
          type: string
          direction: string
          createdAt: string
          contact: {
            id: string
            name: string
            phone: string
          }
        }>
        total: number
      }
    },
  })

  // Marcar opt-out
  const optoutMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/conversations/${conversation.id}/optout`)
    },
    onSuccess: () => {
      toast({
        title: 'Contato marcado como opt-out',
        variant: 'success',
      })
      onOptOut()
    },
    onError: (error) => {
      toast({
        title: 'Erro ao marcar opt-out',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  const isOptOut = conversation.contact.status === 'OPTOUT'
  const isBlocked = conversation.contact.status === 'INACTIVE'

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle>{conversation.contact.name}</CardTitle>
                <Badge
                  variant={isOptOut ? 'destructive' : 'outline'}
                  className={
                    isBlocked ? 'bg-orange-500/20 text-orange-600' : undefined
                  }
                >
                  {isOptOut ? 'OPT-OUT' : isBlocked ? 'BLOQUEADO' : 'ATIVO'}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="font-mono">{conversation.contact.phone}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {conversation.contact.tag && `Tag: ${conversation.contact.tag}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Instância: {conversation.instance.instanceName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Usuário: {conversation.instance.user.name}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!isOptOut && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        'Tem certeza que deseja marcar como opt-out? O contato não receberá mais mensagens.',
                      )
                    ) {
                      optoutMutation.mutate()
                    }
                  }}
                  disabled={optoutMutation.isPending}
                  title="Marcar como opt-out"
                >
                  <ShieldOff className="h-4 w-4 mr-1" />
                  Opt-out
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Avisos */}
      {isOptOut && (
        <div className="flex gap-2 items-start p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div className="text-sm text-red-600">
            <p className="font-medium">Contato com opt-out ativo</p>
            <p className="text-xs opacity-80">
              Desde {new Date(conversation.contact.optOutAt!).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      )}

      {!conversation.contact.optIn && (
        <div className="flex gap-2 items-start p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
          <div className="text-sm text-orange-600">
            <p className="font-medium">Sem opt-in confirmado</p>
            <p className="text-xs opacity-80">
              O contato não confirmou autorização para receber mensagens
            </p>
          </div>
        </div>
      )}

      {/* Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Histórico ({messagesQuery.data?.total || 0} mensagens)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MessageList
            messages={messagesQuery.data?.items || []}
            isLoading={messagesQuery.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
