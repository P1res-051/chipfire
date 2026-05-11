import { Navigate } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/auth.store'

export function ProtectedRoute(props: {
  children: React.ReactNode
  role?: 'ADMIN' | 'USER'
}) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)

  if (!accessToken) return <Navigate to="/login" replace />
  if (props.role && role !== props.role) return <Navigate to="/login" replace />

  return <>{props.children}</>
}

