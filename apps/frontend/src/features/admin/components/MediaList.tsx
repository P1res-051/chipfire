import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, Eye, Trash2, FileText, Image, Music, Video, FileIcon } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'

import { CopyVariableButton } from './CopyVariableButton'
import { MediaPreviewDialog } from './MediaPreviewDialog'

type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT' | 'TEXT'

type Media = {
  id: string
  userId: string
  name: string
  slug: string
  type: MediaType
  filePath: string | null
  publicUrl: string | null
  mimeType: string | null
  size: number | null
  tags: string[]
  variable: string
  createdAt: string
  updatedAt: string
}

interface MediaListProps {
  media: Media[]
  isLoading: boolean
}

function getMediaIcon(type: MediaType) {
  switch (type) {
    case 'IMAGE':
      return <Image className="h-4 w-4" />
    case 'VIDEO':
      return <Video className="h-4 w-4" />
    case 'AUDIO':
      return <Music className="h-4 w-4" />
    case 'PDF':
    case 'DOCUMENT':
      return <FileIcon className="h-4 w-4" />
    case 'TEXT':
      return <FileText className="h-4 w-4" />
    default:
      return <FileIcon className="h-4 w-4" />
  }
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function MediaList({ media, isLoading }: MediaListProps) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewMedia, setPreviewMedia] = React.useState<Media | null>(null)

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/media/${id}`)
    },
    onSuccess: () => {
      toast({ title: 'Mídia deletada', variant: 'success' })
      qc.invalidateQueries({ queryKey: ['admin', 'media'] })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao deletar mídia',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  const handlePreview = (m: Media) => {
    setPreviewMedia(m)
    setPreviewOpen(true)
  }

  const handleDownload = (m: Media) => {
    if (m.publicUrl) {
      window.open(m.publicUrl, '_blank')
    } else {
      toast({
        title: 'Aviso',
        description: 'Este arquivo não tem URL pública',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">Nenhuma mídia cadastrada</p>
        <p className="text-xs text-muted-foreground">Comece fazendo upload de um arquivo ou criando um texto</p>
      </div>
    )
  }

  return (
    <>
      <Table className="mt-4 min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Nome</TableHead>
              <TableHead className="w-[140px]">Tipo</TableHead>
              <TableHead className="w-[220px]">Slug</TableHead>
              <TableHead className="w-[220px]">Tags</TableHead>
              <TableHead className="w-[110px]">Tamanho</TableHead>
              <TableHead className="w-[240px]">Variável</TableHead>
              <TableHead className="w-[160px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {media.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium max-w-[280px] truncate" title={m.name}>
                  {m.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="flex w-fit items-center gap-1">
                    {getMediaIcon(m.type)}
                    {m.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground max-w-[220px] truncate" title={m.slug}>
                  {m.slug}
                </TableCell>
                <TableCell>
                  {m.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {m.tags.slice(0, 6).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs" title={tag}>
                          {tag.length > 14 ? tag.slice(0, 14) + '…' : tag}
                        </Badge>
                      ))}
                      {m.tags.length > 6 ? (
                        <Badge variant="outline" className="text-xs">{`+${m.tags.length - 6}`}</Badge>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatBytes(m.size)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 min-w-0">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded truncate max-w-[180px]" title={m.variable}>
                      {m.variable}
                    </code>
                    <CopyVariableButton variable={m.variable} />
                  </div>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex justify-end gap-1 flex-wrap">
                    {m.publicUrl && m.type !== 'TEXT' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(m)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {m.publicUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(m)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja deletar?')) {
                          deleteMediaMutation.mutate(m.id)
                        }
                      }}
                      disabled={deleteMediaMutation.isPending}
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

      {/* Preview Dialog */}
      <MediaPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        media={previewMedia}
      />
    </>
  )
}
