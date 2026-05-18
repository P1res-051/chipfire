import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Power, RefreshCcw } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiStatusPill } from '@/components/ApiStatusPill'
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

type User = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'USER'
  status: 'ACTIVE' | 'INACTIVE'
  instanceLimit: number
  notes: string | null
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  _count?: { instances: number }
}

const createSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'USER']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  instanceLimit: z.number().int().min(1).max(50),
  notes: z.string().optional(),
})

type CreateValues = z.infer<typeof createSchema>

const updateSchema = z.object({
  name: z.string().min(2, 'Informe o nome'),
  role: z.enum(['ADMIN', 'USER']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  instanceLimit: z.number().int().min(1).max(50),
  notes: z.string().optional(),
})

type UpdateValues = z.infer<typeof updateSchema>

function statusBadge(status: User['status']) {
  if (status === 'ACTIVE') return <Badge variant="success">Ativo</Badge>
  return <Badge variant="destructive">Inativo</Badge>
}

function roleBadge(role: User['role']) {
  if (role === 'ADMIN') return <Badge variant="warning">ADMIN</Badge>
  return <Badge variant="outline">USER</Badge>
}

export function AdminUsersPage() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const users = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get('/users')
      return data as User[]
    },
  })

  const [q, setQ] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | User['status']>('ALL')

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [resetOpen, setResetOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<User | null>(null)

  const createDefaults: CreateValues = React.useMemo(
    () => ({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      status: 'ACTIVE',
      instanceLimit: 1,
      notes: '',
    }),
    [],
  )

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: createDefaults,
  })

  const editForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      name: '',
      role: 'USER',
      status: 'ACTIVE',
      instanceLimit: 1,
      notes: '',
    },
  })

  React.useEffect(() => {
    if (!selected) return
    editForm.reset({
      name: selected.name,
      role: selected.role,
      status: selected.status,
      instanceLimit: selected.instanceLimit,
      notes: selected.notes ?? '',
    })
  }, [selected, editForm])

  const createUser = useMutation({
    mutationFn: async (values: CreateValues) => {
      const { data } = await api.post('/users', values)
      return data as User
    },
    onSuccess: async () => {
      toast({ title: 'Usuário criado', variant: 'success' })
      setCreateOpen(false)
      createForm.reset()
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (e) => toast({ title: 'Falha ao criar usuário', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const updateUser = useMutation({
    mutationFn: async (payload: { id: string; values: UpdateValues }) => {
      const { data } = await api.patch(`/users/${payload.id}`, payload.values)
      return data as User
    },
    onSuccess: async () => {
      toast({ title: 'Usuário atualizado', variant: 'success' })
      setEditOpen(false)
      setSelected(null)
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (e) => toast({ title: 'Falha ao atualizar usuário', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const resetPassword = useMutation({
    mutationFn: async (payload: { id: string; newPassword?: string }) => {
      const { data } = await api.post(`/users/${payload.id}/reset-password`, {
        newPassword: payload.newPassword || undefined,
      })
      return data as { user: User; newPassword: string }
    },
    onSuccess: (data) => {
      toast({
        title: 'Senha redefinida',
        description: `Nova senha: ${data.newPassword}`,
        variant: 'success',
        durationMs: 10_000,
      })
      setResetOpen(false)
    },
    onError: (e) =>
      toast({
        title: 'Falha ao redefinir senha',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const resetForm = useForm<{ newPassword: string }>({
    defaultValues: { newPassword: '' },
  })

  const updateStatus = useMutation({
    mutationFn: async (payload: { id: string; status: User['status'] }) => {
      const { data } = await api.patch(`/users/${payload.id}/status`, { status: payload.status })
      return data as User
    },
    onSuccess: async () => {
      toast({ title: 'Status atualizado', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao atualizar status',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const filtered = React.useMemo(() => {
    const data = users.data ?? []
    const needle = q.trim().toLowerCase()
    return data.filter((u) => {
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false
      if (!needle) return true
      return u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)
    })
  }, [users.data, q, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Usuários</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-muted-foreground">
            Cadastro, status e permissões. Ações auditáveis.
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Novo usuário
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou e-mail…" />
        </div>
        <div className="w-full md:w-56">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="ALL">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="INACTIVE">Inativos</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Lista</CardTitle>
          <div className="text-sm text-muted-foreground">
            {users.isPending ? 'Carregando…' : `${filtered.length} registros`}
          </div>
        </CardHeader>
        <CardContent>
          {users.isError ? (
            <div className="text-sm text-destructive">
              {getErrorMessage(users.error)}
            </div>
          ) : null}

          <Table className="mt-2 min-w-[980px]">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[28%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[14%]" />
              <col className="w-[120px]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Limite</TableHead>
                <TableHead>Instâncias</TableHead>
                <TableHead>Último login</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium max-w-[220px] truncate" title={u.name}>
                    {u.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[260px] truncate" title={u.email}>
                    {u.email}
                  </TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell>{statusBadge(u.status)}</TableCell>
                  <TableCell>{u.instanceLimit}</TableCell>
                  <TableCell>{u._count?.instances ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDateTime(u.lastLoginAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const next = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                          const ok = window.confirm(
                            next === 'INACTIVE'
                              ? 'Desativar este usuário? Ele não conseguirá logar.'
                              : 'Ativar este usuário?',
                          )
                          if (!ok) return
                          updateStatus.mutate({ id: u.id, status: next })
                        }}
                        disabled={updateStatus.isPending}
                        title={u.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                        aria-label={u.status === 'ACTIVE' ? `Desativar ${u.name}` : `Ativar ${u.name}`}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelected(u)
                          setEditOpen(true)
                        }}
                        title="Editar"
                        aria-label={`Editar ${u.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelected(u)
                          resetForm.reset({ newPassword: '' })
                          setResetOpen(true)
                        }}
                        title="Reset senha"
                        aria-label={`Resetar senha de ${u.name}`}
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!users.isPending && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum usuário encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Criar */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) createForm.reset(createDefaults)
        }}
      >
        <DialogContent
          title="Novo usuário"
          description="Cria um usuário e define limite de instâncias e permissões."
        >
          <form
            className="space-y-4"
            onSubmit={createForm.handleSubmit((v) => createUser.mutate(v))}
          >
            <Field label="Nome" error={createForm.formState.errors.name?.message}>
              <Input {...createForm.register('name')} />
            </Field>
            <Field label="E-mail" error={createForm.formState.errors.email?.message}>
              <Input autoComplete="email" {...createForm.register('email')} />
            </Field>
            <Field label="Senha inicial" error={createForm.formState.errors.password?.message}>
              <Input type="password" autoComplete="new-password" {...createForm.register('password')} />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Role" error={createForm.formState.errors.role?.message}>
                <Select {...createForm.register('role')}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
              </Field>
              <Field label="Status" error={createForm.formState.errors.status?.message}>
                <Select {...createForm.register('status')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Select>
              </Field>
            </div>

            <Field label="Limite de instâncias" error={createForm.formState.errors.instanceLimit?.message}>
              <Input
                type="number"
                min={1}
                max={50}
                {...createForm.register('instanceLimit', { valueAsNumber: true })}
              />
            </Field>

            <Field label="Observações" error={createForm.formState.errors.notes?.message}>
              <Textarea rows={4} {...createForm.register('notes')} />
            </Field>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Salvando…' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          title="Editar usuário"
          description={selected ? selected.email : '—'}
        >
          <form
            className="space-y-4"
            onSubmit={editForm.handleSubmit((v) => {
              if (!selected) return
              updateUser.mutate({ id: selected.id, values: v })
            })}
          >
            <Field label="Nome" error={editForm.formState.errors.name?.message}>
              <Input {...editForm.register('name')} />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Role" error={editForm.formState.errors.role?.message}>
                <Select {...editForm.register('role')}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
              </Field>
              <Field label="Status" error={editForm.formState.errors.status?.message}>
                <Select {...editForm.register('status')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Select>
              </Field>
            </div>

            <Field label="Limite de instâncias" error={editForm.formState.errors.instanceLimit?.message}>
              <Input
                type="number"
                min={1}
                max={50}
                {...editForm.register('instanceLimit', { valueAsNumber: true })}
              />
            </Field>

            <Field label="Observações" error={editForm.formState.errors.notes?.message}>
              <Textarea rows={4} {...editForm.register('notes')} />
            </Field>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditOpen(false)
                  setSelected(null)
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUser.isPending || !selected}>
                {updateUser.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset senha */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent
          title="Redefinir senha"
          description={selected ? `Usuário: ${selected.email}` : '—'}
        >
          <form
            className="space-y-4"
            onSubmit={resetForm.handleSubmit((v) => {
              if (!selected) return
              resetPassword.mutate({
                id: selected.id,
                newPassword: v.newPassword.trim() ? v.newPassword.trim() : undefined,
              })
            })}
          >
            <div className="text-sm text-muted-foreground">
              Se deixar em branco, o sistema gera uma senha temporária.
            </div>
            <Field label="Nova senha (opcional)">
              <Input type="text" {...resetForm.register('newPassword')} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={resetPassword.isPending || !selected}>
                {resetPassword.isPending ? 'Processando…' : 'Redefinir'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field(props: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground">{props.label}</label>
      {props.children}
      {props.error ? <p className="text-sm text-red-400">{props.error}</p> : null}
    </div>
  )
}
