import type { AxiosError } from 'axios'

export function getErrorMessage(err: unknown) {
  const e = err as AxiosError<any> | undefined
  const anyData = e?.response?.data as any

  if (typeof anyData?.message === 'string') return anyData.message
  if (Array.isArray(anyData?.message)) return anyData.message.join(', ')
  if (typeof e?.message === 'string') return e.message
  return 'Erro inesperado'
}

