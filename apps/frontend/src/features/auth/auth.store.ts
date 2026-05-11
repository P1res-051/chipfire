import { create } from 'zustand'

type Role = 'ADMIN' | 'USER'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  role: Role | null
  mustChangePassword: boolean
  setSession: (payload: {
    accessToken: string
    refreshToken: string
    role: Role
    mustChangePassword?: boolean
  }) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('evo:accessToken'),
  refreshToken: localStorage.getItem('evo:refreshToken'),
  role: (localStorage.getItem('evo:role') as Role | null) ?? null,
  mustChangePassword: localStorage.getItem('evo:mustChangePassword') === 'true',
  setSession: ({ accessToken, refreshToken, role, mustChangePassword }) => {
    localStorage.setItem('evo:accessToken', accessToken)
    localStorage.setItem('evo:refreshToken', refreshToken)
    localStorage.setItem('evo:role', role)
    localStorage.setItem('evo:mustChangePassword', String(!!mustChangePassword))
    set({ accessToken, refreshToken, role, mustChangePassword: !!mustChangePassword })
  },
  clear: () => {
    localStorage.removeItem('evo:accessToken')
    localStorage.removeItem('evo:refreshToken')
    localStorage.removeItem('evo:role')
    localStorage.removeItem('evo:mustChangePassword')
    set({ accessToken: null, refreshToken: null, role: null, mustChangePassword: false })
  },
}))

