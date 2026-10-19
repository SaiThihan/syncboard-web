import type { DrawingObject } from '@/types'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// Text width is guessed, because measuring it needs a canvas.
export const TEXT_CHAR_WIDTH = 0.6 // ponytail: guess, use ctx.measureText if text selection feels off

// The smallest box around a shape, in board coordinates.
export function boundsOf(object: DrawingObject): Rect {
  switch (object.type) {
    case 'rect':
    case 'circle':
      return {
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
      }
    case 'arrow':
      return {
        x: Math.min(object.x, object.x + object.dx),
        y: Math.min(object.y, object.y + object.dy),
        width: Math.abs(object.dx),
        height: Math.abs(object.dy),
      }
    case 'pen': {
      // the points are measured from (x, y)
      const xs = object.points.map((p) => object.x + p.x)
      const ys = object.points.map((p) => object.y + p.y)
      const x = Math.min(...xs)
      const y = Math.min(...ys)
      return {
        x,
        y,
        width: Math.max(...xs) - x,
        height: Math.max(...ys) - y,
      }
    }
    case 'text':
      return {
        x: object.x,
        y: object.y,
        width: object.text.length * object.fontSize * TEXT_CHAR_WIDTH,
        height: object.fontSize,
      }
  }
}

// Do the two boxes overlap, even a little?
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x <= b.x + b.width &&
    b.x <= a.x + a.width &&
    a.y <= b.y + b.height &&
    b.y <= a.y + a.height
  )
}
