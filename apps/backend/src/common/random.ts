import { randomBytes } from 'crypto'

export function randomUrlToken(size: number) {
  return randomBytes(Math.ceil((size * 3) / 4))
    .toString('base64url')
    .slice(0, size)
}
