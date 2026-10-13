import { beforeEach, describe, expect, it } from 'vitest'
import { useSessionStore } from '@/stores/sessionStore'

const initial = useSessionStore.getState()

const state = () => useSessionStore.getState()

describe('sessionStore', () => {
  beforeEach(() => useSessionStore.setState(initial, true))

  it('starts idle with nobody on a board', () => {
    expect(state()).toMatchObject({ me: null, boardId: null, status: 'idle' })
  })

  it('setStatus changes only the status', () => {
    state().setStatus('connecting')

    expect(state()).toMatchObject({
      me: null,
      boardId: null,
      status: 'connecting',
    })
  })

  it('setJoined sets the board and me, and the status becomes joined', () => {
    const me = { id: 'u1', name: 'Ana', color: '#2E7D52' }

    state().setJoined('k7x2qm9a', me)

    expect(state()).toMatchObject({ me, boardId: 'k7x2qm9a', status: 'joined' })
  })

  it('keeps the board and me while reconnecting', () => {
    state().setJoined('k7x2qm9a', { id: 'u1', name: 'Ana', color: '#2E7D52' })

    state().setStatus('reconnecting')

    expect(state()).toMatchObject({
      boardId: 'k7x2qm9a',
      status: 'reconnecting',
    })
    expect(state().me?.name).toBe('Ana')
  })

  it('reset goes back to the starting state', () => {
    state().setJoined('k7x2qm9a', { id: 'u1', name: 'Ana', color: '#2E7D52' })

    state().reset()

    expect(state()).toMatchObject({ me: null, boardId: null, status: 'idle' })
  })
})
