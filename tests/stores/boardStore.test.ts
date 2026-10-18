import { beforeEach, describe, expect, it } from 'vitest'
import type { DrawingObject } from '@/types'
import { useBoardStore } from '@/stores/boardStore'

const initial = useBoardStore.getState()

const rect = (id: string, x = 0): DrawingObject => ({
  id,
  type: 'rect',
  authorId: 'u1',
  version: 1,
  x,
  y: 0,
  width: 10,
  height: 10,
  stroke: '#000000',
  strokeWidth: 2,
})

const state = () => useBoardStore.getState()

describe('boardStore', () => {
  beforeEach(() => useBoardStore.setState(initial, true))

  describe('addObject', () => {
    it('puts a new shape on top', () => {
      state().addObject(rect('r1'))
      state().addObject(rect('r2'))

      expect(state().order).toEqual(['r1', 'r2'])
      expect(Object.keys(state().objects)).toEqual(['r1', 'r2'])
    })

    it('replaces a shape with the same id but keeps its place in the order', () => {
      state().addObject(rect('r1'))
      state().addObject(rect('r2'))
      state().addObject(rect('r1', 9))

      expect(state().order).toEqual(['r1', 'r2'])
      expect(state().objects.r1.x).toBe(9)
    })
  })

  describe('updateObject', () => {
    it('changes only the given fields', () => {
      state().addObject(rect('r1'))
      state().addObject(rect('r2'))

      state().updateObject('r1', { x: 130, y: 70 })

      expect(state().objects.r1).toMatchObject({ x: 130, y: 70, version: 1 })
      expect(state().objects.r1).toHaveProperty('width', 10)
      expect(state().objects.r2.x).toBe(0)
      expect(state().order).toEqual(['r1', 'r2'])
    })

    it('ignores an id that is not on the board', () => {
      state().addObject(rect('r1'))

      state().updateObject('nope', { x: 5 })

      expect(Object.keys(state().objects)).toEqual(['r1'])
    })
  })

  describe('applyUpdate', () => {
    it('applies a newer version and keeps the fields it does not mention', () => {
      state().addObject(rect('r1'))

      state().applyUpdate('r1', { x: 300 }, 2)

      expect(state().objects.r1).toMatchObject({ x: 300, version: 2 })
      expect(state().objects.r1).toHaveProperty('width', 10)
    })

    it('ignores the same version, so a repeated message changes nothing', () => {
      state().addObject(rect('r1'))
      state().applyUpdate('r1', { x: 300 }, 2)

      state().applyUpdate('r1', { x: 999 }, 2)

      expect(state().objects.r1.x).toBe(300)
    })

    it('ignores an older version, so a late message changes nothing', () => {
      state().addObject(rect('r1'))
      state().applyUpdate('r1', { x: 300 }, 3)

      state().applyUpdate('r1', { x: 111 }, 2)

      expect(state().objects.r1).toMatchObject({ x: 300, version: 3 })
    })

    it('can set only the version with an empty patch', () => {
      state().addObject({ ...rect('r1'), version: 0 })

      state().applyUpdate('r1', {}, 1)

      expect(state().objects.r1.version).toBe(1)
    })

    it('ignores an id that is not on the board and keeps the order', () => {
      state().addObject(rect('r1'))
      state().addObject(rect('r2'))

      state().applyUpdate('nope', { x: 5 }, 2)
      state().applyUpdate('r1', { x: 5 }, 2)

      expect(Object.keys(state().objects)).toEqual(['r1', 'r2'])
      expect(state().order).toEqual(['r1', 'r2'])
    })
  })

  describe('deleteObject', () => {
    it('removes the shape from the lookup and from the order', () => {
      state().addObject(rect('r1'))
      state().addObject(rect('r2'))

      state().deleteObject('r2')

      expect(Object.keys(state().objects)).toEqual(['r1'])
      expect(state().order).toEqual(['r1'])
    })

    it('ignores an id that is not on the board', () => {
      state().addObject(rect('r1'))

      state().deleteObject('nope')

      expect(state().order).toEqual(['r1'])
    })
  })

  describe('setObjects', () => {
    it('replaces everything and keeps the order of the list', () => {
      state().addObject(rect('r1'))
      state().addObject(rect('r3'))

      state().setObjects([rect('r2', 5), rect('r1')])

      expect(Object.keys(state().objects).sort()).toEqual(['r1', 'r2'])
      expect(state().order).toEqual(['r2', 'r1'])
      expect(state().objects.r2.x).toBe(5)
    })

    it('empties the board for an empty list', () => {
      state().addObject(rect('r1'))

      state().setObjects([])

      expect(state().objects).toEqual({})
      expect(state().order).toEqual([])
    })
  })
})
