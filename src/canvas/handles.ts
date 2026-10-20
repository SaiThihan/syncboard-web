import type { DrawingObject, ObjectPatch, Point } from '@/types'
import { boundsOf } from './bounds'

// The small squares on a selected shape that you drag to resize it.
export type HandleId = 'nw' | 'ne' | 'se' | 'sw' | 'start' | 'end' | 'text'

export interface Handle extends Point {
  id: HandleId
}

// A rectangle or circle cannot be made smaller than this, and text stays readable.
const MIN_SIZE = 10
const MIN_FONT_SIZE = 8
const MAX_FONT_SIZE = 200
// How close a press must be to a handle to grab it.
const GRAB_RADIUS = 9

// Where the handles of a shape are. A pen stroke has none: the server only lets a
// client change where a stroke is, not its points.
export function handlesOf(object: DrawingObject): Handle[] {
  const box = boundsOf(object)
  const right = box.x + box.width
  const bottom = box.y + box.height

  switch (object.type) {
    case 'rect':
    case 'circle':
      return [
        { id: 'nw', x: box.x, y: box.y },
        { id: 'ne', x: right, y: box.y },
        { id: 'se', x: right, y: bottom },
        { id: 'sw', x: box.x, y: bottom },
      ]
    case 'arrow':
      return [
        { id: 'start', x: object.x, y: object.y },
        { id: 'end', x: object.x + object.dx, y: object.y + object.dy },
      ]
    case 'text':
      return [{ id: 'text', x: right, y: bottom }]
    case 'pen':
      return []
  }
}

// The handle under the point, if any.
export function hitHandle(handles: Handle[], p: Point): Handle | undefined {
  return handles.find((h) => Math.hypot(p.x - h.x, p.y - h.y) <= GRAB_RADIUS)
}

// What the shape's fields become when this handle is dragged to the point. It always
// starts from the shape as it was before the drag, so small errors never build up.
export function resizePatch(
  original: DrawingObject,
  handle: HandleId,
  p: Point,
): ObjectPatch {
  switch (original.type) {
    case 'rect':
    case 'circle': {
      // the corner opposite the handle stays where it is
      const right = original.x + original.width
      const bottom = original.y + original.height
      const x =
        handle === 'nw' || handle === 'sw'
          ? Math.min(p.x, right - MIN_SIZE)
          : original.x
      const y =
        handle === 'nw' || handle === 'ne'
          ? Math.min(p.y, bottom - MIN_SIZE)
          : original.y
      const farX =
        handle === 'ne' || handle === 'se'
          ? Math.max(p.x, original.x + MIN_SIZE)
          : right
      const farY =
        handle === 'sw' || handle === 'se'
          ? Math.max(p.y, original.y + MIN_SIZE)
          : bottom
      return { x, y, width: farX - x, height: farY - y }
    }
    case 'arrow': {
      if (handle === 'start') {
        const endX = original.x + original.dx
        const endY = original.y + original.dy
        return { x: p.x, y: p.y, dx: endX - p.x, dy: endY - p.y }
      }
      return { dx: p.x - original.x, dy: p.y - original.y }
    }
    case 'text': {
      // the text grows or shrinks with the distance from its top-left corner
      const width = Math.max(1, boundsOf(original).width)
      const scaled = Math.round(
        (original.fontSize * (p.x - original.x)) / width,
      )
      return {
        fontSize: Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, scaled)),
      }
    }
    case 'pen':
      return {}
  }
}
