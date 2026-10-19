import { useBoardStore } from '@/stores/boardStore'
import { useToolStore } from '@/stores/toolStore'
import type { ObjectChange, Point } from '@/types'
import { boundsOf, rectsIntersect, type Rect } from './bounds'
import { findObjectAt } from './hitTest'

interface Drag {
  id: string
  pointerStart: Point
  shapeStart: Point
}

// A box smaller than this in both directions is a click, not a selection box.
const MIN_BOX = 3

// The select tool. Press on a shape and drag to move it. Press on empty space and drag
// to draw a box that selects every shape it touches. Points are board coordinates.
// The server is not told while dragging: pointerUp returns the final change to send.
export function createSelectTool() {
  let drag: Drag | null = null
  let box: { start: Point; end: Point } | null = null

  function boxRect(): Rect | null {
    if (!box) return null
    return {
      x: Math.min(box.start.x, box.end.x),
      y: Math.min(box.start.y, box.end.y),
      width: Math.abs(box.start.x - box.end.x),
      height: Math.abs(box.start.y - box.end.y),
    }
  }

  return {
    pointerDown(point: Point) {
      const { objects, order } = useBoardStore.getState()
      const shape = findObjectAt(
        order.map((id) => objects[id]),
        point,
      )
      const tools = useToolStore.getState()
      tools.select(shape ? [shape.id] : [])
      tools.setDragging(shape?.id ?? null)
      drag = shape
        ? {
            id: shape.id,
            pointerStart: point,
            shapeStart: { x: shape.x, y: shape.y },
          }
        : null
      box = shape ? null : { start: point, end: point }
    },

    // Always measured from where the drag started, so small errors never build up.
    pointerMove(point: Point) {
      if (box) box.end = point
      if (!drag) return
      useBoardStore.getState().updateObject(drag.id, {
        x: drag.shapeStart.x + point.x - drag.pointerStart.x,
        y: drag.shapeStart.y + point.y - drag.pointerStart.y,
      })
    },

    // The selection box being dragged, for the canvas to draw.
    selectionBox: boxRect,

    // Puts the shape back where the drag started, e.g. for Escape.
    cancel() {
      if (drag) {
        useBoardStore.getState().updateObject(drag.id, drag.shapeStart)
      }
      drag = null
      box = null
      useToolStore.getState().setDragging(null)
    },

    // Returns the change to send to the server, or undefined if the shape did not move.
    pointerUp(): ObjectChange | undefined {
      const finishedBox = boxRect()
      box = null
      if (finishedBox) {
        if (finishedBox.width >= MIN_BOX || finishedBox.height >= MIN_BOX) {
          const { objects, order } = useBoardStore.getState()
          useToolStore
            .getState()
            .select(
              order.filter((id) =>
                rectsIntersect(boundsOf(objects[id]), finishedBox),
              ),
            )
        }
        return undefined
      }

      const finished = drag
      drag = null
      useToolStore.getState().setDragging(null)
      if (!finished) return undefined
      const shape = useBoardStore.getState().objects[finished.id]
      if (
        !shape ||
        (shape.x === finished.shapeStart.x && shape.y === finished.shapeStart.y)
      ) {
        return undefined
      }
      return {
        id: finished.id,
        patch: { x: shape.x, y: shape.y },
        previous: finished.shapeStart,
      }
    },
  }
}
