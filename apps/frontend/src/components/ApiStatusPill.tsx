import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

export function ApiStatusPill() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await api.get('/health')
      return data as { ok: boolean; service?: string }
    },
    staleTime: 30_000,
  })

  if (health.isPending) return <Badge variant="outline">API: verificando</Badge>
  if (health.isError) return <Badge variant="destructive">API: offline</Badge>
  return <Badge variant={health.data?.ok ? 'success' : 'warning'}>API: online</Badge>
}

