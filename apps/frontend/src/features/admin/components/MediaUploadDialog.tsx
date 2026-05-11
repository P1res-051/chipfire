import { useMutation } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/http'

interface MediaUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function MediaUploadDialog({
  open,
  onOpenChange,
  onSuccess,
}: MediaUploadDialogProps) {
  const { toast } = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [tags, setTags] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione um arquivo')

      const formData = new FormData()
      formData.append('file', file)
      if (tags.trim()) {
        formData.append('tags', tags)
      }

      const { data } = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return data
    },
    onSuccess: () => {
      onSuccess()
      setFile(null)
      setTags('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro ao fazer upload',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validar tamanho (25MB)
      if (selectedFile.size > 25 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'Máximo 25MB por arquivo',
          variant: 'destructive',
        })
        return
      }
      setFile(selectedFile)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Fazer upload de arquivo">
        <div className="space-y-4">
          {/* Área de upload */}
          <div
            className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">
              {file ? file.name : 'Clique ou arraste um arquivo'}
            </p>
            {file && (
              <p className="text-xs text-muted-foreground mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Imagens, vídeos, áudios, PDF ou documentos. Máximo 25MB.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          />

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Tags (opcional)</label>
            <Textarea
              rows={2}
              placeholder="Separe as tags com vírgula: campanha, clientes, 2024"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
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
              onClick={() => uploadMutation.mutate()}
              disabled={!file || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Enviando…' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
