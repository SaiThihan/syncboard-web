import { beforeEach, describe, expect, it } from 'vitest'
import type { User } from '@/types'
import { usePresenceStore } from '@/stores/presenceStore'

const initial = usePresenceStore.getState()

const ana: User = { id: 'u1', name: 'Ana', color: '#2E7D52' }
const ben: User = { id: 'u2', name: 'Ben', color: '#B33A4C' }

const state = () => usePresenceStore.getState()

describe('presenceStore', () => {
  beforeEach(() => usePresenceStore.setState(initial, true))

  it('setUsers replaces everyone and clears the cursors', () => {
    state().setUsers([ana, ben])
    state().setCursor({ userId: 'u2', x: 1, y: 2 })

    state().setUsers([ana])

    expect(Object.keys(state().users)).toEqual(['u1'])
    expect(state().cursors).toEqual({})
  })

  it('addUser adds a user', () => {
    state().setUsers([ana])

    state().addUser(ben)

    expect(Object.keys(state().users)).toEqual(['u1', 'u2'])
  })

  it('removeUser removes the user and their cursor', () => {
    state().setUsers([ana, ben])
    state().setCursor({ userId: 'u2', x: 120, y: 80 })

    state().removeUser('u2')

    expect(Object.keys(state().users)).toEqual(['u1'])
    expect(state().cursors).toEqual({})
  })

  it('setCursor stores the cursor of a user on the board', () => {
    state().setUsers([ana, ben])

    state().setCursor({ userId: 'u2', x: 120, y: 80 })

    expect(state().cursors.u2).toEqual({ userId: 'u2', x: 120, y: 80 })
  })

  it('setCursor drops a cursor for someone who is not on the board', () => {
    state().setUsers([ana])

    state().setCursor({ userId: 'u9', x: 1, y: 1 })

    expect(state().cursors).toEqual({})
  })

  it('setCursor drops a cursor that arrives after the user left', () => {
    state().setUsers([ana, ben])
    state().removeUser('u2')

    state().setCursor({ userId: 'u2', x: 5, y: 5 })

    expect(state().cursors).toEqual({})
  })
})
