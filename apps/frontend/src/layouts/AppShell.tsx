import { LogOut, Shield, User } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import chipfireIcon from '@/assets/icon-chipfire.png'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth/auth.store'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

type Item = { to: string; label: string }

const adminItems: Item[] = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Usuários' },
  { to: '/admin/instances', label: 'Instâncias' },
  { to: '/admin/contacts', label: 'Contatos' },
  { to: '/admin/templates', label: 'Templates' },
  { to: '/admin/content-groups', label: 'Conteúdo Dinâmico' },
  { to: '/admin/logs', label: 'Logs' },
  { to: '/admin/settings', label: 'Configurações' },
]

const userItems: Item[] = [
  { to: '/user/dashboard', label: 'Meu Dashboard' },
  { to: '/user/instances', label: 'Minhas Instâncias' },
  { to: '/user/logs', label: 'Logs' },
  { to: '/user/profile', label: 'Perfil' },
]

export function AppShell(props: { variant: 'admin' | 'user'; children: React.ReactNode }) {
  const clear = useAuthStore((s) => s.clear)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const items = props.variant === 'admin' ? adminItems : userItems
  const navigate = useNavigate()
  const { toast } = useToast()

  async function logout() {
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch {
      // se falhar no logout do backend, ainda limpamos a sessão local
    } finally {
      clear()
      toast({ title: 'Sessão encerrada', variant: 'success' })
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-grid overflow-x-hidden">
      <div className="flex">
        <aside className="hidden shrink-0 md:flex md:w-64 lg:w-72 md:flex-col md:gap-2 md:p-4">
          <div className="rounded-xl border bg-card shadow-glow p-4">
            <Link
              to={props.variant === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
              className="flex items-center gap-3"
            >
              <img src={chipfireIcon} alt="ChipFire" className="h-7 w-7 shrink-0 object-contain" />
              <span className="font-semibold text-primary">ChipFire</span>
              {props.variant === 'admin' ? (
                <Shield className="ml-auto h-4 w-4 text-primary/80" />
              ) : (
                <User className="ml-auto h-4 w-4 text-accent/80" />
              )}
            </Link>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground/80">
              Operação inteligente · Segurança · Automação
            </p>
          </div>

          <nav className="rounded-xl border bg-card shadow-glow p-2">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin/dashboard' || item.to === '/user/dashboard'}
                className={({ isActive }) =>
                  cn(
                    'block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary/60',
                    isActive && 'bg-secondary/80 text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Button variant="outline" className="justify-start" onClick={logout}>
            <LogOut /> Sair
          </Button>
        </aside>

        <main className="flex-1 min-w-0 p-4 md:p-6">
          {props.children}
        </main>
      </div>
    </div>
  )
}
