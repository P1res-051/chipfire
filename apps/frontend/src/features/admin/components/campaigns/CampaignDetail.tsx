import { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Trash2, Play, Pause, Square, BarChart3, Loader2, Wand2, Layers, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'
import { toast } from 'sonner'
import { CampaignMetrics } from './CampaignMetrics'

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

type ContentGroupType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'MIXED'
type ContentStatus = 'ACTIVE' | 'INACTIVE'

type ContentGroup = {
  id: string
  name: string
  slug: string
  type: ContentGroupType
  status: ContentStatus
  _count?: { items: number }
}

type ContentGroupItem = {
  id: string
  type: ContentGroupType
  textContent: string | null
  mediaId: string | null
  media?: { id: string; name: string; slug: string; type: string; publicUrl?: string | null } | null
}

type CampaignDetailResponse = {
  id: string
  name: string
  description?: string | null
  status: Campaign['status']
  template: { id: string; name: string; content: string }
  contacts: Array<{ contact: { id: string; name: string; phone: string; status: string } }>
  instances: Array<{ instance: { id: string; instanceName: string } }>
}

interface CampaignDetailProps {
  campaign: Campaign
  campaignId: string
  onCampaignUpdate: () => void
}

export function CampaignDetail({
  campaign,
  campaignId,
  onCampaignUpdate,
}: CampaignDetailProps) {
  const [showMetrics, setShowMetrics] = useState(false)
  const [simulatedAudit, setSimulatedAudit] = useState<{
    templateOriginal: string
    renderedText: string
    dynamicGroups: Array<{ slug: string; groupId?: string; itemId?: string; resolvedText?: string }>
    dynamicMedia: Array<{ slug: string; mediaId: string; label: string; publicUrl?: string }>
    warnings: string[]
    errors: string[]
  } | null>(null)
  const [dryRunSaved, setDryRunSaved] = useState<null | { messageLogId: string; meta: any }>(null)

  const campaignQuery = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${campaignId}`)
      return data as CampaignDetailResponse
    },
  })

  // Fetch detailed metrics
  const metricsQuery = useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${campaignId}/metrics`)
      return data
    },
  })

  const contentGroupsQuery = useQuery({
    queryKey: ['content-groups'],
    queryFn: async () => {
      const { data } = await api.get('/content-groups')
      return data as ContentGroup[]
    },
  })

  // Mutations
  const startMutation = useMutation({
    mutationFn: () => api.post(`/campaigns/${campaignId}/start`, {}),
    onSuccess: () => {
      toast.success('Campanha iniciada com sucesso')
      onCampaignUpdate()
    },
    onError: err => {
      const raw = (err as any)?.response?.data
      const message = raw?.message || 'Erro ao iniciar campanha'
      const problems = Array.isArray(raw?.problems) ? raw.problems : []
      toast.error(problems.length ? `${message}\n${problems.join('\n')}` : message)
    },
  })

  const pauseMutation = useMutation({
    mutationFn: () => api.post(`/campaigns/${campaignId}/pause`, {}),
    onSuccess: () => {
      toast.success('Campanha pausada com sucesso')
      onCampaignUpdate()
    },
    onError: err => {
      toast.error(
        (err as any)?.response?.data?.message || 'Erro ao pausar campanha',
      )
    },
  })

  const stopMutation = useMutation({
    mutationFn: () => api.post(`/campaigns/${campaignId}/stop`, {}),
    onSuccess: () => {
      toast.success('Campanha finalizada com sucesso')
      onCampaignUpdate()
    },
    onError: err => {
      toast.error(
        (err as any)?.response?.data?.message || 'Erro ao finalizar campanha',
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/campaigns/${campaignId}`),
    onSuccess: () => {
      toast.success('Campanha deletada com sucesso')
      onCampaignUpdate()
    },
    onError: err => {
      toast.error(
        (err as any)?.response?.data?.message || 'Erro ao deletar campanha',
      )
    },
  })

  function findGroupSlugs(content: string) {
    const regex = /\{\{grupo:([a-z0-9-_]+)\}\}/gi
    const slugs = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = regex.exec(content))) slugs.add(String(m[1]).toLowerCase())
    return [...slugs]
  }

  function getSaudacao(date = new Date()) {
    const h = date.getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  function formatDate(date = new Date()) {
    return date.toLocaleDateString('pt-BR')
  }

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  function replaceKnownVariables(content: string, contact: { name: string; phone: string }) {
    const now = new Date()
    return content
      .replace(/\{\{nome\}\}/gi, contact.name)
      .replace(/\{\{telefone\}\}/gi, contact.phone)
      .replace(/\{\{data\}\}/gi, formatDate(now))
      .replace(/\{\{hora\}\}/gi, formatTime(now))
      .replace(/\{\{saudacao\}\}/gi, getSaudacao(now))
  }

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

  const templateContent = campaignQuery.data?.template?.content ?? ''
  const detectedSlugs = useMemo(() => findGroupSlugs(templateContent), [templateContent])

  const detectedGroups = useMemo(() => {
    const groups = contentGroupsQuery.data ?? []
    const map = new Map(groups.map((g) => [g.slug.toLowerCase(), g]))
    return detectedSlugs.map((slug) => {
      const g = map.get(slug)
      const itemCount = g?._count?.items ?? 0
      return {
        slug,
        exists: Boolean(g),
        group: g,
        itemCount,
        statusLabel: !g ? 'Não encontrado' : g.status !== 'ACTIVE' ? 'Inativo' : itemCount === 0 ? 'Sem itens' : 'OK',
      }
    })
  }, [contentGroupsQuery.data, detectedSlugs])

  const saveWarnings = useMemo(() => {
    const warnings: string[] = []
    for (const entry of detectedGroups) {
      if (!entry.exists) warnings.push(`Grupo dinâmico não encontrado: ${entry.slug}`)
      else if (entry.group?.status !== 'ACTIVE') warnings.push(`Grupo dinâmico inativo: ${entry.slug}`)
    }
    return warnings
  }, [detectedGroups])

  function renderResolvedItem(item: ContentGroupItem) {
    if (item.type === 'TEXT') return item.textContent ?? ''
    const name = item.media?.name ?? 'mídia'
    const slug = item.media?.slug ?? item.mediaId ?? '—'
    const type = item.media?.type ?? item.type
    return `[Mídia dinâmica: ${name} / ${slug} / ${type}]`
  }

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const data = campaignQuery.data
      if (!data) throw new Error('Campanha ainda não carregada')

      const contact = data.contacts?.[0]?.contact
      if (!contact) throw new Error('Nenhum contato elegível encontrado na campanha')

      const templateOriginal = data.template.content || ''
      const base = replaceKnownVariables(templateOriginal, { name: contact.name, phone: contact.phone })
      const slugs = findGroupSlugs(base)
      if (!slugs.length) {
        return {
          templateOriginal,
          renderedText: base,
          dynamicGroups: [],
          dynamicMedia: [],
          warnings: [] as string[],
          errors: [] as string[],
        }
      }

      const groups = contentGroupsQuery.data ?? []
      const map = new Map(groups.map((g) => [g.slug.toLowerCase(), g]))

      const warnings: string[] = []
      const errors: string[] = []
      const mediaOut: Array<{ slug: string; mediaId: string; label: string; publicUrl?: string }> = []
      const resolvedBySlug = new Map<string, string>()
      const auditGroups: Array<{ slug: string; groupId?: string; itemId?: string; resolvedText?: string }> = []

      await Promise.all(
        slugs.map(async (slug) => {
          const g = map.get(slug)
          if (!g) {
            warnings.push(`Grupo dinâmico não encontrado: ${slug}`)
            resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
            auditGroups.push({ slug })
            return
          }
          if (g.status !== 'ACTIVE') {
            warnings.push(`Grupo dinâmico inativo: ${slug}`)
            resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
            auditGroups.push({ slug, groupId: g.id })
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

            const rendered = renderResolvedItem(item)
            resolvedBySlug.set(slug, rendered)
            auditGroups.push({ slug, groupId: g.id, itemId: item.id, resolvedText: rendered })

            if (item.type !== 'TEXT' && item.mediaId) {
              mediaOut.push({
                slug,
                mediaId: item.mediaId,
                label: rendered,
                publicUrl: item.media?.publicUrl ?? undefined,
              })
            }
          } catch (e) {
            errors.push(`Erro ao resolver grupo dinâmico ${slug}: ${getErrorMessage(e as any)}`)
            resolvedBySlug.set(slug, `{{grupo:${slug}}}`)
            auditGroups.push({ slug, groupId: g.id })
          }
        }),
      )

      const renderedText = base.replace(/\{\{grupo:([a-z0-9-_]+)\}\}/gi, (_full, slugRaw) => {
        const s = String(slugRaw).toLowerCase()
        return resolvedBySlug.get(s) ?? `{{grupo:${s}}}`
      })

      return {
        templateOriginal,
        renderedText,
        dynamicGroups: auditGroups.sort((a, b) => a.slug.localeCompare(b.slug)),
        dynamicMedia: mediaOut.sort((a, b) => a.slug.localeCompare(b.slug)),
        warnings,
        errors,
      }
    },
    onSuccess: (res) => {
      setSimulatedAudit(res)
      toast.success(res.errors.length || res.warnings.length ? 'Simulação concluída com avisos/erros' : 'Simulação concluída')
    },
    onError: (e: any) => toast.error(e?.message || 'Falha ao simular mensagem dinâmica'),
  })

  const dryRunMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/campaigns/${campaignId}/dry-run`)
      return data as { messageLogId: string; meta: any }
    },
    onSuccess: (res) => {
      setDryRunSaved(res)
      toast.success(`Dry-run salvo em MessageLog (PREVIEW): ${res.messageLogId}`)
    },
    onError: (e: any) => toast.error(getErrorMessage(e) ?? 'Falha ao executar dry-run'),
  })

  function getStatusBadgeColor(
    status: Campaign['status'],
  ): 'default' | 'destructive' | 'outline' {
    switch (status) {
      case 'DRAFT':
        return 'outline'
      case 'ACTIVE':
        return 'default'
      case 'PAUSED':
        return 'outline'
      case 'FINISHED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  function getStatusLabel(status: Campaign['status']): string {
    const labels: Record<Campaign['status'], string> = {
      DRAFT: 'Rascunho',
      ACTIVE: 'Ativa',
      PAUSED: 'Pausada',
      FINISHED: 'Finalizada',
    }
    return labels[status]
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{campaign.name}</CardTitle>
              {campaign.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {campaign.description}
                </p>
              )}
            </div>
            <Badge variant={getStatusBadgeColor(campaign.status)}>
              {getStatusLabel(campaign.status)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo dinâmico detectado */}
      {campaignQuery.isLoading ? (
        <Card>
          <CardContent className="p-4">
            <div className="h-20 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      ) : campaignQuery.data?.template ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Conteúdo Dinâmico Detectado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detectedGroups.length ? (
              <div className="space-y-2">
                {detectedGroups.map((entry) => (
                  <div
                    key={entry.slug}
                    className="flex flex-col gap-2 rounded-lg border bg-secondary/10 p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs rounded-md border bg-secondary/20 px-2 py-1">
                          {`{{grupo:${entry.slug}}}`}
                        </span>
                        <Badge
                          variant={
                            entry.statusLabel === 'OK'
                              ? 'success'
                              : entry.statusLabel === 'Inativo'
                                ? 'outline'
                                : entry.statusLabel === 'Sem itens'
                                  ? 'warning'
                                  : 'destructive'
                          }
                        >
                          {entry.statusLabel}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {entry.group ? (
                          <>
                            <span className="font-medium text-foreground">{entry.group.name}</span>{' '}
                            <span className="font-mono">({entry.group.slug})</span>
                          </>
                        ) : (
                          'Grupo não encontrado'
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.group ? groupTypeBadge(entry.group.type) : <Badge variant="outline">—</Badge>}
                      {entry.group ? groupStatusBadge(entry.group.status) : <Badge variant="destructive">N/A</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhum grupo dinâmico detectado no template.
              </div>
            )}

            {saveWarnings.length ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <div className="font-semibold text-destructive">
                  Esta campanha contém grupos dinâmicos que não foram encontrados ou estão inativos.
                </div>
                <div className="mt-2 text-muted-foreground">
                  Ela poderá falhar na execução até serem corrigidos.
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {saveWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Preview dinâmico */}
      {campaignQuery.data?.template ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => simulateMutation.mutate()}
                disabled={simulateMutation.isPending || !campaignQuery.data?.contacts?.length}
              >
                {simulateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Simular mensagem dinâmica
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dryRunMutation.mutate()}
                disabled={dryRunMutation.isPending}
                title="Executa dry-run no backend e salva MessageLog.meta (status=PREVIEW). Não envia nada."
              >
                {dryRunMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Salvar meta (dry-run)
              </Button>
              {simulatedAudit ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSimulatedAudit(null)
                    setDryRunSaved(null)
                  }}
                >
                  Resetar
                </Button>
              ) : null}
            </div>

            <div className="rounded-2xl bg-black/40 p-4 text-sm text-foreground shadow-inner">
              <div className="whitespace-pre-wrap leading-relaxed">
                {simulatedAudit?.renderedText ?? (
                  <span className="text-muted-foreground">
                    Clique em "Simular mensagem dinâmica" para ver o preview com variáveis e grupos.
                  </span>
                )}
              </div>
            </div>

            {simulatedAudit?.dynamicMedia?.length ? (
              <div className="rounded-lg border bg-secondary/10 p-3 text-sm">
                <div className="font-semibold">Mídias dinâmicas detectadas</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {simulatedAudit.dynamicMedia.map((m) => (
                    <li key={`${m.slug}-${m.mediaId}`} className="font-mono text-xs">
                      {m.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {simulatedAudit?.warnings?.length ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <div className="font-semibold text-destructive">Atenção</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {simulatedAudit.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {simulatedAudit?.errors?.length ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <div className="font-semibold text-destructive">Erros</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {simulatedAudit.errors.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {simulatedAudit ? (
              <div className="grid gap-3 md:grid-cols-2">
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

            {dryRunSaved ? (
              <div className="rounded-lg border bg-secondary/10 p-3 text-sm">
                <div className="font-semibold">MessageLog.meta (PREVIEW)</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  messageLogId: <span className="font-mono">{dryRunSaved.messageLogId}</span>
                </div>
                <pre className="mt-2 max-h-[320px] overflow-auto whitespace-pre-wrap break-words rounded-md bg-black/30 p-3 text-xs text-muted-foreground">
                  {JSON.stringify(dryRunSaved.meta, null, 2)}
                </pre>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Contatos</p>
              <p className="text-lg font-semibold">{campaign.contactCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Instâncias</p>
              <p className="text-lg font-semibold">{campaign.instanceCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Enviadas</p>
              <p className="text-lg font-semibold text-green-600">
                {campaign.sentCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Erros</p>
              <p className="text-lg font-semibold text-red-600">
                {campaign.errorCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      {showMetrics && metricsQuery.isLoading && (
        <Card>
          <CardContent className="p-4">
            <div className="h-12 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      )}

      {showMetrics && metricsQuery.data && (
        <CampaignMetrics metrics={metricsQuery.data} />
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex gap-2 flex-wrap">
            {campaign.status === 'DRAFT' && (
              <>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </Button>
              </>
            )}

            {campaign.status === 'ACTIVE' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => pauseMutation.mutate()}
                  disabled={pauseMutation.isPending}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => stopMutation.mutate()}
                  disabled={stopMutation.isPending}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              </>
            )}

            {campaign.status === 'PAUSED' && (
              <>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Retomar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => stopMutation.mutate()}
                  disabled={stopMutation.isPending}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              </>
            )}
          </div>

          {/* Metrics button */}
          {['ACTIVE', 'PAUSED', 'FINISHED'].includes(campaign.status) && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => setShowMetrics(!showMetrics)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showMetrics ? 'Ocultar' : 'Ver'} Métricas Detalhadas
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
