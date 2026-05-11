import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MessageCircle, Phone } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Conversation = {
  id: string
  contact: {
    id: string
    name: string
    phone: string
    tag: string | null
    status: string
  }
  instance: {
    instanceName: string
    phoneNumber: string | null
  }
  lastMessageAt: string | null
  lastMessage: {
    text: string | null
    type: string
    direction: string
    createdAt: string
  } | null
}

interface ConversationListProps {
  conversations: Conversation[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500/20 text-green-600'
    case 'INACTIVE':
      return 'bg-gray-500/20 text-gray-600'
    case 'OPTOUT':
      return 'bg-red-500/20 text-red-600'
    default:
      return 'bg-gray-500/20 text-gray-600'
  }
}

function getLastMessagePreview(message: Conversation['lastMessage'] | null) {
  if (!message) return 'Sem mensagens'

  const direction = message.direction === 'INBOUND' ? '← ' : '→ '

  if (message.type !== 'TEXT') {
    return `${direction}[${message.type}]`
  }

  const text = message.text || '(mensagem vazia)'
  return `${direction}${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`
}

function getRelativeTime(date: string | null) {
  if (!date) return '—'
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR,
    })
  } catch {
    return '—'
  }
}

export function ConversationList({
  conversations,
  isLoading,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="py-8 text-center">
        <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-xs text-muted-foreground">Nenhuma conversa</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <Button
          key={conv.id}
          variant={selectedId === conv.id ? 'default' : 'outline'}
          className="w-full h-auto justify-start p-3 text-left"
          onClick={() => onSelect(conv.id)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium truncate">{conv.contact.name}</span>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${getStatusColor(conv.contact.status)}`}
              >
                {conv.contact.status === 'OPTOUT' ? 'OPT-OUT' : conv.contact.status.substring(0, 3)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Phone className="h-3 w-3" />
              <span className="font-mono">{conv.contact.phone}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {getLastMessagePreview(conv.lastMessage)}
            </p>
            {conv.lastMessageAt && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                {getRelativeTime(conv.lastMessageAt)}
              </p>
            )}
          </div>
        </Button>
      ))}
    </div>
  )
}
