import { create } from 'zustand'
import type { Cursor, User } from '@/types'

interface PresenceState {
  users: Record<string, User>
  cursors: Record<string, Cursor>
}

// State shape only. Actions arrive with the presence feature.
export const usePresenceStore = create<PresenceState>()(() => ({
  users: {},
  cursors: {},
}))
