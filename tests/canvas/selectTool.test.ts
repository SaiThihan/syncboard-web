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

    expect(tools().selectedIds).toEqual(['r1'])
    expect(tools().draggingId).toBe('r1')
  })

  it('selects nothing and drags nothing when the press is on empty space', () => {
    const tool = createSelectTool()

    tool.pointerDown({ x: 5, y: 5 })

    expect(tools().selectedIds).toEqual([])
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

  describe('selection box', () => {
    const addRect = (id: string, x: number, y: number) =>
      board().addObject({
        id,
        type: 'rect',
        authorId: 'u1',
        version: 1,
        x,
        y,
        width: 50,
        height: 50,
        stroke: '#000000',
        strokeWidth: 2,
      })
    const dragBox = (
      from: { x: number; y: number },
      to: { x: number; y: number },
    ) => {
      const tool = createSelectTool()
      tool.pointerDown(from)
      tool.pointerMove(to)
      return tool
    }

    it('selects every shape the box touches, in drawing order', () => {
      addRect('r2', 400, 400)
      addRect('r3', 900, 900)

      dragBox({ x: 0, y: 0 }, { x: 450, y: 450 }).pointerUp()

      expect(tools().selectedIds).toEqual(['r1', 'r2'])
    })

    it('selects a shape that is only partly inside the box', () => {
      dragBox({ x: 250, y: 100 }, { x: 600, y: 300 }).pointerUp()

      expect(tools().selectedIds).toEqual(['r1']) // r1 ends at x 300
    })

    it('selects nothing for a box over empty space', () => {
      dragBox({ x: 800, y: 800 }, { x: 900, y: 900 }).pointerUp()

      expect(tools().selectedIds).toEqual([])
    })

    it('works when the box is dragged up and to the left', () => {
      dragBox({ x: 450, y: 450 }, { x: 0, y: 0 }).pointerUp()

      expect(tools().selectedIds).toEqual(['r1'])
    })

    it('a click on empty space clears the selection', () => {
      tools().select(['r1'])

      const tool = createSelectTool()
      tool.pointerDown({ x: 800, y: 800 })
      tool.pointerUp()

      expect(tools().selectedIds).toEqual([])
    })

    it('shows the box while dragging and not after the release', () => {
      const tool = dragBox({ x: 300, y: 200 }, { x: 100, y: 50 })

      expect(tool.selectionBox()).toEqual({
        x: 100,
        y: 50,
        width: 200,
        height: 150,
      })

      tool.pointerUp()
      expect(tool.selectionBox()).toBeNull()
    })

    it('cancel drops the box without selecting anything', () => {
      const tool = dragBox({ x: 0, y: 0 }, { x: 450, y: 450 })

      tool.cancel()
      tool.pointerUp()

      expect(tool.selectionBox()).toBeNull()
      expect(tools().selectedIds).toEqual([])
    })

    it('does not report a move for a selection box', () => {
      expect(dragBox({ x: 0, y: 0 }, { x: 450, y: 450 }).pointerUp()).toBe(
        undefined,
      )
    })
  })

  describe('resizing', () => {
    it('drags a corner handle of the one selected shape and returns the change', () => {
      const tool = createSelectTool()
      tools().select(['r1'])

      tool.pointerDown({ x: 300, y: 130 }) // the bottom right handle of r1
      tool.pointerMove({ x: 400, y: 200 })
      const change = tool.pointerUp()

      expect(board().objects.r1).toMatchObject({ width: 300, height: 150 })
      expect(change).toEqual({
        id: 'r1',
        patch: { x: 100, y: 50, width: 300, height: 150 },
        previous: { x: 100, y: 50, width: 200, height: 80 },
      })
      expect(tools().selectedIds).toEqual(['r1'])
      expect(tools().draggingId).toBeNull()
    })

    it('does not move the shape while a handle is dragged', () => {
      const tool = createSelectTool()
      tools().select(['r1'])

      tool.pointerDown({ x: 300, y: 130 })
      tool.pointerMove({ x: 500, y: 400 })

      expect(board().objects.r1).toMatchObject({ x: 100, y: 50 })
    })

    it('returns nothing when the handle is pressed and released without moving', () => {
      const tool = createSelectTool()
      tools().select(['r1'])

      tool.pointerDown({ x: 300, y: 130 })

      expect(tool.pointerUp()).toBeUndefined()
    })

    it('puts the shape back on cancel', () => {
      const tool = createSelectTool()
      tools().select(['r1'])
      tool.pointerDown({ x: 300, y: 130 })
      tool.pointerMove({ x: 400, y: 200 })

      tool.cancel()

      expect(board().objects.r1).toMatchObject({ width: 200, height: 80 })
      expect(tools().draggingId).toBeNull()
      expect(tool.pointerUp()).toBeUndefined()
    })

    it('only uses handles when exactly one shape is selected', () => {
      board().addObject({
        id: 'r2',
        type: 'rect',
        authorId: 'u1',
        version: 1,
        x: 600,
        y: 600,
        width: 50,
        height: 50,
        stroke: '#000000',
        strokeWidth: 2,
      })
      const tool = createSelectTool()
      tools().select(['r1', 'r2'])

      // (300, 130) is r1's corner: with two selected it is an ordinary press on r1
      tool.pointerDown({ x: 300, y: 130 })
      tool.pointerMove({ x: 400, y: 200 })

      expect(board().objects.r1).toMatchObject({ x: 200, y: 120, width: 200 })
    })
  })
})
