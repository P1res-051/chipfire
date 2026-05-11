import { Copy, Check } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface CopyVariableButtonProps {
  variable: string
}

export function CopyVariableButton({ variable }: CopyVariableButtonProps) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(variable)
      setCopied(true)
      toast({ title: 'Variável copiada', variant: 'success', durationMs: 2000 })
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      toast({
        title: 'Falha ao copiar variável',
        description:
          'Seu navegador bloqueou o acesso à área de transferência. Copie manualmente.',
        variant: 'destructive',
        durationMs: 3000,
      })
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      title="Copiar variável"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )
}
