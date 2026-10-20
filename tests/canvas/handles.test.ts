import { describe, expect, it } from 'vitest'
import { handlesOf, hitHandle, resizePatch } from '@/canvas/handles'
import type { DrawingObject } from '@/types'

const base = { authorId: 'u1', version: 1, stroke: '#000000', strokeWidth: 2 }
const rect: DrawingObject = {
  ...base,
  id: 'r',
  type: 'rect',
  x: 100,
  y: 50,
  width: 200,
  height: 80,
}
const arrow: DrawingObject = {
  ...base,
  id: 'a',
  type: 'arrow',
  x: 10,
  y: 20,
  dx: 100,
  dy: 40,
}
const text: DrawingObject = {
  ...base,
  id: 't',
  type: 'text',
  x: 0,
  y: 0,
  text: 'Hello',
  fontSize: 20,
}

describe('handlesOf', () => {
  it('puts four handles on the corners of a rectangle or circle', () => {
    expect(handlesOf(rect)).toEqual([
      { id: 'nw', x: 100, y: 50 },
      { id: 'ne', x: 300, y: 50 },
      { id: 'se', x: 300, y: 130 },
      { id: 'sw', x: 100, y: 130 },
    ])
    expect(handlesOf({ ...rect, type: 'circle' })).toHaveLength(4)
  })

  it('puts a handle on each end of an arrow', () => {
    expect(handlesOf(arrow)).toEqual([
      { id: 'start', x: 10, y: 20 },
      { id: 'end', x: 110, y: 60 },
    ])
  })

  it('puts one handle at the bottom right of text', () => {
    expect(handlesOf(text)).toEqual([{ id: 'text', x: 60, y: 20 }])
  })

  it('gives a pen stroke none, because the server cannot change its points', () => {
    const pen: DrawingObject = {
      ...base,
      id: 'p',
      type: 'pen',
      x: 0,
      y: 0,
      points: [{ x: 0, y: 0 }],
    }

    expect(handlesOf(pen)).toEqual([])
  })
})

describe('hitHandle', () => {
  it('finds a handle close to the point and nothing far from it', () => {
    const handles = handlesOf(rect)

    expect(hitHandle(handles, { x: 303, y: 128 })?.id).toBe('se')
    expect(hitHandle(handles, { x: 200, y: 90 })).toBeUndefined()
  })
})

describe('resizePatch', () => {
  it('keeps the opposite corner fixed for each corner of a rectangle', () => {
    expect(resizePatch(rect, 'se', { x: 400, y: 200 })).toEqual({
      x: 100,
      y: 50,
      width: 300,
      height: 150,
    })
    expect(resizePatch(rect, 'nw', { x: 50, y: 20 })).toEqual({
      x: 50,
      y: 20,
      width: 250,
      height: 110,
    })
    expect(resizePatch(rect, 'ne', { x: 350, y: 10 })).toEqual({
      x: 100,
      y: 10,
      width: 250,
      height: 120,
    })
    expect(resizePatch(rect, 'sw', { x: 60, y: 160 })).toEqual({
      x: 60,
      y: 50,
      width: 240,
      height: 110,
    })
  })

  it('stops at a small size instead of flipping when dragged past the other corner', () => {
    expect(resizePatch(rect, 'se', { x: 0, y: 0 })).toEqual({
      x: 100,
      y: 50,
      width: 10,
      height: 10,
    })
    expect(resizePatch(rect, 'nw', { x: 900, y: 900 })).toEqual({
      x: 290,
      y: 120,
      width: 10,
      height: 10,
    })
  })

  it('moves the tip of an arrow', () => {
    expect(resizePatch(arrow, 'end', { x: 60, y: 30 })).toEqual({
      dx: 50,
      dy: 10,
    })
  })

  it('moves the tail of an arrow while the tip stays where it is', () => {
    // the tip is at (110, 60)
    expect(resizePatch(arrow, 'start', { x: 50, y: 40 })).toEqual({
      x: 50,
      y: 40,
      dx: 60,
      dy: 20,
    })
  })

  it('scales the font size with the distance from the corner', () => {
    // 'Hello' at size 20 is 60 wide
    expect(resizePatch(text, 'text', { x: 120, y: 20 })).toEqual({
      fontSize: 40,
    })
    expect(resizePatch(text, 'text', { x: 30, y: 20 })).toEqual({
      fontSize: 10,
    })
  })

  it('keeps the font size between 8 and 200', () => {
    expect(resizePatch(text, 'text', { x: 1, y: 0 })).toEqual({ fontSize: 8 })
    expect(resizePatch(text, 'text', { x: 9000, y: 0 })).toEqual({
      fontSize: 200,
    })
  })
})
