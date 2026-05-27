import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Plus } from 'lucide-react'
import * as React from 'react'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'
import { useToast } from '@/components/ui/toast'

import { MediaList } from '../components/MediaList'
import { MediaUploadDialog } from '../components/MediaUploadDialog'
import { MediaCreateTextDialog } from '../components/MediaCreateTextDialog'

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

export function AdminMediaPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<'ALL' | MediaType>('ALL')
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [textOpen, setTextOpen] = React.useState(false)

  // Buscar mídias
  const mediaQuery = useQuery({
    queryKey: ['admin', 'media', { search, type: typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (typeFilter !== 'ALL') params.append('type', typeFilter)

      const { data } = await api.get(`/media?${params.toString()}`)
      return data as { items: Media[]; total: number }
    },
  })

  const handleUploadSuccess = () => {
    setUploadOpen(false)
    toast({ title: 'Arquivo enviado com sucesso', variant: 'success' })
    qc.invalidateQueries({ queryKey: ['admin', 'media'] })
  }

  const handleTextSuccess = () => {
    setTextOpen(false)
    toast({ title: 'Texto criado com sucesso', variant: 'success' })
    qc.invalidateQueries({ queryKey: ['admin', 'media'] })
  }

  return (
    <div className="space-y-6">
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border bg-gradient-to-br from-[#071418] via-[#071418] to-[#0F5739]/30 p-6 md:flex-row md:items-center md:justify-between">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#45C9A4] via-[#52C9EB] to-[#46B5A9]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#52C9EB]/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#45C9A4]/10 blur-2xl" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">Biblioteca de mídia</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-white/70">
            Arquivos e conteúdo reutilizável para campanhas e templates.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setTextOpen(true)}
            className="border-[#3D8E66]/60 bg-transparent text-white hover:bg-white/5 hover:text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo texto
          </Button>
          <Button
            onClick={() => setUploadOpen(true)}
            className="bg-gradient-to-r from-[#52C9EB] to-[#45C9A4] text-[#071418] hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Fazer upload
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-[#3D8E66]/25">
        <CardHeader className="bg-gradient-to-r from-[#071418]/10 via-transparent to-[#0F5739]/10">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, slug ou tag…"
                className="focus-visible:ring-[#52C9EB]/40"
              />
            </div>
            <div className="w-full md:w-56">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="focus-visible:ring-[#52C9EB]/40"
              >
                <option value="ALL">Todos os tipos</option>
                <option value="IMAGE">Imagem</option>
                <option value="VIDEO">Vídeo</option>
                <option value="AUDIO">Áudio</option>
                <option value="PDF">PDF</option>
                <option value="DOCUMENT">Documento</option>
                <option value="TEXT">Texto</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mídias */}
      <Card className="overflow-hidden border-[#3D8E66]/25">
        <CardHeader className="flex flex-col gap-2 bg-gradient-to-r from-[#071418]/10 via-transparent to-[#0F5739]/10 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Biblioteca</CardTitle>
          <div className="text-sm text-muted-foreground">
            {mediaQuery.isPending ? 'Carregando…' : `${mediaQuery.data?.total || 0} itens`}
          </div>
        </CardHeader>
        <CardContent>
          {mediaQuery.isError && (
            <div className="text-sm text-destructive">
              Erro ao carregar mídias: {getErrorMessage(mediaQuery.error)}
            </div>
          )}

          {!mediaQuery.isPending && (mediaQuery.data?.total ?? 0) === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6" />}
              title="Nenhuma mídia cadastrada"
              description="Comece fazendo upload de um arquivo ou criando um texto reutilizável."
              primaryAction={{ label: 'Fazer upload', onClick: () => setUploadOpen(true) }}
              secondaryAction={{ label: 'Novo texto', onClick: () => setTextOpen(true), variant: 'outline' }}
              className="border-[#3D8E66]/25 bg-gradient-to-br from-[#071418]/5 via-transparent to-[#0F5739]/10"
            />
          ) : (
            <MediaList
              media={mediaQuery.data?.items || []}
              isLoading={mediaQuery.isPending}
            />
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <MediaUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
      />

      {/* Text Dialog */}
      <MediaCreateTextDialog
        open={textOpen}
        onOpenChange={setTextOpen}
        onSuccess={handleTextSuccess}
      />
    </div>
  )
}
