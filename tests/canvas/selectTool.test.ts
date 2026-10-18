import { beforeEach, describe, expect, it } from 'vitest'
import { createSelectTool } from '@/canvas/selectTool'
import { useBoardStore } from '@/stores/boardStore'
import { useToolStore } from '@/stores/toolStore'

const initialBoard = useBoardStore.getState()
const initialTool = useToolStore.getState()

const board = () => useBoardStore.getState()
const tools = () => useToolStore.getState()

describe('select tool', () => {
  beforeEach(() => {
    useBoardStore.setState(initialBoard, true)
    useToolStore.setState(initialTool, true)
    board().addObject({
      id: 'r1',
      type: 'rect',
      authorId: 'u1',
      version: 1,
      x: 100,
      y: 50,
      width: 200,
      height: 80,
      stroke: '#000000',
      strokeWidth: 2,
    })
  })

  it('selects the shape under the press and marks it as dragged', () => {
    const tool = createSelectTool()

    tool.pointerDown({ x: 150, y: 90 })

    expect(tools().selectedId).toBe('r1')
    expect(tools().draggingId).toBe('r1')
  })

  it('selects nothing and drags nothing when the press is on empty space', () => {
    const tool = createSelectTool()

    tool.pointerDown({ x: 5, y: 5 })

    expect(tools().selectedId).toBeNull()
    expect(tools().draggingId).toBeNull()
  })

  it('moves the shape with the pointer and returns the final change on release', () => {
    const tool = createSelectTool()
    tool.pointerDown({ x: 150, y: 90 })

    tool.pointerMove({ x: 180, y: 110 })
    const change = tool.pointerUp()

    expect(board().objects.r1).toMatchObject({ x: 130, y: 70 })
    expect(change).toEqual({
      id: 'r1',
      patch: { x: 130, y: 70 },
      previous: { x: 100, y: 50 },
    })
    expect(tools().draggingId).toBeNull()
  })

  it('returns nothing for a click that does not move the shape', () => {
    const tool = createSelectTool()
    tool.pointerDown({ x: 150, y: 90 })

    expect(tool.pointerUp()).toBeUndefined()
    expect(tools().draggingId).toBeNull()
  })

  it('cancel puts the shape back and stops the drag', () => {
    const tool = createSelectTool()
    tool.pointerDown({ x: 150, y: 90 })
    tool.pointerMove({ x: 400, y: 300 })

    tool.cancel()

    expect(board().objects.r1).toMatchObject({ x: 100, y: 50 })
    expect(tools().draggingId).toBeNull()
    expect(tool.pointerUp()).toBeUndefined()
  })
})
