import type { Identity } from '@/types'

// One identity per browser tab: sessionStorage is not shared between tabs,
// so two tabs are two different users.
const KEY = 'syncboard.identity'

export const NAME_MAX_LENGTH = 30 // the same limit the API enforces

export function getIdentity(): Identity | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    if (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'name' in value &&
      typeof value.id === 'string' &&
      typeof value.name === 'string'
    ) {
      return { id: value.id, name: value.name }
    }
  } catch {
    // storage blocked or the saved text is not valid JSON: act as if nothing is saved
  }
  return null
}

// Saves the name for this tab. The id stays the same if the tab already had one.
export function createIdentity(name: string): Identity {
  const identity: Identity = {
    id: getIdentity()?.id ?? crypto.randomUUID(),
    name,
  }
  sessionStorage.setItem(KEY, JSON.stringify(identity))
  return identity
}
