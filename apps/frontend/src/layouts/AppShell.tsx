import {
  Activity,
  BookOpenText,
  Contact,
  FileText,
  FolderKanban,
  Images,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Moon,
  Settings,
  Shield,
  Smartphone,
  Sun,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import chipfireIcon from '@/assets/icon-chipfire.png'
import { useAuthStore } from '@/features/auth/auth.store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useTheme } from '@/theme/theme'

type Item = { to: string; label: string; icon: LucideIcon; group: 'Operação' | 'Conteúdo' | 'Administração' }

const adminItems: Item[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Operação' },
  { to: '/admin/instances', label: 'Instâncias', icon: Smartphone, group: 'Operação' },
  { to: '/admin/campaigns', label: 'Campanhas', icon: FolderKanban, group: 'Operação' },
  { to: '/admin/inbox', label: 'Inbox', icon: MessageSquareText, group: 'Operação' },
  { to: '/admin/contacts', label: 'Contatos', icon: Contact, group: 'Operação' },
  { to: '/admin/media', label: 'Mídia', icon: Images, group: 'Conteúdo' },
  { to: '/admin/templates', label: 'Templates', icon: FileText, group: 'Conteúdo' },
  { to: '/admin/content-groups', label: 'Conteúdo Dinâmico', icon: BookOpenText, group: 'Conteúdo' },
  { to: '/admin/users', label: 'Usuários', icon: Users, group: 'Administração' },
  { to: '/admin/logs', label: 'Logs', icon: Activity, group: 'Administração' },
  { to: '/admin/settings', label: 'Configurações', icon: Settings, group: 'Administração' },
]

const userItems: Item[] = [
  { to: '/user/dashboard', label: 'Meu Dashboard', icon: LayoutDashboard, group: 'Operação' },
  { to: '/user/instances', label: 'Minhas Instâncias', icon: Smartphone, group: 'Operação' },
  { to: '/user/logs', label: 'Logs', icon: Activity, group: 'Operação' },
  { to: '/user/profile', label: 'Perfil', icon: User, group: 'Administração' },
]

export function AppShell(props: { variant: 'admin' | 'user'; children: React.ReactNode }) {
  const clear = useAuthStore((state) => state.clear)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const items = props.variant === 'admin' ? adminItems : userItems
  const navigate = useNavigate()
  const { toast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const groupedItems = items.reduce(
    (groups, item) => {
      groups[item.group] = [...(groups[item.group] ?? []), item]
      return groups
    },
    {} as Partial<Record<Item['group'], Item[]>>,
  )

  async function logout() {
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch {
      // se falhar no logout do backend, ainda limpamos a sessao local
    } finally {
      clear()
      toast({ title: 'Sessao encerrada', variant: 'success' })
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-grid">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen shrink-0 border-r border-border/80 bg-card/82 md:flex md:w-64 md:flex-col lg:w-72">
          <div className="border-b border-border/80 p-4">
            <div className="flex items-center gap-2">
              <Link
                to={props.variant === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <img src={chipfireIcon} alt="ChipFire" className="h-6 w-6 object-contain" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">ChipFire</span>
                  <span className="block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {props.variant === 'admin' ? 'Admin' : 'Operador'}
                  </span>
                </span>
                {props.variant === 'admin' ? (
                  <Shield className="ml-auto h-4 w-4 text-primary/80" />
                ) : (
                  <User className="ml-auto h-4 w-4 text-accent/80" />
                )}
              </Link>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto p-3">
            {(['Operação', 'Conteúdo', 'Administração'] as const).map((group) =>
              groupedItems[group]?.length ? (
                <div key={group}>
                  <div className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {group}
                  </div>
                  <div className="space-y-1">
                    {groupedItems[group]?.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.to === '/admin/dashboard' || item.to === '/user/dashboard'}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground',
                              isActive && 'bg-primary/10 text-foreground ring-1 ring-primary/20',
                            )
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ) : null,
            )}
          </nav>

          <div className="border-t border-border/80 p-3">
            <Button variant="outline" className="w-full justify-start" onClick={logout}>
              <LogOut /> Sair
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{props.children}</main>
      </div>
    </div>
  )
}
