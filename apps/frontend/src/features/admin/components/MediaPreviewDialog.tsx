import { Dialog, DialogContent } from '@/components/ui/dialog'

type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'DOCUMENT' | 'TEXT'

type Media = {
  id: string
  userId: string
  name: string
  slug: string
  type: MediaType
  filePath: string | null
  publicUrl: string | null
  mimeType: string | null
  size: number | null
  tags: string[]
  variable: string
  createdAt: string
  updatedAt: string
}

interface MediaPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  media: Media | null
}

export function MediaPreviewDialog({
  open,
  onOpenChange,
  media,
}: MediaPreviewDialogProps) {
  if (!media) return null

  const renderPreview = () => {
    if (!media.publicUrl) {
      return <div className="text-sm text-muted-foreground">Arquivo indisponível</div>
    }

    switch (media.type) {
      case 'IMAGE':
        return (
          <img
            src={media.publicUrl}
            alt={media.name}
            className="max-w-full max-h-[400px] mx-auto rounded"
          />
        )
      case 'VIDEO':
        return (
          <video
            src={media.publicUrl}
            controls
            className="max-w-full max-h-[400px] mx-auto rounded"
          />
        )
      case 'AUDIO':
        return (
          <audio
            src={media.publicUrl}
            controls
            className="w-full"
          />
        )
      case 'PDF':
        return (
          <iframe
            src={media.publicUrl}
            className="w-full h-[500px] rounded"
            title={media.name}
          />
        )
      default:
        return (
          <div className="text-sm text-muted-foreground">
            Preview não disponível para este tipo de arquivo
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={media.name}
        className="max-w-2xl"
      >
        <div className="py-4">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
