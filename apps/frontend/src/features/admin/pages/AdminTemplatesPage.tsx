import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Layers, Loader2, Plus, Search, Trash2, Wand2, Pencil } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiStatusPill } from '@/components/ApiStatusPill'
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

type Template = {
  id: string
  userId: string
  name: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

const schema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  content: z.string().min(1, 'Informe o conteúdo'),
  tags: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type ContentGroupType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'MIXED'
type ContentStatus = 'ACTIVE' | 'INACTIVE'

type ContentGroup = {
  id: string
  name: string
  slug: string
  type: ContentGroupType
  selectionMode: 'RANDOM' | 'SEQUENTIAL' | 'WEIGHTED_RANDOM' | 'LEAST_USED'
  status: ContentStatus
  _count?: { items: number }
}

type ContentGroupItem = {
  id: string
  type: ContentGroupType
  textContent: string | null
  mediaId: string | null
  weight: number
  usageCount: number
  lastUsedAt: string | null
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

const variables = [
  '{{nome}}',
  '{{telefone}}',
  '{{etiqueta}}',
  '{{data}}',
  '{{hora}}',
  '{{saudacao}}',
  '{{midia:slug}}',
  '{{texto:slug}}',
  '{{grupo:slug}}',
]

function groupTypeBadge(type: ContentGroupType) {
  const variant = type === 'TEXT' ? 'default' : type === 'MIXED' ? 'warning' : 'outline'
  return (
    <Badge variant={variant as any} className="font-mono">
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

  const templates = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get('/templates')
      return data as Template[]
    },
  })

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Template | null>(null)

  // grupos dinâmicos (usados para inserir variável e simular preview)
  const contentGroups = useQuery({
    queryKey: ['content-groups'],
    enabled: open,
    queryFn: async () => {
      const { data } = await api.get('/content-groups')
      return data as ContentGroup[]
    },
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', content: '', tags: '' },
  })

  React.useEffect(() => {
    if (!editing) return
    form.reset({
      name: editing.name,
      content: editing.content,
      tags: editing.tags.join(', '),
    })
  }, [editing, form])

  const save = useMutation({
    mutationFn: async (payload: { id?: string; values: FormValues }) => {
      const tags = (payload.values.tags ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      if (payload.id) {
        const { data } = await api.patch(`/templates/${payload.id}`, {
          name: payload.values.name,
          content: payload.values.content,
          tags,
        })
        return data as Template
      }
      const { data } = await api.post('/templates', {
        name: payload.values.name,
        content: payload.values.content,
        tags,
      })
      return data as Template
    },
    onSuccess: async () => {
      toast({ title: editing ? 'Template atualizado' : 'Template criado', variant: 'success' })
      setOpen(false)
      setEditing(null)
      form.reset()
      await qc.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (e) => toast({ title: 'Falha ao salvar', description: getErrorMessage(e), variant: 'destructive' }),
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
    onError: (e) => toast({ title: 'Falha ao remover', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase()
    const data = templates.data ?? []
    if (!needle) return data
    return data.filter((t) => t.name.toLowerCase().includes(needle) || t.content.toLowerCase().includes(needle))
  }, [q, templates.data])

  function insertAtCursor(textarea: HTMLTextAreaElement | null, value: string) {
    if (!textarea) return
    const start = textarea.selectionStart ?? textarea.value.length
    const end = textarea.selectionEnd ?? textarea.value.length
    const next = textarea.value.slice(0, start) + value + textarea.value.slice(end)
    form.setValue('content', next, { shouldDirty: true })
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + value.length, start + value.length)
    })
  }

  const contentRef = React.useRef<HTMLTextAreaElement | null>(null)
  const contentRegister = form.register('content')
  const contentValue = form.watch('content')

  // Inserir grupo dinâmico
  const [groupPickerOpen, setGroupPickerOpen] = React.useState(false)
  const [groupSearch, setGroupSearch] = React.useState('')

  const activeGroups = React.useMemo(() => {
    const data = contentGroups.data ?? []
    const needle = groupSearch.trim().toLowerCase()
    return data
      .filter((g) => g.status === 'ACTIVE')
      .filter((g) => {
        if (!needle) return true
        return `${g.name} ${g.slug}`.toLowerCase().includes(needle)
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [contentGroups.data, groupSearch])

  // Preview dinâmico
  const [simulatedAudit, setSimulatedAudit] = React.useState<DynamicPreviewAudit | null>(null)

  React.useEffect(() => {
    if (!open) {
      setSimulatedAudit(null)
      return
    }
    // se o conteúdo mudar, limpa preview simulado (evita confusão)
    setSimulatedAudit(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentValue, open])

  const validationWarnings = React.useMemo(() => {
    const content = contentValue || ''
    const slugs = findGroupSlugs(content)
    if (!slugs.length) return []

    // só valida quando a lista de grupos já está disponível
    const groups = contentGroups.data ?? []
    if (!groups.length) return []

    const map = new Map(groups.map((g) => [g.slug.toLowerCase(), g]))
    const warnings: string[] = []
    for (const slug of slugs) {
      const g = map.get(slug)
      if (!g || g.status !== 'ACTIVE') warnings.push(`Grupo dinâmico não encontrado ou inativo: ${slug}`)
    }
    return warnings
  }, [contentGroups.data, contentValue])

  function findGroupSlugs(content: string) {
    // aceita hífen e underscore (ex.: {{grupo:saudacao}} / {{grupo:saudacao_teste}})
    const regex = /\{\{grupo:([a-z0-9-_]+)\}\}/gi
    const slugs = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = regex.exec(content))) {
      slugs.add(m[1].toLowerCase())
    }
    return [...slugs]
  }

  function renderResolvedItem(item: ContentGroupItem) {
    if (item.type === 'TEXT') return item.textContent ?? ''
    const name = item.media?.name ?? 'mídia'
    const slug = item.media?.slug ?? item.mediaId ?? '—'
    const type = item.media?.type ?? item.type
    return `[Mídia dinâmica: ${name} / ${slug} / ${type}]`
  }

  const simulateDynamic = useMutation({
    mutationFn: async (content: string) => {
      const slugs = findGroupSlugs(content)
      if (!slugs.length) {
        return {
          templateOriginal: content,
          renderedText: content,
          dynamicGroups: [],
          dynamicMedia: [],
          warnings: [] as string[],
          errors: [] as string[],
        } satisfies DynamicPreviewAudit
      }

      const groups = contentGroups.data ?? []
      const map = new Map(groups.map((g) => [g.slug.toLowerCase(), g]))

      const warnings: string[] = []
      const errors: string[] = []
      const resolvedBySlug = new Map<string, string>()
      const auditGroups: DynamicPreviewAudit['dynamicGroups'] = []
      const auditMedia: DynamicPreviewAudit['dynamicMedia'] = []

      // resolve em paralelo, uma chamada por slug
      await Promise.all(
        slugs.map(async (slug) => {
          const g = map.get(slug)
          if (!g || g.status !== 'ACTIVE') {
            warnings.push(`Grupo dinâmico não encontrado ou inativo: ${slug}`)
            resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
            auditGroups.push({ slug, groupId: g?.id })
            return
          }
          try {
            const { data } = await api.post(`/content-groups/${g.id}/test-resolve?dryRun=true`)
            const item = (data as any)?.item as ContentGroupItem | undefined
            if (!item) {
              warnings.push(`Falha ao resolver grupo dinâmico: ${slug}`)
              resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
              auditGroups.push({ slug, groupId: g.id })
              return
            }

            const resolvedText = renderResolvedItem(item)
            resolvedBySlug.set(slug, resolvedText)

            auditGroups.push({ slug, groupId: g.id, itemId: item.id, resolvedText })

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
          } catch (e: any) {
            errors.push(`Erro ao resolver grupo ${slug}: ${getErrorMessage(e)}`)
            resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
            auditGroups.push({ slug, groupId: g.id })
          }
        }),
      )

      // substituição final
      const renderedText = content.replace(/\{\{grupo:([a-z0-9-_]+)\}\}/gi, (_full, slugRaw) => {
        const s = String(slugRaw).toLowerCase()
        return resolvedBySlug.get(s) ?? `{{grupo:${s}}}`
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
    onSuccess: (res) => {
      setSimulatedAudit(res)
      toast({
        title: 'Simulação concluída',
        variant: res.errors.length || res.warnings.length ? 'destructive' : 'success',
      })
    },
    onError: (e: any) =>
      toast({ title: 'Falha ao simular conteúdo dinâmico', description: getErrorMessage(e), variant: 'destructive' }),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Templates</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-muted-foreground">Crie mensagens autorizadas com variáveis e preview estilo WhatsApp.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            form.reset({ name: '', content: '', tags: '' })
            setOpen(true)
          }}
          className="flex-1 md:flex-none"
        >
          <Plus /> Novo template
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou conteúdo…" />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Lista</CardTitle>
          <div className="text-sm text-muted-foreground">{templates.isPending ? 'Carregando…' : `${filtered.length} registros`}</div>
        </CardHeader>
        <CardContent>
          {templates.isError ? <div className="text-sm text-destructive">{getErrorMessage(templates.error)}</div> : null}

          <Table className="mt-2 min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[260px]">Nome</TableHead>
                <TableHead className="w-[200px]">Tags</TableHead>
                <TableHead>Prévia</TableHead>
                <TableHead className="w-[180px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium max-w-[260px] truncate" title={t.name}>
                    {t.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.tags.length ? (
                      <div className="flex flex-wrap gap-1">
                        {t.tags.slice(0, 6).map((tag) => (
                          <Badge key={tag} className="text-xs" variant="outline" title={tag}>
                            {tag.length > 16 ? tag.slice(0, 16) + '…' : tag}
                          </Badge>
                        ))}
                        {t.tags.length > 6 ? (
                          <Badge variant="outline" className="text-xs">{`+${t.tags.length - 6}`}</Badge>
                        ) : null}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate" title={t.content}>
                    {t.content.length > 140 ? t.content.slice(0, 140) + '…' : t.content}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await navigator.clipboard.writeText(t.content)
                          toast({ title: 'Conteúdo copiado', variant: 'success' })
                        }}
                        title="Copiar"
                        className="px-2"
                      >
                        <Copy />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditing(t)
                          setOpen(true)
                        }}
                        className="px-2"
                      >
                        <Pencil /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const ok = window.confirm('Remover template?')
                          if (ok) remove.mutate(t.id)
                        }}
                        disabled={remove.isPending}
                        title="Remover"
                        className="px-2"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!templates.isPending && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum template encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? 'Editar template' : 'Novo template'} description="Use formatação WhatsApp (* _ ~ ``` ) e variáveis.">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => save.mutate({ id: editing?.id, values }))}
          >
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <Button
                    key={v}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => insertAtCursor(contentRef.current, v)}
                  >
                    {v}
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
                  <Layers /> Inserir Grupo Dinâmico
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => insertAtCursor(contentRef.current, '😀')}>
                  Emoji
                </Button>
              </div>
              <Field label="Conteúdo" error={form.formState.errors.content?.message}>
                <Textarea
                  rows={8}
                  {...contentRegister}
                  ref={(el) => {
                    contentRegister.ref(el)
                    contentRef.current = el
                  }}
                  placeholder="Olá {{nome}}, tudo bem?..."
                />
              </Field>
            </div>

            <Field label="Tags (vírgula)">
              <Input {...form.register('tags')} placeholder="Ex.: onboarding, suporte" />
            </Field>

            <div className="rounded-xl border bg-secondary/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Prévia (estilo WhatsApp)</div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => simulateDynamic.mutate(form.getValues('content') || '')}
                    disabled={simulateDynamic.isPending}
                  >
                    {simulateDynamic.isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    Simular conteúdo dinâmico
                  </Button>
                  {simulatedAudit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSimulatedAudit(null)
                      }}
                    >
                      Resetar
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 w-full max-w-[520px] rounded-2xl bg-black/40 p-4 text-sm text-foreground shadow-inner">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {simulatedAudit?.renderedText ??
                    (contentValue || (
                      <span className="text-muted-foreground">Digite o conteúdo para ver a prévia.</span>
                    ))}
                </div>
              </div>

              {(simulatedAudit ? simulatedAudit.warnings : validationWarnings).length ? (
                <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <div className="font-semibold text-destructive">Atenção</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {(simulatedAudit ? simulatedAudit.warnings : validationWarnings).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Os avisos não bloqueiam o salvamento do template.
                  </div>
                </div>
              ) : null}

              {simulatedAudit?.errors?.length ? (
                <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <div className="font-semibold text-destructive">Erros</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    {simulatedAudit.errors.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {simulatedAudit ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border bg-secondary/10 p-3">
                    <div className="text-xs font-semibold text-muted-foreground">Texto original</div>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed">
                      {simulatedAudit.templateOriginal}
                    </pre>
                  </div>
                  <div className="rounded-lg border bg-secondary/10 p-3">
                    <div className="text-xs font-semibold text-muted-foreground">Texto renderizado</div>
                    <pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed">
                      {simulatedAudit.renderedText}
                    </pre>
                  </div>

                  <div className="rounded-lg border bg-secondary/10 p-3 md:col-span-2">
                    <div className="text-xs font-semibold text-muted-foreground">Grupos resolvidos</div>
                    {simulatedAudit.dynamicGroups.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {simulatedAudit.dynamicGroups.map((g) => (
                          <li key={g.slug} className="font-mono">
                            {g.slug} → itemId {g.itemId ?? '—'} → {g.resolvedText ?? '—'}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">Nenhum grupo dinâmico detectado.</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="sticky bottom-0 -mx-5 mt-4 border-t bg-card/95 px-5 pt-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Inserir Grupo Dinâmico */}
      <Dialog open={groupPickerOpen} onOpenChange={setGroupPickerOpen}>
        <DialogContent
          title="Inserir Grupo Dinâmico"
          description="Selecione um grupo ativo para inserir a variável {{grupo:slug}} no conteúdo."
          className="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} className="pl-9" placeholder="Buscar por nome ou slug…" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {contentGroups.isPending ? 'Carregando…' : `${activeGroups.length} grupo(s) ativos`}
              </div>
            </div>

            {contentGroups.isError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {getErrorMessage(contentGroups.error)}
              </div>
            ) : null}

            {contentGroups.isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary/30" />
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
                      <TableHead>Variável</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeGroups.map((g) => {
                      const variable = `{{grupo:${g.slug}}}`
                      return (
                        <TableRow key={g.id}>
                          <TableCell>
                            <div className="font-medium">{g.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{g.slug}</div>
                          </TableCell>
                          <TableCell>{groupTypeBadge(g.type)}</TableCell>
                          <TableCell>{groupStatusBadge(g.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs rounded-md border bg-secondary/20 px-2 py-1">
                                {variable}
                              </span>
                              <CopyVariableButton variable={variable} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                insertAtCursor(contentRef.current, variable)
                                toast({ title: 'Variável inserida', variant: 'success' })
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
