import { useQuery } from '@tanstack/react-query'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { api } from '@/lib/api'

interface ConversationFiltersProps {
  filters: {
    instanceId: string
    search: string
    status: string
  }
  onFiltersChange: (filters: any) => void
  isLoading: boolean
}

type Instance = { id: string; instanceName: string }

function normalizeItems<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[]
  return (raw?.items ?? raw?.value ?? []) as T[]
}

export function UserConversationFilters({
  filters,
  onFiltersChange,
  isLoading,
}: ConversationFiltersProps) {
  // Buscar instâncias do usuário
  const instancesQuery = useQuery({
    queryKey: ['user', 'instances'],
    queryFn: async () => {
      const { data } = await api.get('/instances?limit=100')
      return { items: normalizeItems<Instance>(data) }
    },
  })

  return (
    <div className="space-y-3">
      {/* Busca por nome/telefone */}
      <Input
        placeholder="Buscar por nome/telefone…"
        value={filters.search}
        onChange={(e) =>
          onFiltersChange({ ...filters, search: e.target.value })
        }
        disabled={isLoading}
      />

      {/* Filtro por instância */}
      <Select
        value={filters.instanceId}
        onChange={(e) =>
          onFiltersChange({ ...filters, instanceId: e.target.value })
        }
        disabled={isLoading || instancesQuery.isPending}
      >
        <option value="">Todas as instâncias</option>
        {instancesQuery.data?.items?.map((inst) => (
          <option key={inst.id} value={inst.id}>
            {inst.instanceName}
          </option>
        ))}
      </Select>

      {/* Filtro por status */}
      <Select
        value={filters.status}
        onChange={(e) =>
          onFiltersChange({ ...filters, status: e.target.value })
        }
        disabled={isLoading}
      >
        <option value="">Todos os status</option>
        <option value="ACTIVE">Ativo</option>
        <option value="INACTIVE">Inativo</option>
        <option value="OPTOUT">Opt-out</option>
      </Select>
    </div>
  )
}
