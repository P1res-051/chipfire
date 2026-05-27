import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Wand2,
  X,
} from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { CopyVariableButton } from '@/features/admin/components/CopyVariableButton'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'

type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT' | 'TEXT'
type ContentGroupType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'MIXED'
type ContentStatus = 'ACTIVE' | 'INACTIVE'

type InstanceStatus = 'WAITING_QR' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PAUSED'
type Instance = {
  id: string
  instanceName: string
  status: InstanceStatus
  phoneNumber: string | null
  user?: { id: string; name: string; email: string }
}

type MediaAsset = {
  id: string
  userId: string
  name: string
  slug: string
  type: MediaType
  filePath: string | null
  publicUrl: string | null
  mimeType: string | null
  tags: string[]
}

type Template = {
  id: string
  userId: string
  name: string
  content: string
  mediaId: string | null
  media?: Pick<MediaAsset, 'id' | 'name' | 'slug' | 'type' | 'publicUrl' | 'mimeType'> | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

type ContentGroup = {
  id: string
  name: string
  slug: string
  type: ContentGroupType
  selectionMode: 'RANDOM' | 'SEQUENTIAL' | 'WEIGHTED_RANDOM' | 'LEAST_USED'
  status: ContentStatus
}

type ContentGroupItem = {
  id: string
  type: ContentGroupType
  textContent: string | null
  mediaId: string | null
  media?: { id: string; name: string; slug: string; type: string; publicUrl?: string | null } | null
}

type DynamicPreviewAudit = {
  templateOriginal: string
  renderedText: string
  dynamicGroups: Array<{
    slug: string
    groupId?: string
    itemId?: string
    resolvedText?: string
  }>
  dynamicMedia: Array<{
    slug: string
    mediaId: string
    name?: string
    type?: string
    slugOrPath?: string
    publicUrl?: string
  }>
  warnings: string[]
  errors: string[]
}

const schema = z
  .object({
    name: z.string().min(2, 'Informe o nome'),
    content: z.string(),
    mediaId: z.string().optional(),
    tags: z.string().optional(),
  })
  .refine((value) => Boolean(value.content.trim()) || Boolean((value.mediaId ?? '').trim()), {
    message: 'Informe um texto ou selecione uma midia principal',
    path: ['content'],
  })

type FormValues = z.infer<typeof schema>

const variables = [
  '{{nome}}',
  '{{telefone}}',
  '{{etiqueta}}',
  '{{data}}',
  '{{hora}}',
  '{{saudacao}}',
  '{{grupo:slug}}',
]

function mediaTypeBadge(type: MediaType) {
  if (type === 'IMAGE') return <Badge variant="outline">Imagem</Badge>
  if (type === 'VIDEO') return <Badge variant="outline">Video</Badge>
  if (type === 'AUDIO') return <Badge variant="outline">Audio</Badge>
  if (type === 'TEXT') return <Badge variant="default">Texto</Badge>
  return <Badge variant="outline">Documento</Badge>
}

function groupTypeBadge(type: ContentGroupType) {
  const variant = type === 'TEXT' ? 'default' : type === 'MIXED' ? 'warning' : 'outline'
  return (
    <Badge variant={variant as never} className="font-mono">
      {type}
    </Badge>
  )
}

function groupStatusBadge(status: ContentStatus) {
  return status === 'ACTIVE' ? <Badge variant="success">ACTIVE</Badge> : <Badge variant="outline">INACTIVE</Badge>
}

export function AdminTemplatesPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Template | null>(null)
  const [sendOpen, setSendOpen] = React.useState(false)
  const [sendTemplate, setSendTemplate] = React.useState<Template | null>(null)
  const [originInstanceId, setOriginInstanceId] = React.useState<string>('')
  const [targetInstanceId, setTargetInstanceId] = React.useState<string>('')
  const [groupPickerOpen, setGroupPickerOpen] = React.useState(false)
  const [groupSearch, setGroupSearch] = React.useState('')
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false)
  const [mediaSearch, setMediaSearch] = React.useState('')
  const [simulatedAudit, setSimulatedAudit] = React.useState<DynamicPreviewAudit | null>(null)

  const templates = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get('/templates')
      return data as Template[]
    },
  })

  const contentGroups = useQuery({
    queryKey: ['content-groups'],
    enabled: open,
    queryFn: async () => {
      const { data } = await api.get('/content-groups')
      return data as ContentGroup[]
    },
  })

  const connectedInstances = useQuery({
    queryKey: ['admin', 'instances', 'connected'],
    enabled: sendOpen,
    queryFn: async () => {
      const { data } = await api.get('/instances', { params: { status: 'CONNECTED' } })
      return data as Instance[]
    },
  })

  const manualSend = useMutation({
    mutationFn: async (payload: { originInstanceId: string; targetInstanceId: string; templateId: string }) => {
      const { data } = await api.post('/instances/manual-send-template', payload)
      return data as { ok: boolean }
    },
    onSuccess: () => {
      toast({ title: 'Enviado', description: 'Mensagem enviada para a instância de destino.', variant: 'success' })
      setSendOpen(false)
      setSendTemplate(null)
      setOriginInstanceId('')
      setTargetInstanceId('')
    },
    onError: (e) => toast({ title: 'Falha ao enviar', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const mediaLibrary = useQuery({
    queryKey: ['admin', 'media', 'template-picker'],
    enabled: open || mediaPickerOpen,
    queryFn: async () => {
      const { data } = await api.get('/media?limit=200')
      const raw = data as { items?: MediaAsset[] }
      return raw.items ?? []
    },
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', content: '', mediaId: '', tags: '' },
  })

  const contentValue = form.watch('content')

  React.useEffect(() => {
    if (!editing) return
    form.reset({
      name: editing.name,
      content: editing.content,
      mediaId: editing.mediaId ?? '',
      tags: editing.tags.join(', '),
    })
  }, [editing, form])

  React.useEffect(() => {
    if (!open) {
      setSimulatedAudit(null)
      return
    }
    setSimulatedAudit(null)
  }, [contentValue, open])

  const save = useMutation({
    mutationFn: async (payload: { id?: string; values: FormValues }) => {
      const tags = (payload.values.tags ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
      const data = {
        name: payload.values.name,
        content: payload.values.content,
        mediaId: (payload.values.mediaId ?? '').trim() || null,
        tags,
      }

      if (payload.id) {
        const response = await api.patch(`/templates/${payload.id}`, data)
        return response.data as Template
      }

      const response = await api.post('/templates', data)
      return response.data as Template
    },
    onSuccess: async () => {
      toast({ title: editing ? 'Template atualizado' : 'Template criado', variant: 'success' })
      setOpen(false)
      setEditing(null)
      form.reset({ name: '', content: '', mediaId: '', tags: '' })
      await qc.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (error) =>
      toast({ title: 'Falha ao salvar', description: getErrorMessage(error), variant: 'destructive' }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/templates/${id}`)
      return data as { ok: boolean }
    },
    onSuccess: async () => {
      toast({ title: 'Template removido', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (error) =>
      toast({ title: 'Falha ao remover', description: getErrorMessage(error), variant: 'destructive' }),
  })

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    const data = templates.data ?? []
    if (!needle) return data
    return data.filter((template) => {
      const blob = [
        template.name,
        template.content,
        template.media?.name,
        template.media?.slug,
        template.tags.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return blob.includes(needle)
    })
  }, [q, templates.data])

  const selectedMediaId = form.watch('mediaId') ?? ''
  const selectedMedia = React.useMemo(
    () => (mediaLibrary.data ?? []).find((item) => item.id === selectedMediaId) ?? null,
    [mediaLibrary.data, selectedMediaId],
  )

  const mediaOptions = React.useMemo(() => {
    const needle = mediaSearch.trim().toLowerCase()
    return (mediaLibrary.data ?? [])
      .filter((item) => item.type !== 'TEXT')
      .filter((item) => {
        if (!needle) return true
        return `${item.name} ${item.slug} ${item.type}`.toLowerCase().includes(needle)
      })
  }, [mediaLibrary.data, mediaSearch])

  const activeGroups = React.useMemo(() => {
    const data = contentGroups.data ?? []
    const needle = groupSearch.trim().toLowerCase()
    return data
      .filter((group) => group.status === 'ACTIVE')
      .filter((group) => {
        if (!needle) return true
        return `${group.name} ${group.slug}`.toLowerCase().includes(needle)
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [contentGroups.data, groupSearch])

  const contentRef = React.useRef<HTMLTextAreaElement | null>(null)
  const contentRegister = form.register('content')

  const validationWarnings = React.useMemo(() => {
    const content = contentValue || ''
    const slugs = findGroupSlugs(content)
    if (!slugs.length) return []

    const groups = contentGroups.data ?? []
    if (!groups.length) return []

    const map = new Map(groups.map((group) => [group.slug.toLowerCase(), group]))
    const warnings: string[] = []
    for (const slug of slugs) {
      const group = map.get(slug)
      if (!group || group.status !== 'ACTIVE') warnings.push(`Grupo dinamico nao encontrado ou inativo: ${slug}`)
    }
    return warnings
  }, [contentGroups.data, contentValue])

  const simulateDynamic = useMutation({
    mutationFn: async (content: string) => {
      const slugs = findGroupSlugs(content)
      if (!slugs.length) {
        return {
          templateOriginal: content,
          renderedText: content,
          dynamicGroups: [],
          dynamicMedia: [],
          warnings: [],
          errors: [],
        } satisfies DynamicPreviewAudit
      }

      const groups = contentGroups.data ?? []
      const map = new Map(groups.map((group) => [group.slug.toLowerCase(), group]))
      const warnings: string[] = []
      const errors: string[] = []
      const resolvedBySlug = new Map<string, string>()
      const auditGroups: DynamicPreviewAudit['dynamicGroups'] = []
      const auditMedia: DynamicPreviewAudit['dynamicMedia'] = []

      await Promise.all(
        slugs.map(async (slug) => {
          const group = map.get(slug)
          if (!group || group.status !== 'ACTIVE') {
            warnings.push(`Grupo dinamico nao encontrado ou inativo: ${slug}`)
            resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
            auditGroups.push({ slug, groupId: group?.id })
            return
          }

          try {
            const { data } = await api.post(`/content-groups/${group.id}/test-resolve?dryRun=true`)
            const item = (data as { item?: ContentGroupItem }).item

            if (!item) {
              warnings.push(`Falha ao resolver grupo dinamico: ${slug}`)
              resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
              auditGroups.push({ slug, groupId: group.id })
              return
            }

            const resolvedText = renderResolvedItem(item)
            resolvedBySlug.set(slug, resolvedText)
            auditGroups.push({ slug, groupId: group.id, itemId: item.id, resolvedText })

            if (item.type !== 'TEXT' && item.mediaId) {
              auditMedia.push({
                slug,
                mediaId: item.mediaId,
                name: item.media?.name,
                type: item.media?.type ?? item.type,
                slugOrPath: item.media?.slug ?? item.mediaId,
                publicUrl: item.media?.publicUrl ?? undefined,
              })
            }
          } catch (error) {
            errors.push(`Erro ao resolver grupo ${slug}: ${getErrorMessage(error)}`)
            resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
            auditGroups.push({ slug, groupId: group.id })
          }
        }),
      )

      const renderedText = content.replace(/\{\{grupo:([a-z0-9-_]+)\}\}/gi, (_full, slugRaw) => {
        const normalizedSlug = String(slugRaw).toLowerCase()
        return resolvedBySlug.get(normalizedSlug) ?? `{{grupo:${normalizedSlug}}}`
      })

      return {
        templateOriginal: content,
        renderedText,
        dynamicGroups: auditGroups.sort((a, b) => a.slug.localeCompare(b.slug)),
        dynamicMedia: auditMedia.sort((a, b) => a.slug.localeCompare(b.slug)),
        warnings,
        errors,
      } satisfies DynamicPreviewAudit
    },
    onSuccess: (result) => {
      setSimulatedAudit(result)
      toast({
        title: 'Simulacao concluida',
        variant: result.errors.length || result.warnings.length ? 'destructive' : 'success',
      })
    },
    onError: (error) =>
      toast({
        title: 'Falha ao simular conteudo dinamico',
        description: getErrorMessage(error),
        variant: 'destructive',
      }),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Templates</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-muted-foreground">
            Crie templates com texto, variaveis e uma midia principal real para campanha e maturacao.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            form.reset({ name: '', content: '', mediaId: '', tags: '' })
            setOpen(true)
          }}
          className="flex-1 md:flex-none"
        >
          <Plus /> Novo template
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar por nome, texto ou midia..." />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Lista</CardTitle>
          <div className="text-sm text-muted-foreground">
            {templates.isPending ? 'Carregando...' : `${filtered.length} registros`}
          </div>
        </CardHeader>
        <CardContent>
          {templates.isError ? <div className="text-sm text-destructive">{getErrorMessage(templates.error)}</div> : null}

          {!templates.isPending && filtered.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="Nenhum template encontrado"
              description="Crie seu primeiro template multimidia com texto, variaveis e midia principal."
              primaryAction={{
                label: 'Novo template',
                onClick: () => {
                  setEditing(null)
                  form.reset({ name: '', content: '', mediaId: '', tags: '' })
                  setOpen(true)
                },
              }}
            />
          ) : (
            <Table className="mt-2 min-w-[1080px]">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[30%]" />
                <col className="w-[120px]" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Midia principal</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Previa</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="max-w-[240px]">
                      <div className="truncate font-medium" title={template.name}>
                        {template.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.media ? (
                        <div className="flex items-center gap-2">
                          {mediaTypeBadge(template.media.type as MediaType)}
                          <span className="truncate text-sm text-muted-foreground" title={template.media.name}>
                            {template.media.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sem midia</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.tags.length ? (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 6).map((tag) => (
                            <Badge key={tag} className="text-xs" variant="outline" title={tag}>
                              {tag.length > 16 ? `${tag.slice(0, 16)}...` : tag}
                            </Badge>
                          ))}
                          {template.tags.length > 6 ? (
                            <Badge variant="outline" className="text-xs">{`+${template.tags.length - 6}`}</Badge>
                          ) : null}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="space-y-1">
                        {template.content ? (
                          <div className="line-clamp-2" title={template.content}>
                            {template.content}
                          </div>
                        ) : (
                          <div className="italic text-muted-foreground">Template so com midia principal</div>
                        )}
                        {template.media ? (
                          <div className="text-xs">
                            Envia junto com <span className="font-medium">{template.media.name}</span>
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={async () => {
                            await navigator.clipboard.writeText(template.content)
                            toast({ title: 'Conteudo copiado', variant: 'success' })
                          }}
                          title="Copiar texto"
                          aria-label={`Copiar template ${template.name}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(template)
                            setOpen(true)
                          }}
                          title="Editar"
                          aria-label={`Editar template ${template.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => {
                            setSendTemplate(template)
                            setSendOpen(true)
                          }}
                          title="Enviar manualmente (instância -> instância)"
                          aria-label={`Enviar template ${template.name}`}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => {
                            const confirmed = window.confirm('Remover template?')
                            if (confirmed) remove.mutate(template.id)
                          }}
                          disabled={remove.isPending}
                          title="Remover"
                          aria-label={`Remover template ${template.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title={editing ? 'Editar template' : 'Novo template'}
          description="Texto e midia principal sao independentes. Voce pode salvar so texto, so midia ou os dois."
          className="max-w-6xl"
        >
          <form className="space-y-5" onSubmit={form.handleSubmit((values) => save.mutate({ id: editing?.id, values }))}>
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <Field label="Nome" error={form.formState.errors.name?.message}>
                  <Input {...form.register('name')} />
                </Field>

                <div className="rounded-xl border bg-secondary/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Midia principal</div>
                      <div className="text-xs text-muted-foreground">
                        Essa midia acompanha o template como imagem, video, audio ou documento.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setMediaSearch('')
                          setMediaPickerOpen(true)
                        }}
                      >
                        <Plus /> Escolher midia
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!selectedMedia}
                        onClick={() => form.setValue('mediaId', '', { shouldDirty: true, shouldValidate: true })}
                      >
                        <X /> Remover
                      </Button>
                    </div>
                  </div>

                  {selectedMedia ? (
                    <div className="mt-4 rounded-xl border bg-card/70 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {mediaTypeBadge(selectedMedia.type)}
                        <span className="font-medium">{selectedMedia.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{selectedMedia.slug}</span>
                      </div>
                      <div className="mt-3">{renderMediaPreview(selectedMedia, 'large')}</div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed bg-card/40 p-6 text-sm text-muted-foreground">
                      Nenhuma midia selecionada. Para usar imagem, video, audio ou documento, escolha um item da biblioteca.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable) => (
                      <Button
                        key={variable}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          insertAtCursor(contentRef.current, variable, (next) =>
                            form.setValue('content', next, { shouldDirty: true, shouldValidate: true }),
                          )
                        }
                      >
                        {variable}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setGroupSearch('')
                        setGroupPickerOpen(true)
                      }}
                    >
                      <Layers /> Inserir grupo dinamico
                    </Button>
                  </div>

                  <Field label="Legenda / texto" error={form.formState.errors.content?.message}>
                    <Textarea
                      rows={9}
                      {...contentRegister}
                      ref={(element) => {
                        contentRegister.ref(element)
                        contentRef.current = element
                      }}
                      placeholder="Ex.: {{saudacao}} {{nome}}, tudo bem?"
                    />
                  </Field>
                  <div className="text-xs text-muted-foreground">
                    Se voce selecionar uma midia principal, este texto vira a legenda dela. Se deixar vazio, o template pode enviar so a midia.
                  </div>
                </div>

                <Field label="Tags (separadas por virgula)">
                  <Input {...form.register('tags')} placeholder="Ex.: onboarding, audio, imagem" />
                </Field>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border bg-secondary/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">Previa</div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => simulateDynamic.mutate(form.getValues('content') || '')}
                        disabled={simulateDynamic.isPending}
                      >
                        {simulateDynamic.isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
                        Simular dinamico
                      </Button>
                      {simulatedAudit ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => setSimulatedAudit(null)}>
                          Resetar
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 w-full max-w-[520px] rounded-2xl bg-black/40 p-4 text-sm text-foreground shadow-inner">
                    {selectedMedia ? <div className="mb-3">{renderMediaPreview(selectedMedia, 'compact')}</div> : null}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {simulatedAudit?.renderedText ||
                        contentValue ||
                        (selectedMedia ? (
                          <span className="text-muted-foreground">Template pronto para enviar a midia selecionada.</span>
                        ) : (
                          <span className="text-muted-foreground">Digite o conteudo para ver a previa.</span>
                        ))}
                    </div>
                  </div>

                  {(simulatedAudit ? simulatedAudit.warnings : validationWarnings).length ? (
                    <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                      <div className="font-semibold text-destructive">Atencao</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                        {(simulatedAudit ? simulatedAudit.warnings : validationWarnings).map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                      <div className="mt-2 text-xs text-muted-foreground">Os avisos nao bloqueiam o salvamento.</div>
                    </div>
                  ) : null}

                  {simulatedAudit?.errors.length ? (
                    <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                      <div className="font-semibold text-destructive">Erros</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                        {simulatedAudit.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {simulatedAudit ? (
                    <div className="mt-3 space-y-3">
                      <div className="rounded-lg border bg-secondary/10 p-3">
                        <div className="text-xs font-semibold text-muted-foreground">Texto renderizado</div>
                        <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed">
                          {simulatedAudit.renderedText || '(sem texto)'}
                        </pre>
                      </div>

                      <div className="rounded-lg border bg-secondary/10 p-3">
                        <div className="text-xs font-semibold text-muted-foreground">Grupos resolvidos</div>
                        {simulatedAudit.dynamicGroups.length ? (
                          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {simulatedAudit.dynamicGroups.map((group) => (
                              <li key={`${group.slug}-${group.itemId ?? 'none'}`} className="font-mono">
                                {group.slug} {'->'} item {group.itemId ?? '—'} {'->'} {group.resolvedText ?? '—'}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="mt-2 text-xs text-muted-foreground">Nenhum grupo dinamico detectado.</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 -mx-5 mt-4 border-t bg-card/95 px-5 pt-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={groupPickerOpen} onOpenChange={setGroupPickerOpen}>
        <DialogContent
          title="Inserir grupo dinamico"
          description="Selecione um grupo ativo para inserir a variavel {{grupo:slug}} no texto."
          className="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={groupSearch}
                    onChange={(event) => setGroupSearch(event.target.value)}
                    className="pl-9"
                    placeholder="Buscar por nome ou slug..."
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {contentGroups.isPending ? 'Carregando...' : `${activeGroups.length} grupo(s) ativos`}
              </div>
            </div>

            {contentGroups.isError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {getErrorMessage(contentGroups.error)}
              </div>
            ) : null}

            {contentGroups.isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-lg bg-secondary/30" />
                ))}
              </div>
            ) : activeGroups.length ? (
              <div className="max-h-[420px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Variavel</TableHead>
                      <TableHead className="text-right">Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeGroups.map((group) => {
                      const variable = `{{grupo:${group.slug}}}`
                      return (
                        <TableRow key={group.id}>
                          <TableCell>
                            <div className="font-medium">{group.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{group.slug}</div>
                          </TableCell>
                          <TableCell>{groupTypeBadge(group.type)}</TableCell>
                          <TableCell>{groupStatusBadge(group.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="rounded-md border bg-secondary/20 px-2 py-1 font-mono text-xs">{variable}</span>
                              <CopyVariableButton variable={variable} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                insertAtCursor(contentRef.current, variable, (next) =>
                                  form.setValue('content', next, { shouldDirty: true, shouldValidate: true }),
                                )
                                toast({ title: 'Variavel inserida', variant: 'success' })
                                setGroupPickerOpen(false)
                              }}
                            >
                              Inserir
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg border bg-secondary/10 p-6 text-center">
                <div className="text-sm font-semibold">Nenhum grupo ativo encontrado</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Crie ou ative um grupo em <span className="font-mono">/admin/content-groups</span>.
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mediaPickerOpen} onOpenChange={setMediaPickerOpen}>
        <DialogContent
          title="Escolher midia principal"
          description="Selecione uma imagem, video, audio ou documento da biblioteca."
          className="max-w-5xl"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={mediaSearch}
                    onChange={(event) => setMediaSearch(event.target.value)}
                    className="pl-9"
                    placeholder="Buscar por nome, slug ou tipo..."
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {mediaLibrary.isPending ? 'Carregando...' : `${mediaOptions.length} midia(s)`}
              </div>
            </div>

            {mediaLibrary.isError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {getErrorMessage(mediaLibrary.error)}
              </div>
            ) : null}

            {mediaLibrary.isPending ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-xl bg-secondary/30" />
                ))}
              </div>
            ) : mediaOptions.length ? (
              <div className="grid max-h-[520px] gap-3 overflow-auto md:grid-cols-2">
                {mediaOptions.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => {
                      form.setValue('mediaId', media.id, { shouldDirty: true, shouldValidate: true })
                      toast({ title: 'Midia selecionada', variant: 'success' })
                      setMediaPickerOpen(false)
                    }}
                    className="rounded-xl border bg-card/70 p-4 text-left transition hover:border-primary/60 hover:bg-secondary/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{media.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{media.slug}</div>
                      </div>
                      {mediaTypeBadge(media.type)}
                    </div>
                    <div className="mt-3">{renderMediaPreview(media, 'picker')}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-secondary/10 p-6 text-center">
                <div className="text-sm font-semibold">Nenhuma midia encontrada</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Faça upload na biblioteca de midia antes de montar um template multimidia.
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sendOpen}
        onOpenChange={(v) => {
          setSendOpen(v)
          if (!v) {
            setSendTemplate(null)
            setOriginInstanceId('')
            setTargetInstanceId('')
          }
        }}
      >
        <DialogContent title="Enviar template" description="Envia o template selecionado de uma instância CONNECTED para outra instância CONNECTED.">
          <div className="space-y-4">
            <div className="rounded-xl border bg-secondary/10 p-4">
              <div className="text-sm font-medium">Template</div>
              <div className="mt-1 text-sm text-muted-foreground">{sendTemplate?.name ?? '—'}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Origem (CONNECTED)</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={originInstanceId}
                  onChange={(e) => setOriginInstanceId(e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {(connectedInstances.data ?? []).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.instanceName} {i.phoneNumber ? `· ${i.phoneNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Destino (CONNECTED)</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={targetInstanceId}
                  onChange={(e) => setTargetInstanceId(e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {(connectedInstances.data ?? []).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.instanceName} {i.phoneNumber ? `· ${i.phoneNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSendOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!sendTemplate?.id || !originInstanceId || !targetInstanceId || manualSend.isPending}
                onClick={() => {
                  if (!sendTemplate?.id) return
                  manualSend.mutate({ originInstanceId, targetInstanceId, templateId: sendTemplate.id })
                }}
              >
                {manualSend.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function insertAtCursor(
  textarea: HTMLTextAreaElement | null,
  value: string,
  updateContent: (next: string) => void,
) {
  if (!textarea) return
  const start = textarea.selectionStart ?? textarea.value.length
  const end = textarea.selectionEnd ?? textarea.value.length
  const next = textarea.value.slice(0, start) + value + textarea.value.slice(end)
  updateContent(next)
  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(start + value.length, start + value.length)
  })
}

function findGroupSlugs(content: string) {
  const regex = /\{\{grupo:([a-z0-9-_]+)\}\}/gi
  const slugs = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = regex.exec(content))) {
    slugs.add(match[1].toLowerCase())
  }
  return [...slugs]
}

function renderResolvedItem(item: ContentGroupItem) {
  if (item.type === 'TEXT') return item.textContent ?? ''
  const name = item.media?.name ?? 'midia'
  const slug = item.media?.slug ?? item.mediaId ?? '—'
  const type = item.media?.type ?? item.type
  return `[Midia dinamica: ${name} / ${slug} / ${type}]`
}

function renderMediaPreview(media: Pick<MediaAsset, 'name' | 'publicUrl' | 'type'>, size: 'compact' | 'picker' | 'large') {
  const heightClass =
    size === 'large' ? 'h-48' : size === 'picker' ? 'h-28' : 'h-32'

  if (media.type === 'IMAGE' && media.publicUrl) {
    return (
      <img
        src={media.publicUrl}
        alt={media.name}
        className={`${heightClass} w-full rounded-lg border object-cover`}
      />
    )
  }

  if (media.type === 'VIDEO' && media.publicUrl) {
    return (
      <video
        src={media.publicUrl}
        controls
        className={`${heightClass} w-full rounded-lg border bg-black object-cover`}
      />
    )
  }

  if (media.type === 'AUDIO') {
    return (
      <div className="rounded-lg border bg-card/80 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <FileAudio className="h-4 w-4" />
          <span>{media.name}</span>
        </div>
        {media.publicUrl ? <audio src={media.publicUrl} controls className="w-full" /> : null}
      </div>
    )
  }

  return (
    <div className={`${heightClass} flex items-center justify-center rounded-lg border bg-card/80 px-4 text-sm text-muted-foreground`}>
      <div className="flex items-center gap-2">
        {media.type === 'IMAGE' ? <FileImage className="h-4 w-4" /> : null}
        {media.type === 'VIDEO' ? <FileVideo className="h-4 w-4" /> : null}
        <FileText className="h-4 w-4" />
        <span>{media.name}</span>
      </div>
    </div>
  )
}

function Field(props: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground">{props.label}</label>
      {props.children}
      {props.error ? <p className="text-sm text-red-400">{props.error}</p> : null}
    </div>
  )
}
