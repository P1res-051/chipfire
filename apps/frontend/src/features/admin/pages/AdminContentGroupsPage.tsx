import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Braces,
  FileSpreadsheet,
  FlaskConical,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  Layers,
} from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiStatusPill } from '@/components/ApiStatusPill'
import { EmptyState } from '@/components/EmptyState'
import { CopyVariableButton } from '@/features/admin/components/CopyVariableButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { getErrorMessage } from '@/lib/http'
import { slugify } from '@/lib/slug'

type ContentGroupType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'MIXED'
type ContentSelectionMode = 'RANDOM' | 'SEQUENTIAL' | 'WEIGHTED_RANDOM' | 'LEAST_USED'
type ContentStatus = 'ACTIVE' | 'INACTIVE'

type ContentGroup = {
  id: string
  createdById: string
  name: string
  slug: string
  description: string | null
  type: ContentGroupType
  selectionMode: ContentSelectionMode
  status: ContentStatus
  createdAt: string
  updatedAt: string
  _count?: { items: number }
}

type Media = {
  id: string
  userId: string
  name: string
  slug: string
  type: string
  publicUrl?: string | null
  filePath?: string | null
  mimeType?: string | null
  size?: number | null
  duration?: number | null
  createdAt: string
  updatedAt: string
}

type ContentGroupItem = {
  id: string
  groupId: string
  type: ContentGroupType
  textContent: string | null
  mediaId: string | null
  weight: number
  status: ContentStatus
  usageCount: number
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
  media?: Media | null
}

type ImportErrorDetail = { line: number; message: string; raw: any }
type ImportReport = {
  totalLines: number
  createdGroups: number
  createdItems: number
  ignoredItems: number
  errors: number
  errorDetails: ImportErrorDetail[]
}

function statusBadge(status: ContentStatus) {
  return status === 'ACTIVE' ? <Badge variant="success">ACTIVE</Badge> : <Badge variant="outline">INACTIVE</Badge>
}

function typeBadge(t: ContentGroupType) {
  const variant =
    t === 'TEXT' ? 'default' : t === 'MIXED' ? 'warning' : 'outline'
  return <Badge variant={variant as any}>{t}</Badge>
}

function modeBadge(m: ContentSelectionMode) {
  return <Badge variant="outline">{m}</Badge>
}

const groupSchema = z.object({
  name: z.string().min(2, 'Informe um nome'),
  slug: z.string().min(2, 'Slug inválido').max(60, 'Slug muito longo'),
  description: z.string().max(500, 'Máx 500 caracteres').optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'MIXED']),
  selectionMode: z.enum(['RANDOM', 'SEQUENTIAL', 'WEIGHTED_RANDOM', 'LEAST_USED']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})
type GroupValues = z.infer<typeof groupSchema>

const itemSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']),
  textContent: z.string().optional(),
  mediaId: z.string().optional(),
  weight: z.coerce.number().int().min(1).max(100),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})
type ItemValues = z.infer<typeof itemSchema>

export function AdminContentGroupsPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  // filtros (client-side, pois a API não expõe query params)
  const [search, setSearch] = React.useState('')
  const [filterType, setFilterType] = React.useState<ContentGroupType | ''>('')
  const [filterStatus, setFilterStatus] = React.useState<ContentStatus | ''>('')
  const [filterMode, setFilterMode] = React.useState<ContentSelectionMode | ''>('')

  const groups = useQuery({
    queryKey: ['admin', 'content-groups'],
    queryFn: async () => {
      const { data } = await api.get('/content-groups')
      return data as ContentGroup[]
    },
  })

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return (groups.data ?? []).filter((g) => {
      if (q) {
        const hay = `${g.name} ${g.slug}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filterType && g.type !== filterType) return false
      if (filterStatus && g.status !== filterStatus) return false
      if (filterMode && g.selectionMode !== filterMode) return false
      return true
    })
  }, [groups.data, search, filterType, filterStatus, filterMode])

  // create/edit group
  const [groupModalOpen, setGroupModalOpen] = React.useState(false)
  const [editingGroup, setEditingGroup] = React.useState<ContentGroup | null>(null)
  const [slugTouched, setSlugTouched] = React.useState(false)

  const groupForm = useForm<GroupValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      type: 'MIXED',
      selectionMode: 'RANDOM',
      status: 'ACTIVE',
    },
  })

  const nameWatch = groupForm.watch('name')
  React.useEffect(() => {
    if (editingGroup) return
    if (slugTouched) return
    const s = slugify(nameWatch || '')
    if (s) groupForm.setValue('slug', s, { shouldValidate: true })
  }, [nameWatch, slugTouched, groupForm, editingGroup])

  function openCreateGroup() {
    setEditingGroup(null)
    setSlugTouched(false)
    groupForm.reset({
      name: '',
      slug: '',
      description: '',
      type: 'MIXED',
      selectionMode: 'RANDOM',
      status: 'ACTIVE',
    })
    setGroupModalOpen(true)
  }

  function openEditGroup(g: ContentGroup) {
    setEditingGroup(g)
    setSlugTouched(true) // não auto-altera em edição
    groupForm.reset({
      name: g.name,
      slug: g.slug,
      description: g.description ?? '',
      type: g.type,
      selectionMode: g.selectionMode,
      status: g.status,
    })
    setGroupModalOpen(true)
  }

  const createGroup = useMutation({
    mutationFn: async (values: GroupValues) => {
      const { data } = await api.post('/content-groups', {
        name: values.name,
        slug: values.slug,
        description: values.description?.trim() || undefined,
        type: values.type,
        selectionMode: values.selectionMode,
        status: values.status,
      })
      return data as ContentGroup
    },
    onSuccess: async () => {
      toast({ title: 'Grupo criado', variant: 'success' })
      setGroupModalOpen(false)
      await qc.invalidateQueries({ queryKey: ['admin', 'content-groups'] })
    },
    onError: (e) => toast({ title: 'Falha ao criar grupo', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const updateGroup = useMutation({
    mutationFn: async (params: { id: string; values: GroupValues }) => {
      const { data } = await api.patch(`/content-groups/${params.id}`, {
        name: params.values.name,
        slug: params.values.slug,
        description: params.values.description?.trim() || null,
        type: params.values.type,
        selectionMode: params.values.selectionMode,
        status: params.values.status,
      })
      return data as ContentGroup
    },
    onSuccess: async () => {
      toast({ title: 'Grupo atualizado', variant: 'success' })
      setGroupModalOpen(false)
      await qc.invalidateQueries({ queryKey: ['admin', 'content-groups'] })
    },
    onError: (e) => toast({ title: 'Falha ao atualizar grupo', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const deactivateGroup = useMutation({
    mutationFn: async (g: ContentGroup) => {
      const { data } = await api.patch(`/content-groups/${g.id}`, { status: g.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
      return data as ContentGroup
    },
    onSuccess: async () => {
      toast({ title: 'Status atualizado', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'content-groups'] })
    },
    onError: (e) => toast({ title: 'Falha ao atualizar status', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const deleteGroup = useMutation({
    mutationFn: async (g: ContentGroup) => {
      const { data } = await api.delete(`/content-groups/${g.id}`)
      return data as any
    },
    onSuccess: async () => {
      toast({ title: 'Grupo removido', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'content-groups'] })
    },
    onError: (e) => toast({ title: 'Falha ao remover grupo', description: getErrorMessage(e), variant: 'destructive' }),
  })

  // test resolve
  const [resolveOpen, setResolveOpen] = React.useState(false)
  const [resolveGroup, setResolveGroup] = React.useState<ContentGroup | null>(null)
  const [resolvedItem, setResolvedItem] = React.useState<ContentGroupItem | null>(null)
  const [resolveAudit, setResolveAudit] = React.useState<null | {
    dryRun: true
    itemId: string
    before: { usageCount: number; lastUsedAt: string | null } | null
    after: { usageCount: number; lastUsedAt: string | null } | null
    unchanged: boolean
  }>(null)

  const testResolve = useMutation({
    mutationFn: async (g: ContentGroup) => {
      // Evidência dryRun: capturar stats antes/depois para o item escolhido
      const { data: beforeItems } = await api.get(`/content-groups/${g.id}/items`)
      const beforeMap = new Map(
        (beforeItems as ContentGroupItem[]).map((i) => [
          i.id,
          {
            usageCount: i.usageCount ?? 0,
            lastUsedAt: i.lastUsedAt ? String(i.lastUsedAt) : null,
          },
        ]),
      )

      const { data } = await api.post(`/content-groups/${g.id}/test-resolve?dryRun=true`)
      const res = data as { success: boolean; item: ContentGroupItem }
      const itemId = res?.item?.id

      const { data: afterItems } = await api.get(`/content-groups/${g.id}/items`)
      const afterMap = new Map(
        (afterItems as ContentGroupItem[]).map((i) => [
          i.id,
          {
            usageCount: i.usageCount ?? 0,
            lastUsedAt: i.lastUsedAt ? String(i.lastUsedAt) : null,
          },
        ]),
      )

      const before = itemId ? beforeMap.get(itemId) ?? null : null
      const after = itemId ? afterMap.get(itemId) ?? null : null

      const unchanged = Boolean(
        before &&
          after &&
          before.usageCount === after.usageCount &&
          String(before.lastUsedAt ?? '') === String(after.lastUsedAt ?? ''),
      )

      return { ...res, audit: { dryRun: true as const, itemId, before, after, unchanged } }
    },
    onSuccess: (data) => {
      setResolvedItem(data.item)
      setResolveAudit(data.audit ?? null)
      setResolveOpen(true)
    },
    onError: (e) => toast({ title: 'Falha no teste de resolução', description: getErrorMessage(e), variant: 'destructive' }),
  })

  // items drawer/modal
  const [itemsOpen, setItemsOpen] = React.useState(false)
  const [itemsGroup, setItemsGroup] = React.useState<ContentGroup | null>(null)

  const items = useQuery({
    queryKey: ['admin', 'content-groups', itemsGroup?.id, 'items'],
    enabled: !!itemsGroup?.id && itemsOpen,
    queryFn: async () => {
      const { data } = await api.get(`/content-groups/${itemsGroup!.id}/items`)
      return data as ContentGroupItem[]
    },
  })

  function openItems(g: ContentGroup) {
    setItemsGroup(g)
    setItemsOpen(true)
  }

  // create/edit item
  const [itemModalOpen, setItemModalOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<ContentGroupItem | null>(null)

  const itemForm = useForm<ItemValues>({
    resolver: zodResolver(itemSchema) as any,
    defaultValues: {
      type: 'TEXT',
      textContent: '',
      mediaId: '',
      weight: 1,
      status: 'ACTIVE',
    },
  })

  const itemTypeWatch = itemForm.watch('type')

  // Mídias reais (para itens IMAGE/VIDEO/AUDIO/DOCUMENT)
  const mediaForItems = useQuery({
    queryKey: ['admin', 'media', 'for-content-group-items', itemTypeWatch],
    enabled: itemModalOpen && itemTypeWatch !== 'TEXT',
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('limit', '200')

      // DOCUMENT: aceitamos DOCUMENT e PDF (não existe filtro multi-tipo no endpoint)
      if (itemTypeWatch && itemTypeWatch !== 'TEXT' && itemTypeWatch !== 'DOCUMENT') {
        params.append('type', itemTypeWatch)
      }

      const { data } = await api.get(`/media?${params.toString()}`)
      const raw = data as any
      const items = (raw?.items ?? []) as Media[]

      const filtered =
        itemTypeWatch === 'DOCUMENT'
          ? items.filter((m) => m.type === 'DOCUMENT' || m.type === 'PDF')
          : items

      return { items: filtered, total: raw?.total ?? filtered.length } as { items: Media[]; total: number }
    },
  })

  function openCreateItem() {
    setEditingItem(null)
    itemForm.reset({ type: 'TEXT', textContent: '', mediaId: '', weight: 1, status: 'ACTIVE' })
    setItemModalOpen(true)
  }

  function openEditItem(i: ContentGroupItem) {
    setEditingItem(i)
    itemForm.reset({
      type: i.type === 'MIXED' ? 'TEXT' : i.type,
      textContent: i.textContent ?? '',
      mediaId: i.mediaId ?? '',
      weight: i.weight ?? 1,
      status: i.status,
    })
    setItemModalOpen(true)
  }

  const createItem = useMutation({
    mutationFn: async (params: { groupId: string; values: ItemValues }) => {
      const v = params.values
      const payload =
        v.type === 'TEXT'
          ? { type: v.type, textContent: (v.textContent ?? '').trim(), weight: v.weight, status: v.status }
          : { type: v.type, mediaId: (v.mediaId ?? '').trim(), weight: v.weight, status: v.status }
      const { data } = await api.post(`/content-groups/${params.groupId}/items`, payload)
      return data as any
    },
    onSuccess: async (data) => {
      if ((data as any)?.ignored) {
        toast({ title: 'Item ignorado (duplicado)', variant: 'success' })
      } else {
        toast({ title: 'Item criado', variant: 'success' })
      }
      setItemModalOpen(false)
      await qc.invalidateQueries({ queryKey: ['admin', 'content-groups', itemsGroup?.id, 'items'] })
      await qc.invalidateQueries({ queryKey: ['admin', 'content-groups'] })
    },
    onError: (e) => toast({ title: 'Falha ao criar item', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const updateItem = useMutation({
    mutationFn: async (params: { groupId: string; itemId: string; values: ItemValues }) => {
      const v = params.values
      const payload =
        v.type === 'TEXT'
          ? { type: v.type, textContent: (v.textContent ?? '').trim(), mediaId: null, weight: v.weight, status: v.status }
          : { type: v.type, mediaId: (v.mediaId ?? '').trim(), textContent: null, weight: v.weight, status: v.status }
      const { data } = await api.patch(`/content-groups/${params.groupId}/items/${params.itemId}`, payload)
      return data as ContentGroupItem
    },
    onSuccess: async () => {
      toast({ title: 'Item atualizado', variant: 'success' })
      setItemModalOpen(false)
      await qc.invalidateQueries({ queryKey: ['admin', 'content-groups', itemsGroup?.id, 'items'] })
    },
    onError: (e) => toast({ title: 'Falha ao atualizar item', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const deactivateItem = useMutation({
    mutationFn: async (i: ContentGroupItem) => {
      const { data } = await api.patch(`/content-groups/${i.groupId}/items/${i.id}`, {
        status: i.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      })
      return data as ContentGroupItem
    },
    onSuccess: async () => {
      toast({ title: 'Status do item atualizado', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'content-groups', itemsGroup?.id, 'items'] })
    },
    onError: (e) => toast({ title: 'Falha ao atualizar item', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const deleteItem = useMutation({
    mutationFn: async (i: ContentGroupItem) => {
      const { data } = await api.delete(`/content-groups/${i.groupId}/items/${i.id}`)
      return data as any
    },
    onSuccess: async () => {
      toast({ title: 'Item removido', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'content-groups', itemsGroup?.id, 'items'] })
    },
    onError: (e) => toast({ title: 'Falha ao remover item', description: getErrorMessage(e), variant: 'destructive' }),
  })

  // import modal
  const [importOpen, setImportOpen] = React.useState(false)
  const [importFile, setImportFile] = React.useState<File | null>(null)
  const [importReport, setImportReport] = React.useState<ImportReport | null>(null)

  const importXlsx = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/content-groups/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data as ImportReport
    },
    onSuccess: async (report) => {
      setImportReport(report)
      toast({ title: 'Importação concluída', variant: report.errors ? 'destructive' : 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'content-groups'] })
    },
    onError: (e) => toast({ title: 'Falha ao importar', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const loading = groups.isPending
  const countLabel = groups.isPending ? 'Carregandoâ€¦' : `${filtered.length} grupo(s)`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Conteúdo Dinâmico</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-muted-foreground">
            Grupos de conteúdo que poderão ser usados depois como variáveis em Templates e Campanhas (ex.:{' '}
            <span className="font-mono">{`{{grupo:meu-slug}}`}</span>).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { setImportOpen(true); setImportFile(null); setImportReport(null) }}>
            <FileSpreadsheet /> Importar Excel
          </Button>
          <Button onClick={openCreateGroup}>
            <Plus /> Novo Grupo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Grupos</CardTitle>
            <div className="text-sm text-muted-foreground">{countLabel}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Busca</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Tipo</label>
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                <option value="">Todos</option>
                {(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'MIXED'] as ContentGroupType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Status</label>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                <option value="">Todos</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Modo de seleção</label>
              <Select value={filterMode} onChange={(e) => setFilterMode(e.target.value as any)}>
                <option value="">Todos</option>
                {(['RANDOM', 'SEQUENTIAL', 'WEIGHTED_RANDOM', 'LEAST_USED'] as ContentSelectionMode[]).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setFilterType('')
                setFilterStatus('')
                setFilterMode('')
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {groups.isError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {getErrorMessage(groups.error)}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary/30" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-6 w-6" />}
              title="Nenhum grupo encontrado"
              description="Crie seu primeiro grupo para usar como variável em templates e campanhas."
              primaryAction={{ label: 'Novo Grupo', onClick: openCreateGroup }}
              secondaryAction={{ label: 'Importar Excel', onClick: () => setImportOpen(true), variant: 'outline' }}
            />
          ) : (
            <Table className="mt-2 min-w-[1100px]">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[6%]" />
                <col className="w-[18%]" />
                <col className="w-[160px]" />
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Variável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g) => {
                  const variable = `{{grupo:${g.slug}}}`
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium max-w-[220px] truncate" title={g.name}>{g.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={g.slug}>{g.slug}</TableCell>
                      <TableCell>{typeBadge(g.type)}</TableCell>
                      <TableCell>{modeBadge(g.selectionMode)}</TableCell>
                      <TableCell>{statusBadge(g.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{g._count?.items ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="inline-flex items-center gap-2 rounded-md border bg-secondary/30 px-2 py-1 font-mono text-xs max-w-[220px] truncate"
                            title={variable}
                          >
                            <Braces className="h-4 w-4 text-neon-purple" />
                            {variable}
                          </span>
                          <CopyVariableButton variable={variable} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openItems(g)} title="Itens" aria-label={`Abrir itens de ${g.name}`}>
                            <Layers className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => {
                              setResolveGroup(g)
                              testResolve.mutate(g)
                            }}
                            disabled={testResolve.isPending}
                            title="Testar"
                            aria-label={`Testar grupo ${g.name}`}
                          >
                            <FlaskConical className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => openEditGroup(g)} title="Editar" aria-label={`Editar grupo ${g.name}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => {
                              deactivateGroup.mutate(g)
                            }}
                            disabled={deactivateGroup.isPending}
                            title={g.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                            aria-label={g.status === 'ACTIVE' ? `Desativar ${g.name}` : `Ativar ${g.name}`}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => {
                              const ok = window.confirm(`Excluir o grupo "${g.name}"? Isso removerá também os itens.`)
                              if (!ok) return
                              deleteGroup.mutate(g)
                            }}
                            disabled={deleteGroup.isPending}
                            title="Excluir"
                            aria-label={`Excluir grupo ${g.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal criar/editar grupo */}
      <Dialog open={groupModalOpen} onOpenChange={setGroupModalOpen}>
        <DialogContent
          title={editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
          description="Gerencie grupos e modos de seleção. O slug será usado como variável."
          className="max-w-2xl"
        >
          <form
            className="space-y-4"
            onSubmit={groupForm.handleSubmit((v) => {
              if (editingGroup) return updateGroup.mutate({ id: editingGroup.id, values: v })
              return createGroup.mutate(v)
            })}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input {...groupForm.register('name')} />
                {groupForm.formState.errors.name?.message ? (
                  <p className="text-sm text-red-400">{groupForm.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Slug</label>
                <Input
                  {...groupForm.register('slug')}
                  onChange={(e) => {
                    setSlugTouched(true)
                    groupForm.setValue('slug', e.target.value, { shouldValidate: true })
                  }}
                />
                {groupForm.formState.errors.slug?.message ? (
                  <p className="text-sm text-red-400">{groupForm.formState.errors.slug.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Descrição</label>
              <Textarea rows={3} {...groupForm.register('description')} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Tipo</label>
                <Select {...groupForm.register('type')}>
                  {(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'MIXED'] as ContentGroupType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Modo de seleção</label>
                <Select {...groupForm.register('selectionMode')}>
                  {(['RANDOM', 'SEQUENTIAL', 'WEIGHTED_RANDOM', 'LEAST_USED'] as ContentSelectionMode[]).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Status</label>
                <Select {...groupForm.register('status')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setGroupModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createGroup.isPending || updateGroup.isPending}>
                {editingGroup ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Itens */}
      <Dialog open={itemsOpen} onOpenChange={setItemsOpen}>
        <DialogContent
          title={itemsGroup ? `Itens · ${itemsGroup.name}` : 'Itens'}
          description="Gerencie itens do grupo. Para itens de mídia, informe o mediaId."
          className="max-w-5xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {items.isPending ? 'Carregandoâ€¦' : `${items.data?.length ?? 0} item(s)`}
            </div>
            <Button onClick={openCreateItem} disabled={!itemsGroup}>
              <Plus /> Adicionar item
            </Button>
          </div>

          {items.isError ? (
            <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {getErrorMessage(items.error)}
            </div>
          ) : null}

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items.data ?? []).map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{typeBadge(i.type)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {i.type === 'TEXT' ? (
                        <div className="max-w-xl">
                          <div className="truncate">{i.textContent}</div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="font-mono">mediaId:</span> {i.mediaId ?? 'â€”'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {i.media ? `${i.media.name} · ${i.media.slug} · ${i.media.type}` : 'Mídia não disponível (foi removida ou não existe).'}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{i.weight}</TableCell>
                    <TableCell>{statusBadge(i.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{i.usageCount ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(i.lastUsedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditItem(i)}>
                          <Pencil /> Editar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deactivateItem.mutate(i)} disabled={deactivateItem.isPending}>
                          <Power /> {i.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const ok = window.confirm('Excluir este item?')
                            if (!ok) return
                            deleteItem.mutate(i)
                          }}
                          disabled={deleteItem.isPending}
                        >
                          <Trash2 /> Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.isPending && (items.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      Este grupo ainda não possui itens.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal criar/editar item */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent
          title={editingItem ? 'Editar Item' : 'Adicionar Item'}
          description="Itens TEXT usam textContent. Itens de mídia devem selecionar uma mídia real cadastrada."
          className="max-w-2xl"
        >
          <form
            className="space-y-4"
            onSubmit={itemForm.handleSubmit((v) => {
              if (!itemsGroup) return
              if (v.type === 'TEXT' && !(v.textContent ?? '').trim()) {
                toast({ title: 'Informe o texto do item', variant: 'destructive' })
                return
              }
              if (v.type !== 'TEXT' && !(v.mediaId ?? '').trim()) {
                toast({ title: 'Selecione uma mídia', variant: 'destructive' })
                return
              }
              if (editingItem) {
                return updateItem.mutate({ groupId: itemsGroup.id, itemId: editingItem.id, values: v })
              }
              return createItem.mutate({ groupId: itemsGroup.id, values: v })
            })}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Tipo</label>
                <Select {...itemForm.register('type')}>
                  <option value="TEXT">TEXT</option>
                  <option value="IMAGE">IMAGE</option>
                  <option value="VIDEO">VIDEO</option>
                  <option value="AUDIO">AUDIO</option>
                  <option value="DOCUMENT">DOCUMENT</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Status</label>
                <Select {...itemForm.register('status')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Select>
              </div>
            </div>

            {itemTypeWatch === 'TEXT' ? (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Texto</label>
                <Textarea rows={4} {...itemForm.register('textContent')} />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Mídia</label>

                {mediaForItems.isPending ? (
                  <div className="rounded-lg border bg-secondary/20 p-3 text-sm text-muted-foreground">
                    Carregando mídiasâ€¦
                  </div>
                ) : mediaForItems.isError ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    Erro ao carregar mídias: {getErrorMessage(mediaForItems.error)}
                  </div>
                ) : (mediaForItems.data?.items?.length ?? 0) === 0 ? (
                  <div className="rounded-lg border bg-secondary/20 p-3 text-sm text-muted-foreground">
                    Nenhuma mídia cadastrada. Cadastre uma mídia em Admin &gt; Mídia primeiro.
                  </div>
                ) : (
                  <>
                    <Select
                      value={(itemForm.getValues('mediaId') ?? '').trim()}
                      onChange={(e) => itemForm.setValue('mediaId', e.target.value, { shouldValidate: true })}
                    >
                      <option value="">Selecione uma mídia</option>
                      {(mediaForItems.data?.items ?? []).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} · {m.slug} · {m.type} · {m.id}
                        </option>
                      ))}
                    </Select>

                    {(() => {
                      const selectedId = (itemForm.getValues('mediaId') ?? '').trim()
                      const m = (mediaForItems.data?.items ?? []).find((x) => x.id === selectedId)
                      if (!m) return null
                      return (
                        <div className="mt-2 flex items-start gap-3 rounded-lg border bg-secondary/10 p-3">
                          {m.type === 'IMAGE' && m.publicUrl ? (
                            <img
                              src={m.publicUrl}
                              alt={m.name}
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-secondary/30 text-xs text-muted-foreground">
                              {m.type}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{m.name}</div>
                            <div className="truncate font-mono text-xs text-muted-foreground">
                              {m.slug} · {m.type} · {m.id}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Peso (1-100)</label>
                <Input type="number" min={1} max={100} {...itemForm.register('weight')} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setItemModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                {editingItem ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal import */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent
          title="Importar Excel"
          description="Envie um .xlsx com as colunas: GRUPO, TIPO, CONTEUDO, MEDIA_SLUG, PESO, STATUS."
          className="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="rounded-lg border bg-secondary/20 p-3 text-sm text-muted-foreground">
              <div className="font-semibold text-foreground">Colunas esperadas</div>
              <div className="mt-2 grid gap-1 font-mono text-xs">
                <div>GRUPO</div>
                <div>TIPO</div>
                <div>CONTEUDO</div>
                <div>MEDIA_SLUG</div>
                <div>PESO</div>
                <div>STATUS</div>
              </div>
              <div className="mt-2 text-xs">
                Regras: TIPO=TEXT usa CONTEUDO. Tipos de mídia usam MEDIA_SLUG. Duplicados no mesmo grupo são ignorados.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Arquivo (.xlsx)</label>
              <Input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  setImportFile(f)
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                Fechar
              </Button>
              <Button
                onClick={() => {
                  if (!importFile) {
                    toast({ title: 'Selecione um arquivo .xlsx', variant: 'destructive' })
                    return
                  }
                  importXlsx.mutate(importFile)
                }}
                disabled={importXlsx.isPending}
              >
                {importXlsx.isPending ? 'Importandoâ€¦' : 'Importar'}
              </Button>
            </div>

            {importReport ? (
              <div className="space-y-3">
                <div className="grid gap-2 md:grid-cols-5">
                  <Stat label="Linhas" value={String(importReport.totalLines)} />
                  <Stat label="Grupos criados" value={String(importReport.createdGroups)} />
                  <Stat label="Itens criados" value={String(importReport.createdItems)} />
                  <Stat label="Ignorados" value={String(importReport.ignoredItems)} />
                  <Stat label="Erros" value={String(importReport.errors)} />
                </div>

                {importReport.errors ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                    <div className="text-sm font-semibold text-destructive">Erros (primeiros 50)</div>
                    <div className="mt-2 max-h-64 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Linha</TableHead>
                            <TableHead>Mensagem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(importReport.errorDetails ?? []).slice(0, 50).map((e, idx) => (
                            <TableRow key={`${e.line}-${idx}`}>
                              <TableCell className="font-mono text-xs">{e.line}</TableCell>
                              <TableCell className="text-sm">{e.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-neon-green/40 bg-neon-green/5 p-3 text-sm">
                    Importação sem erros.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal test resolve */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent
          title={resolveGroup ? `Resultado do sorteio · ${resolveGroup.name}` : 'Resultado do sorteio'}
          description="Item escolhido pela regra do grupo (dryRun=true: não deve incrementar usageCount/lastUsedAt)."
          className="max-w-3xl"
        >
          {resolvedItem ? (
            <div className="space-y-4">
              {resolveAudit ? (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    resolveAudit.unchanged ? 'border-neon-green/40 bg-neon-green/5' : 'border-destructive/40 bg-destructive/5'
                  }`}
                >
                  <div className={`font-semibold ${resolveAudit.unchanged ? 'text-neon-green' : 'text-destructive'}`}>
                    Validação dryRun
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div className="rounded-md border bg-secondary/10 p-2">
                      <div className="text-xs text-muted-foreground">Antes</div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        usageCount: {resolveAudit.before?.usageCount ?? 'â€”'}
                        <br />
                        lastUsedAt: {resolveAudit.before?.lastUsedAt ? formatDateTime(resolveAudit.before.lastUsedAt) : 'â€”'}
                      </div>
                    </div>
                    <div className="rounded-md border bg-secondary/10 p-2">
                      <div className="text-xs text-muted-foreground">Depois</div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        usageCount: {resolveAudit.after?.usageCount ?? 'â€”'}
                        <br />
                        lastUsedAt: {resolveAudit.after?.lastUsedAt ? formatDateTime(resolveAudit.after.lastUsedAt) : 'â€”'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Resultado: {resolveAudit.unchanged ? 'OK (sem incremento)' : 'ERRO (houve alteração)'}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {typeBadge(resolvedItem.type)}
                {statusBadge(resolvedItem.status)}
                <Badge variant="outline">usageCount: {resolvedItem.usageCount}</Badge>
                <Badge variant="outline">lastUsedAt: {formatDateTime(resolvedItem.lastUsedAt)}</Badge>
                <Badge variant="outline">weight: {resolvedItem.weight}</Badge>
              </div>

              {resolvedItem.type === 'TEXT' ? (
                <div className="rounded-lg border bg-secondary/20 p-3">
                  <div className="text-sm font-semibold">Texto</div>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{resolvedItem.textContent}</pre>
                </div>
              ) : (
                <div className="rounded-lg border bg-secondary/20 p-3">
                  <div className="text-sm font-semibold">Mídia</div>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div>
                      <span className="font-mono text-xs">mediaId:</span> {resolvedItem.mediaId ?? 'â€”'}
                    </div>
                    <div>
                      {resolvedItem.media
                        ? `${resolvedItem.media.name} · ${resolvedItem.media.slug} · ${resolvedItem.media.type}`
                        : 'Mídia não disponível (foi removida ou não existe).'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Sem item retornado.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-glow">
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className="mt-1 text-base font-semibold">{props.value}</div>
    </div>
  )
}
