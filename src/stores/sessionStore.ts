import { create } from 'zustand'
import type { ConnectionStatus, User } from '@/types'

interface SessionState {
  me: User | null
  boardId: string | null
  status: ConnectionStatus
}

// State shape only. Actions arrive with the session feature.
export const useSessionStore = create<SessionState>()(() => ({
  me: null,
  boardId: null,
  status: 'idle',
}))
