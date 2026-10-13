import { beforeEach, describe, expect, it } from 'vitest'
import { useToolStore } from '@/stores/toolStore'

const initial = useToolStore.getState()

const state = () => useToolStore.getState()

describe('toolStore', () => {
  beforeEach(() => useToolStore.setState(initial, true))

  it('starts with the select tool and nothing selected', () => {
    expect(state()).toMatchObject({ tool: 'select', selectedId: null })
  })

  it('select sets and clears the selected shape', () => {
    state().select('r1')
    expect(state().selectedId).toBe('r1')

    state().select(null)
    expect(state().selectedId).toBeNull()
  })

  it('setTool changes the tool and clears the selection', () => {
    state().select('r1')

    state().setTool('rect')

    expect(state()).toMatchObject({ tool: 'rect', selectedId: null })
  })
})
