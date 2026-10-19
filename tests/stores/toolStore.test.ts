import { beforeEach, describe, expect, it } from 'vitest'
import { useToolStore } from '@/stores/toolStore'

const initial = useToolStore.getState()

const state = () => useToolStore.getState()

describe('toolStore', () => {
  beforeEach(() => useToolStore.setState(initial, true))

  it('starts with the select tool and nothing selected', () => {
    expect(state()).toMatchObject({ tool: 'select', selectedIds: [] })
  })

  it('select sets and clears the selected shapes', () => {
    state().select(['r1', 'r2'])
    expect(state().selectedIds).toEqual(['r1', 'r2'])

    state().select([])
    expect(state().selectedIds).toEqual([])
  })

  it('setDragging sets and clears the dragged shape', () => {
    expect(state().draggingId).toBeNull()

    state().setDragging('r1')
    expect(state().draggingId).toBe('r1')

    state().setDragging(null)
    expect(state().draggingId).toBeNull()
  })

  it('setTool changes the tool and clears the selection', () => {
    state().select(['r1', 'r2'])

    state().setTool('rect')

    expect(state()).toMatchObject({ tool: 'rect', selectedIds: [] })
  })
})
