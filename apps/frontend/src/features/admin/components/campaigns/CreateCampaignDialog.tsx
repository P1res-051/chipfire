import { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Template {
  id: string
  name: string
  content?: string
}

interface Instance {
  id: string
  instanceName: string
}

type Contact = {
  id: string
  tag?: string | null
  optIn?: boolean
  status?: string
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCampaignDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contactTag: '',
    templateId: '',
    instanceIds: [] as string[],
    allowedStartTime: '08:00',
    allowedEndTime: '20:00',
    dailyLimitPerInstance: 200,
    intervalMinSeconds: 15,
    intervalMaxSeconds: 60,
    maxErrorRatePercent: 5,
    maxOptOutRatePercent: 2,
  })

  const [formErrors, setFormErrors] = useState<{
    name?: string
    templateId?: string
    contactTag?: string
    instanceIds?: string
    eligibleContacts?: string
    payload?: string
  }>({})

  // Fetch data
  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get('/templates')
      // Compat: alguns endpoints retornam lista direta, outros { items }
      const raw = data as any
      return (Array.isArray(raw) ? raw : raw?.items ?? []) as Template[]
    },
    enabled: open,
  })

  const contentGroupsQuery = useQuery({
    queryKey: ['content-groups'],
    queryFn: async () => {
      const { data } = await api.get('/content-groups')
      return data as Array<{ id: string; slug: string; status: 'ACTIVE' | 'INACTIVE'; type: string; name: string }>
    },
    enabled: open,
  })

  const instancesQuery = useQuery({
    queryKey: ['instances'],
    queryFn: async () => {
      const { data } = await api.get('/instances')
      const raw = data as any
      return (Array.isArray(raw) ? raw : raw?.items ?? []) as Instance[]
    },
    enabled: open,
  })

  const contactTagsQuery = useQuery({
    queryKey: ['contacts-tags'],
    queryFn: async () => {
      // Não existe endpoint dedicado de tags; derivamos das tags dos contatos existentes
      const { data } = await api.get('/contacts?limit=500')
      const raw = data as any
      const items = (Array.isArray(raw) ? raw : raw?.items ?? []) as Contact[]
      const tags = Array.from(new Set(items.map((c) => c.tag).filter(Boolean))) as string[]
      return { tags, contacts: items }
    },
    enabled: open,
  })

  function findGroupSlugs(content: string) {
    const regex = /\{\{grupo:([a-z0-9-_]+)\}\}/gi
    const slugs = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = regex.exec(content))) slugs.add(String(m[1]).toLowerCase())
    return [...slugs]
  }

  const selectedTemplate = useMemo(() => {
    const list = templatesQuery.data ?? []
    return list.find((t) => t.id === formData.templateId) ?? null
  }, [formData.templateId, templatesQuery.data])

  const templateWarnings = useMemo(() => {
    const content = selectedTemplate?.content || ''
    const slugs = findGroupSlugs(content)
    if (!slugs.length) return []

    const groups = contentGroupsQuery.data ?? []
    if (!groups.length) return []

    const map = new Map(groups.map((g) => [g.slug.toLowerCase(), g]))
    const warnings: string[] = []
    for (const slug of slugs) {
      const g = map.get(slug)
      if (!g) warnings.push(`Grupo dinâmico não encontrado: ${slug}`)
      else if (g.status !== 'ACTIVE') warnings.push(`Grupo dinâmico inativo: ${slug}`)
    }
    return warnings
  }, [contentGroupsQuery.data, selectedTemplate?.content])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/campaigns', data),
    onSuccess: () => {
      toast.success('Campanha criada com sucesso')
      onOpenChange(false)
      setFormData({
        name: '',
        description: '',
        contactTag: '',
        templateId: '',
        instanceIds: [],
        allowedStartTime: '08:00',
        allowedEndTime: '20:00',
        dailyLimitPerInstance: 200,
        intervalMinSeconds: 15,
        intervalMaxSeconds: 60,
        maxErrorRatePercent: 5,
        maxOptOutRatePercent: 2,
      })
      onSuccess()
    },
    onError: err => {
      const msg = (err as any)?.response?.data?.message || 'Erro ao criar campanha'
      toast.error(msg)
    },
  })

  function toggleInstance(instanceId: string) {
    setFormData(prev => ({
      ...prev,
      instanceIds: prev.instanceIds.includes(instanceId)
        ? prev.instanceIds.filter(id => id !== instanceId)
        : [...prev.instanceIds, instanceId],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nextErrors: typeof formErrors = {}

    if (!formData.name.trim()) nextErrors.name = 'Informe o nome da campanha'
    if (!formData.templateId) nextErrors.templateId = 'Selecione um template'
    if (!formData.contactTag) nextErrors.contactTag = 'Selecione uma etiqueta ou público'
    if (formData.instanceIds.length === 0) nextErrors.instanceIds = 'Selecione pelo menos uma instância'

    // Validação de elegibilidade (sem envio real): precisa existir contato ACTIVE com optIn=true
    const contacts = contactTagsQuery.data?.contacts ?? []
    if (formData.contactTag) {
      const eligible = contacts.filter(
        (c) =>
          String(c.tag ?? '') === formData.contactTag &&
          c.status === 'ACTIVE' &&
          c.optIn === true,
      )
      if (eligible.length === 0) {
        nextErrors.eligibleContacts = 'Nenhum contato elegível encontrado'
      }
    }

    // Payload inválido (fallback defensivo)
    if (
      !formData.name ||
      !formData.templateId ||
      !formData.contactTag ||
      !Array.isArray(formData.instanceIds)
    ) {
      nextErrors.payload = 'Payload inválido'
    }

    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Corrija os campos destacados antes de continuar')
      return
    }

    // Evidência (Network tab): sempre dispara POST quando válido
    // eslint-disable-next-line no-console
    console.log('[CreateCampaignDialog] POST /api/campaigns payload:', formData)
    toast.info('Enviando POST /api/campaigns…')
    createMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Criar Nova Campanha"
        description="Configure os detalhes da campanha de mensagens WhatsApp."
        className="max-h-[90vh] overflow-y-auto max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.keys(formErrors).length ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <div className="font-semibold">Não foi possível criar a campanha:</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {Object.entries(formErrors).map(([k, v]) =>
                  v ? <li key={k}>{v}</li> : null,
                )}
              </ul>
            </div>
          ) : null}

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input
              id="name"
              placeholder="Ex: Black Friday 2025"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            {formErrors.name ? <p className="text-sm text-red-400">{formErrors.name}</p> : null}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Descrição da campanha (opcional)"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select
              value={formData.templateId}
              onChange={e => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
            >
              <option value="">Selecione um template</option>
              {templatesQuery.data?.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
            {formErrors.templateId ? <p className="text-sm text-red-400">{formErrors.templateId}</p> : null}

            {templateWarnings.length ? (
              <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
                <div className="font-semibold">
                  Esta campanha contém grupos dinâmicos que não foram encontrados ou estão inativos.
                </div>
                <div className="mt-1 text-muted-foreground">
                  Ela poderá falhar na execução até serem corrigidos.
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {templateWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Etiqueta de Contatos */}
          <div className="space-y-2">
            <Label htmlFor="tag">Etiqueta de Contatos</Label>
            <Select
              value={formData.contactTag}
              onChange={e => setFormData(prev => ({ ...prev, contactTag: e.target.value }))}
            >
              <option value="">Selecione uma etiqueta</option>
              {contactTagsQuery.data?.tags?.map((tag: string) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Select>
            {formErrors.contactTag ? <p className="text-sm text-red-400">{formErrors.contactTag}</p> : null}
            {formErrors.eligibleContacts ? <p className="text-sm text-red-400">{formErrors.eligibleContacts}</p> : null}
          </div>

          {/* Instâncias */}
          <div className="space-y-2">
            <Label>Instâncias (Selecione pelo menos uma)</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {instancesQuery.data?.map(instance => (
                <label
                  key={instance.id}
                  htmlFor={`instance-${instance.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    id={`instance-${instance.id}`}
                    checked={formData.instanceIds.includes(instance.id)}
                    onCheckedChange={() => toggleInstance(instance.id)}
                  />
                  <span className="text-sm">{instance.instanceName}</span>
                </label>
              ))}
            </div>
            {formErrors.instanceIds ? <p className="text-sm text-red-400">{formErrors.instanceIds}</p> : null}
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora Inicial</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.allowedStartTime}
                onChange={e =>
                  setFormData(prev => ({ ...prev, allowedStartTime: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora Final</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.allowedEndTime}
                onChange={e =>
                  setFormData(prev => ({ ...prev, allowedEndTime: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Limites */}
          <div className="space-y-2">
            <Label htmlFor="dailyLimit">Limite Diário por Instância</Label>
            <Input
              id="dailyLimit"
              type="number"
              min="1"
              max="10000"
              value={formData.dailyLimitPerInstance}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  dailyLimitPerInstance: parseInt(e.target.value),
                }))
              }
            />
          </div>

          {/* Intervalo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minInterval">Intervalo Mín (seg)</Label>
              <Input
                id="minInterval"
                type="number"
                min="5"
                max="300"
                value={formData.intervalMinSeconds}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    intervalMinSeconds: parseInt(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxInterval">Intervalo Máx (seg)</Label>
              <Input
                id="maxInterval"
                type="number"
                min="5"
                max="300"
                value={formData.intervalMaxSeconds}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    intervalMaxSeconds: parseInt(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {/* Taxa de Erro e Opt-out */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="errorRate">Taxa de Erro Max (%)</Label>
              <Input
                id="errorRate"
                type="number"
                min="0"
                max="100"
                value={formData.maxErrorRatePercent}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    maxErrorRatePercent: parseInt(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optoutRate">Taxa Opt-out Max (%)</Label>
              <Input
                id="optoutRate"
                type="number"
                min="0"
                max="100"
                value={formData.maxOptOutRatePercent}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    maxOptOutRatePercent: parseInt(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Campanha'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
