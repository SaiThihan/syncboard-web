import { describe, expect, it } from 'vitest'
import { boundsOf, rectsIntersect } from '@/canvas/bounds'
import type { DrawingObject } from '@/types'

const base = {
  authorId: 'u1',
  version: 1,
  stroke: '#000000',
  strokeWidth: 2,
}

describe('boundsOf', () => {
  it('uses the box of a rectangle and a circle', () => {
    const rect: DrawingObject = {
      ...base,
      id: 'a',
      type: 'rect',
      x: 100,
      y: 50,
      width: 200,
      height: 80,
    }

    expect(boundsOf(rect)).toEqual({ x: 100, y: 50, width: 200, height: 80 })
    expect(boundsOf({ ...rect, type: 'circle' })).toEqual({
      x: 100,
      y: 50,
      width: 200,
      height: 80,
    })
  })

  it('covers an arrow whichever way it points', () => {
    const arrow: DrawingObject = {
      ...base,
      id: 'a',
      type: 'arrow',
      x: 200,
      y: 100,
      dx: -50,
      dy: 60,
    }

    expect(boundsOf(arrow)).toEqual({ x: 150, y: 100, width: 50, height: 60 })
  })

  it('covers every point of a pen stroke, measured from its x and y', () => {
    const pen: DrawingObject = {
      ...base,
      id: 'a',
      type: 'pen',
      x: 10,
      y: 20,
      points: [
        { x: 0, y: 0 },
        { x: 30, y: 5 },
        { x: 10, y: 40 },
      ],
    }

    expect(boundsOf(pen)).toEqual({ x: 10, y: 20, width: 30, height: 40 })
  })

  it('guesses a box for text from its length and font size', () => {
    const text: DrawingObject = {
      ...base,
      id: 'a',
      type: 'text',
      x: 5,
      y: 6,
      text: 'Hello',
      fontSize: 20,
    }

    expect(boundsOf(text)).toEqual({ x: 5, y: 6, width: 60, height: 20 })
  })
})

describe('rectsIntersect', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 }

  it('is true for boxes that overlap, even a little', () => {
    expect(rectsIntersect(a, { x: 90, y: 90, width: 50, height: 50 })).toBe(
      true,
    )
  })

  it('is true when one box is inside the other', () => {
    expect(rectsIntersect(a, { x: 10, y: 10, width: 5, height: 5 })).toBe(true)
  })

  it('is false for boxes that are apart', () => {
    expect(rectsIntersect(a, { x: 200, y: 0, width: 50, height: 50 })).toBe(
      false,
    )
    expect(rectsIntersect(a, { x: 0, y: 200, width: 50, height: 50 })).toBe(
      false,
    )
  })
})
