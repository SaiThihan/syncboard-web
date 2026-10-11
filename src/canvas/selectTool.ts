import { useBoardStore } from '@/stores/boardStore'
import { useToolStore } from '@/stores/toolStore'
import type { ObjectPatch, Point } from '@/types'
import { findObjectAt } from './hitTest'

interface Drag {
  id: string
  pointerStart: Point
  shapeStart: Point
}

// The select tool: click picks a shape, drag moves it. Points are canvas coordinates.
// The server is not told while dragging: pointerUp returns the final change to send.
export function createSelectTool() {
  let drag: Drag | null = null

  return {
    pointerDown(point: Point) {
      const { objects, order } = useBoardStore.getState()
      const shape = findObjectAt(
        order.map((id) => objects[id]),
        point,
      )
      useToolStore.getState().select(shape?.id ?? null)
      drag = shape
        ? {
            id: shape.id,
            pointerStart: point,
            shapeStart: { x: shape.x, y: shape.y },
          }
        : null
    },

    // Always measured from where the drag started, so small errors never build up.
    pointerMove(point: Point) {
      if (!drag) return
      useBoardStore.getState().updateObject(drag.id, {
        x: drag.shapeStart.x + point.x - drag.pointerStart.x,
        y: drag.shapeStart.y + point.y - drag.pointerStart.y,
      })
    },

    // Returns the change to send to the server, or undefined if the shape did not move.
    pointerUp(): { id: string; patch: ObjectPatch } | undefined {
      const finished = drag
      drag = null
      if (!finished) return undefined
      const shape = useBoardStore.getState().objects[finished.id]
      if (
        !shape ||
        (shape.x === finished.shapeStart.x && shape.y === finished.shapeStart.y)
      ) {
        return undefined
      }
      return { id: finished.id, patch: { x: shape.x, y: shape.y } }
    },
  }
}
