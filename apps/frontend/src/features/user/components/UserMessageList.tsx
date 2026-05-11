import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowDown, ArrowUp, Image, Music, Video, File } from 'lucide-react'

type Message = {
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
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

function getMessageIcon(type: string) {
  switch (type) {
    case 'IMAGE':
      return <Image className="h-4 w-4" />
    case 'VIDEO':
      return <Video className="h-4 w-4" />
    case 'AUDIO':
      return <Music className="h-4 w-4" />
    case 'DOCUMENT':
      return <File className="h-4 w-4" />
    default:
      return null
  }
}

function getMessageLabel(type: string) {
  switch (type) {
    case 'IMAGE':
      return '[Imagem]'
    case 'VIDEO':
      return '[Vídeo]'
    case 'AUDIO':
      return '[Áudio]'
    case 'DOCUMENT':
      return '[Documento]'
    case 'STICKER':
      return '[Adesivo]'
    case 'TEXT':
      return null
    default:
      return `[${type}]`
  }
}

function getRelativeTime(date: string) {
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: false,
      locale: ptBR,
    })
  } catch {
    return '—'
  }
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma mensagem</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-3">
      {messages.map((msg) => {
        const isOutbound = msg.direction === 'OUTBOUND'
        const msgLabel = getMessageLabel(msg.type)
        const msgIcon = getMessageIcon(msg.type)

        return (
          <div
            key={msg.id}
            className={`flex gap-2 ${isOutbound ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-2 max-w-xs p-3 rounded-lg ${
                isOutbound
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <div className="flex-1 text-sm">
                {msg.text && <p className="break-words">{msg.text}</p>}
                {msgLabel && (
                  <div className="flex items-center gap-1 mt-1">
                    {msgIcon}
                    <span className="text-xs opacity-80">{msgLabel}</span>
                  </div>
                )}
              </div>
            </div>
            <div className={`flex flex-col items-${isOutbound ? 'end' : 'start'} gap-1`}>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {isOutbound ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span>{getRelativeTime(msg.createdAt)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
