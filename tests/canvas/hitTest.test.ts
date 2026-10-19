import { describe, expect, it } from 'vitest'
import { findObjectAt, hitTest } from '@/canvas/hitTest'
import type { DrawingObject } from '@/types'

const base = { authorId: 'u1', version: 1, stroke: '#000000', strokeWidth: 2 }
const rect = (id: string, x: number, y: number): DrawingObject => ({
  ...base,
  id,
  type: 'rect',
  x,
  y,
  width: 200,
  height: 80,
})

describe('hitTest', () => {
  it('hits a rectangle inside its box and misses outside it', () => {
    const r1 = rect('r1', 100, 50)

    expect(hitTest(r1, { x: 150, y: 90 })).toBe(true)
    expect(hitTest(r1, { x: 80, y: 90 })).toBe(false)
    expect(hitTest(r1, { x: 150, y: 140 })).toBe(false)
  })

  it('misses the empty corner of a circle box', () => {
    const circle: DrawingObject = {
      ...base,
      id: 'c',
      type: 'circle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }

    expect(hitTest(circle, { x: 50, y: 50 })).toBe(true)
    expect(hitTest(circle, { x: 2, y: 2 })).toBe(false)
  })

  it('hits an arrow near its line, not away from it or past its end', () => {
    const arrow: DrawingObject = {
      ...base,
      id: 'a',
      type: 'arrow',
      x: 0,
      y: 0,
      dx: 100,
      dy: 0,
    }

    expect(hitTest(arrow, { x: 50, y: 5 })).toBe(true)
    expect(hitTest(arrow, { x: 50, y: 30 })).toBe(false)
    expect(hitTest(arrow, { x: 130, y: 0 })).toBe(false)
  })

  it('hits a pen stroke near its segments, measured from its x and y', () => {
    const pen: DrawingObject = {
      ...base,
      id: 'p',
      type: 'pen',
      x: 10,
      y: 10,
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
      ],
    }

    expect(hitTest(pen, { x: 30, y: 13 })).toBe(true)
    expect(hitTest(pen, { x: 30, y: 40 })).toBe(false)
  })

  it('hits text inside the box guessed from its length and font size', () => {
    const text: DrawingObject = {
      ...base,
      id: 't',
      type: 'text',
      x: 0,
      y: 0,
      text: 'Hi',
      fontSize: 20,
    }

    expect(hitTest(text, { x: 10, y: 10 })).toBe(true)
    expect(hitTest(text, { x: 100, y: 10 })).toBe(false)
  })
})

describe('findObjectAt', () => {
  it('returns the top shape: the last one in drawing order', () => {
    const shapes = [rect('r1', 100, 50), rect('r2', 120, 60)]

    expect(findObjectAt(shapes, { x: 150, y: 90 })?.id).toBe('r2')
    expect(findObjectAt(shapes, { x: 105, y: 55 })?.id).toBe('r1')
    expect(findObjectAt(shapes, { x: 5, y: 5 })).toBeUndefined()
  })
})
