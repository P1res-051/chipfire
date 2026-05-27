import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  tags: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface MediaCreateTextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function MediaCreateTextDialog({
  open,
  onOpenChange,
  onSuccess,
}: MediaCreateTextDialogProps) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post('/media/text', values)
      return data
    },
    onSuccess: () => {
      onSuccess()
      reset()
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar texto',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Novo texto">
        <form className="space-y-4" onSubmit={handleSubmit((v) => createMutation.mutate(v))}>
          {/* Nome */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Nome *</label>
            <Input
              placeholder="Ex: Mensagem de boas-vindas"
              {...register('name')}
            />
            {errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}
          </div>

          {/* Conteúdo */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Conteúdo *</label>
            <Textarea
              rows={6}
              placeholder="Seu texto aqui. Você pode usar variáveis como {{usuario:nome}}"
              {...register('content')}
            />
            {errors.content && <p className="text-sm text-red-400">{errors.content.message}</p>}
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Tags (opcional)</label>
            <Textarea
              rows={2}
              placeholder="Separe com vírgula: boas-vindas, nps, campanha"
              {...register('tags')}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-[#52C9EB] to-[#45C9A4] text-[#071418] hover:opacity-90"
            >
              {createMutation.isPending ? 'Criando…' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
