import { useBoardStore } from '@/stores/boardStore'
import { useToolStore } from '@/stores/toolStore'
import type { DrawingObject, ObjectChange, ObjectPatch, Point } from '@/types'
import { boundsOf, rectsIntersect, type Rect } from './bounds'
import { handlesOf, hitHandle, resizePatch, type HandleId } from './handles'
import { findObjectAt } from './hitTest'

interface Drag {
  id: string
  pointerStart: Point
  shapeStart: Point
}

// A handle being dragged, with the shape as it was and the newest change so far.
interface Resize {
  original: DrawingObject
  handle: HandleId
  patch: ObjectPatch | null
}

// The values the shape had for the fields in the patch, for a rollback.
function previousOf(original: DrawingObject, patch: ObjectPatch): ObjectPatch {
  return Object.fromEntries(
    Object.entries(original).filter(([key]) => key in patch),
  )
}

// A box smaller than this in both directions is a click, not a selection box.
const MIN_BOX = 3

// The select tool. Press on a shape and drag to move it. Press on empty space and drag
// to draw a box that selects every shape it touches. Points are board coordinates.
// The server is not told while dragging: pointerUp returns the final change to send.
export function createSelectTool() {
  let drag: Drag | null = null
  let box: { start: Point; end: Point } | null = null
  let resize: Resize | null = null

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
      const tools = useToolStore.getState()

      // With one shape selected, a press on one of its handles starts a resize.
      const only =
        tools.selectedIds.length === 1
          ? objects[tools.selectedIds[0]]
          : undefined
      const grabbed = only && hitHandle(handlesOf(only), point)
      if (only && grabbed) {
        resize = { original: only, handle: grabbed.id, patch: null }
        drag = null
        box = null
        tools.setDragging(only.id)
        return
      }

      const shape = findObjectAt(
        order.map((id) => objects[id]),
        point,
      )
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
      if (resize) {
        resize.patch = resizePatch(resize.original, resize.handle, point)
        useBoardStore.getState().updateObject(resize.original.id, resize.patch)
        return
      }
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
      if (resize?.patch) {
        useBoardStore
          .getState()
          .updateObject(
            resize.original.id,
            previousOf(resize.original, resize.patch),
          )
      }
      resize = null
      if (drag) {
        useBoardStore.getState().updateObject(drag.id, drag.shapeStart)
      }
      drag = null
      box = null
      useToolStore.getState().setDragging(null)
    },

    // Returns the change to send to the server, or undefined if the shape did not move.
    pointerUp(): ObjectChange | undefined {
      if (resize) {
        const { original, patch } = resize
        resize = null
        useToolStore.getState().setDragging(null)
        return patch
          ? { id: original.id, patch, previous: previousOf(original, patch) }
          : undefined
      }
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
