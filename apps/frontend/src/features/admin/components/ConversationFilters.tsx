import { useQuery } from '@tanstack/react-query'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { api } from '@/lib/api'

interface ConversationFiltersProps {
  filters: {
    userId: string
    instanceId: string
    search: string
    status: string
  }
  onFiltersChange: (filters: any) => void
  isLoading: boolean
}

type User = { id: string; name: string; email: string }
type Instance = { id: string; instanceName: string }

function normalizeItems<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[]
  return (raw?.items ?? raw?.value ?? []) as T[]
}

export function ConversationFilters({
  filters,
  onFiltersChange,
  isLoading,
}: ConversationFiltersProps) {
  // Buscar usuários para filtro
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'list'],
    queryFn: async () => {
      const { data } = await api.get('/users?limit=100')
      return { items: normalizeItems<User>(data) }
    },
  })

  // Buscar instâncias (quando usuário é selecionado)
  const instancesQuery = useQuery({
    queryKey: ['admin', 'instances', filters.userId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.userId) params.append('userId', filters.userId)
      const { data } = await api.get(`/instances?${params.toString()}`)
      return { items: normalizeItems<Instance>(data) }
    },
    enabled: !!filters.userId,
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

      {/* Filtro por usuário */}
      <Select
        value={filters.userId}
        onChange={(e) =>
          onFiltersChange({ ...filters, userId: e.target.value, instanceId: '' })
        }
        disabled={isLoading || usersQuery.isPending}
      >
        <option value="">Todos os usuários</option>
        {usersQuery.data?.items?.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </Select>

      {/* Filtro por instância */}
      <Select
        value={filters.instanceId}
        onChange={(e) =>
          onFiltersChange({ ...filters, instanceId: e.target.value })
        }
        disabled={isLoading || !filters.userId || instancesQuery.isPending}
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
