import type { Identity } from '@/types'

// Placeholders: per-tab identity in sessionStorage, implemented with the session feature.
const notImplemented = (): never => {
  throw new Error('not implemented')
}

export const getIdentity: () => Identity | null = notImplemented
export const createIdentity: (name: string) => Identity = notImplemented
