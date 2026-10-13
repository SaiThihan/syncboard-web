import { create } from 'zustand'
import type { ConnectionStatus, User } from '@/types'

interface SessionState {
  me: User | null
  boardId: string | null
  status: ConnectionStatus
  setStatus: (status: ConnectionStatus) => void
  setJoined: (boardId: string, me: User) => void
  reset: () => void
}

const initial = {
  me: null,
  boardId: null,
  status: 'idle' as ConnectionStatus,
}

export const useSessionStore = create<SessionState>()((set) => ({
  ...initial,

  setStatus: (status) => set({ status }),
  // Called when the server's join reply arrives.
  setJoined: (boardId, me) => set({ boardId, me, status: 'joined' }),
  // Called when the user leaves the board page.
  reset: () => set(initial),
}))
