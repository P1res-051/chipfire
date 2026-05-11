import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Checkbox(props: InputHTMLAttributes<HTMLInputElement> & { onCheckedChange?: (checked: boolean) => void }) {
  const { onCheckedChange, ...rest } = props

  return (
    <input
      type="checkbox"
      {...rest}
      onChange={(e) => {
        onCheckedChange?.(e.currentTarget.checked)
        props.onChange?.(e)
      }}
      className={cn(
        'h-4 w-4 rounded border border-primary ring-offset-background cursor-pointer',
        props.className,
      )}
    />
  )
}
