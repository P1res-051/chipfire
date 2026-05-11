import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileUp, Plus, ShieldOff } from 'lucide-react'
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
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { getErrorMessage } from '@/lib/http'

type ContactStatus = 'ACTIVE' | 'INACTIVE' | 'OPTOUT'

type Contact = {
  id: string
  userId: string
  name: string
  phone: string
  tag: string | null
  optIn: boolean
  status: ContactStatus
  source: string | null
  optOutAt: string | null
  createdAt: string
  updatedAt: string
}

type UserOption = { id: string; name: string; email: string }

const contactSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  phone: z.string().min(8, 'Informe o telefone'),
  tag: z.string().optional(),
  optIn: z.boolean(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OPTOUT']),
})

type ContactValues = z.infer<typeof contactSchema>

function statusBadge(status: ContactStatus) {
  if (status === 'ACTIVE') return <Badge variant="success">ACTIVE</Badge>
  if (status === 'INACTIVE') return <Badge variant="outline">INACTIVE</Badge>
  return <Badge variant="destructive">OPTOUT</Badge>
}

export function AdminContactsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()

  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState<string>('')
  const [tag, setTag] = React.useState('')
  const [userId, setUserId] = React.useState<string>('')

  const users = useQuery({
    queryKey: ['admin', 'users', 'options'],
    queryFn: async () => {
      const { data } = await api.get('/users')
      return (data as Array<{ id: string; name: string; email: string }>).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      })) as UserOption[]
    },
  })

  const contacts = useQuery({
    queryKey: ['admin', 'contacts', { userId, q, status, tag }],
    queryFn: async () => {
      const { data } = await api.get('/contacts', {
        params: {
          userId: userId || undefined,
          q: q || undefined,
          status: status || undefined,
          tag: tag || undefined,
        },
      })
      return data as Contact[]
    },
  })

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Contact | null>(null)

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phone: '',
      tag: '',
      optIn: true,
      status: 'ACTIVE',
    },
  })

  React.useEffect(() => {
    if (!editing) return
    form.reset({
      name: editing.name,
      phone: editing.phone,
      tag: editing.tag ?? '',
      optIn: editing.optIn,
      status: editing.status,
    })
  }, [editing, form])

  const createOrUpdate = useMutation({
    mutationFn: async (payload: { id?: string; values: ContactValues }) => {
      if (payload.id) {
        const { data } = await api.patch(`/contacts/${payload.id}`, payload.values)
        return data as Contact
      }
      const { data } = await api.post('/contacts', payload.values, {
        params: { userId: userId || undefined },
      })
      return data as Contact
    },
    onSuccess: async () => {
      toast({ title: editing ? 'Contato atualizado' : 'Contato criado', variant: 'success' })
      setOpen(false)
      setEditing(null)
      form.reset()
      await qc.invalidateQueries({ queryKey: ['admin', 'contacts'] })
    },
    onError: (e) =>
      toast({
        title: 'Falha ao salvar contato',
        description: getErrorMessage(e),
        variant: 'destructive',
      }),
  })

  const optout = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/contacts/${id}/optout`)
      return data as Contact
    },
    onSuccess: async () => {
      toast({ title: 'Opt-out aplicado', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'contacts'] })
    },
    onError: (e) => toast({ title: 'Falha ao aplicar opt-out', description: getErrorMessage(e), variant: 'destructive' }),
  })

  const [importOpen, setImportOpen] = React.useState(false)
  const [confirmOptIn, setConfirmOptIn] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [importResult, setImportResult] = React.useState<any>(null)

  const importExcel = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione um arquivo .xlsx')
      if (!confirmOptIn) throw new Error('Confirmação de opt-in é obrigatória')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('confirmOptIn', 'true')
      if (userId) fd.append('userId', userId)
      const { data } = await api.post('/contacts/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data as any
    },
    onSuccess: async (data) => {
      setImportResult(data)
      toast({ title: 'Importação concluída', variant: 'success' })
      await qc.invalidateQueries({ queryKey: ['admin', 'contacts'] })
    },
    onError: (e) => toast({ title: 'Falha na importação', description: getErrorMessage(e), variant: 'destructive' }),
  })

  async function exportCsv() {
    try {
      const res = await api.get('/contacts/export.csv', {
        params: { userId: userId || undefined },
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'contatos.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'CSV exportado', variant: 'success' })
    } catch (e) {
      toast({ title: 'Falha ao exportar CSV', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Contatos autorizados</h1>
            <ApiStatusPill />
          </div>
          <p className="text-sm text-muted-foreground">
            Importação via Excel (NOME | TELEFONE | ETIQUETA), opt-in obrigatório e gestão de opt-out.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="flex-1 sm:flex-none">
            <FileUp /> Importar Excel
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={contacts.isPending} className="flex-1 sm:flex-none">
            <Download /> Exportar CSV
          </Button>
          <Button
            onClick={() => {
              setEditing(null)
              form.reset({ name: '', phone: '', tag: '', optIn: true, status: 'ACTIVE' })
              setOpen(true)
            }}
            className="flex-1 sm:flex-none"
          >
            <Plus /> Novo contato
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lista</CardTitle>
            <div className="text-sm text-muted-foreground">
              {contacts.isPending ? 'Carregando…' : `${contacts.data?.length ?? 0} registros`}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-6">
            <div className="space-y-1 md:col-span-3">
              <label className="text-sm text-muted-foreground">Buscar</label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, telefone ou tag" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Status</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="OPTOUT">OPTOUT</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Usuário</label>
              <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Todos</option>
                {(users.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-6">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm text-muted-foreground">Etiqueta (tag)</label>
              <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ex.: VIP" />
            </div>
            <div className="col-span-full flex items-end gap-2 md:col-span-4 md:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setQ('')
                  setStatus('')
                  setUserId('')
                  setTag('')
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.isError ? (
            <div className="text-sm text-destructive">{getErrorMessage(contacts.error)}</div>
          ) : null}

          <Table className="mt-2 min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[260px]">Nome</TableHead>
                <TableHead className="w-[150px]">Telefone</TableHead>
                <TableHead className="w-[140px]">Tag</TableHead>
                <TableHead className="w-[90px]">Opt-in</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[160px]">Atualizado</TableHead>
                <TableHead className="w-[160px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(contacts.data ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium max-w-[260px] truncate" title={c.name}>
                    {c.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap" title={c.phone}>
                    {c.phone}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[140px] truncate" title={c.tag ?? ''}>
                    {c.tag ?? '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {c.optIn ? <Badge variant="success" className="text-xs">Sim</Badge> : <Badge variant="outline" className="text-xs">Não</Badge>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{statusBadge(c.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{formatDateTime(c.updatedAt)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const ok = window.confirm('Marcar este contato como OPT-OUT? Isso bloqueia novos envios.')
                          if (ok) optout.mutate(c.id)
                        }}
                        disabled={optout.isPending || c.status === 'OPTOUT'}
                        title="Opt-out"
                        className="px-2"
                      >
                        <ShieldOff />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditing(c)
                          setOpen(true)
                        }}
                        className="px-2"
                      >
                        Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!contacts.isPending && (contacts.data?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum contato encontrado.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? 'Editar contato' : 'Novo contato'} description="Apenas contatos com opt-in podem receber campanhas controladas.">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => createOrUpdate.mutate({ id: editing?.id, values }))}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nome" error={form.formState.errors.name?.message}>
                <Input {...form.register('name')} />
              </Field>
              <Field label="Telefone (DDI 55)" error={form.formState.errors.phone?.message}>
                <Input {...form.register('phone')} placeholder="5511999999999" />
              </Field>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Etiqueta (tag)">
                <Input {...form.register('tag')} placeholder="Ex.: VIP" />
              </Field>
              <Field label="Status" error={form.formState.errors.status?.message}>
                <Select {...form.register('status')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="OPTOUT">OPTOUT</option>
                </Select>
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-secondary/20 p-3">
              <div>
                <div className="text-sm font-medium">Opt-in</div>
                <div className="text-xs text-muted-foreground">Marque apenas se houve consentimento explícito.</div>
              </div>
              <input
                type="checkbox"
                {...form.register('optIn')}
                className="h-5 w-5 accent-[hsl(var(--neon-green))]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createOrUpdate.isPending}>
                {createOrUpdate.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent title="Importar Excel" description="Colunas obrigatórias: NOME | TELEFONE | ETIQUETA. Telefone deve ser válido com DDI 55.">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Arquivo (.xlsx)</label>
              <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-secondary/20 p-3">
              <div>
                <div className="text-sm font-medium">Confirmação obrigatória</div>
                <div className="text-xs text-muted-foreground">
                  Confirmo que estes contatos autorizaram o recebimento de mensagens.
                </div>
              </div>
              <input
                type="checkbox"
                checked={confirmOptIn}
                onChange={(e) => setConfirmOptIn(e.target.checked)}
                className="h-5 w-5 accent-[hsl(var(--neon-green))]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                Fechar
              </Button>
              <Button type="button" onClick={() => importExcel.mutate()} disabled={importExcel.isPending}>
                {importExcel.isPending ? 'Importando…' : 'Importar'}
              </Button>
            </div>

            {importResult ? (
              <div className="rounded-xl border bg-secondary/20 p-4 text-sm">
                <div className="font-medium">Resultado</div>
                <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                  {JSON.stringify(importResult, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
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
