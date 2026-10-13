import { create } from 'zustand'
import type { Cursor, User } from '@/types'

interface PresenceState {
  users: Record<string, User>
  cursors: Record<string, Cursor>
  setUsers: (list: User[]) => void
  addUser: (user: User) => void
  removeUser: (userId: string) => void
  setCursor: (cursor: Cursor) => void
}

export const usePresenceStore = create<PresenceState>()((set) => ({
  users: {},
  cursors: {},

  // Replaces everyone, e.g. from the join reply. Cursors start again from the next move.
  setUsers: (list) =>
    set({
      users: Object.fromEntries(list.map((user) => [user.id, user])),
      cursors: {},
    }),

  addUser: (user) =>
    set((state) => ({ users: { ...state.users, [user.id]: user } })),

  // A user who left takes their cursor with them.
  removeUser: (userId) =>
    set((state) => {
      const users = { ...state.users }
      const cursors = { ...state.cursors }
      delete users[userId]
      delete cursors[userId]
      return { users, cursors }
    }),

  // A cursor for someone who is not here (e.g. arrives after they left) is dropped.
  setCursor: (cursor) =>
    set((state) =>
      state.users[cursor.userId]
        ? { cursors: { ...state.cursors, [cursor.userId]: cursor } }
        : state,
    ),
}))
