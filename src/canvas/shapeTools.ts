import { getIdentity } from '@/lib/identity'
import { useBoardStore } from '@/stores/boardStore'
import { useToolStore } from '@/stores/toolStore'
import type { DrawingObject, NewObject, Point } from '@/types'

// A drag smaller than this in both directions is a click, not a shape.
const MIN_SIZE = 3
// Same limit as the server. A pen point closer than PEN_MIN_GAP to the last one is skipped.
const PEN_MAX_POINTS = 5000
const PEN_MIN_GAP = 2

// Everything a new shape has except what depends on the drag.
function baseOf(id: string) {
  const { stroke, strokeWidth } = useToolStore.getState()
  return { id, stroke, strokeWidth }
}

// Adds the shape to the board for this user and returns it for the server.
// version 0 until the server confirms and gives it version 1.
function addLocally(shape: NewObject): NewObject | undefined {
  const me = getIdentity()
  if (!me) return undefined
  useBoardStore.getState().addObject({ ...shape, authorId: me.id, version: 0 })
  return shape
}

// Shapes drawn by pressing, dragging and releasing: rectangle, circle and arrow.
// While dragging there is only a preview; the shape is created on release.
function createDragTool(build: (id: string, a: Point, b: Point) => NewObject) {
  let id = ''
  let start: Point | null = null
  let end: Point | null = null

  return {
    pointerDown(point: Point) {
      id = crypto.randomUUID()
      start = point
      end = point
    },

    pointerMove(point: Point) {
      if (start) end = point
    },

    // The shape being dragged, for the canvas to draw. Not in the store, not sent.
    preview(): DrawingObject | null {
      const me = getIdentity()
      if (!start || !end || !me) return null
      return { ...build(id, start, end), authorId: me.id, version: 0 }
    },

    cancel() {
      start = null
      end = null
    },

    // Returns the new shape for the server, or undefined for a click.
    pointerUp(): NewObject | undefined {
      const a = start
      const b = end
      start = null
      end = null
      if (!a || !b) return undefined
      if (Math.abs(a.x - b.x) < MIN_SIZE && Math.abs(a.y - b.y) < MIN_SIZE) {
        return undefined
      }
      return addLocally(build(id, a, b))
    },
  }
}

// The drag can go in any direction, so x and y are the smaller values.
function boxOf(a: Point, b: Point) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  }
}

export const createRectTool = () =>
  createDragTool((id, a, b) => ({
    ...baseOf(id),
    type: 'rect',
    ...boxOf(a, b),
  }))

export const createCircleTool = () =>
  createDragTool((id, a, b) => ({
    ...baseOf(id),
    type: 'circle',
    ...boxOf(a, b),
  }))

// The tail is where the drag started. dx and dy are end minus start, so they can be negative.
export const createArrowTool = () =>
  createDragTool((id, a, b) => ({
    ...baseOf(id),
    type: 'arrow',
    x: a.x,
    y: a.y,
    dx: b.x - a.x,
    dy: b.y - a.y,
  }))

// The pen: every mouse move adds a point. The shape is created on release.
// x and y are the first point, and the points are measured from it, so moving the
// stroke later only changes x and y.
export function createPenTool() {
  let id = ''
  let points: Point[] = []

  function build(): NewObject | null {
    const [first] = points
    if (!first) return null
    return {
      ...baseOf(id),
      type: 'pen',
      x: first.x,
      y: first.y,
      points: points.map((p) => ({ x: p.x - first.x, y: p.y - first.y })),
    }
  }

  return {
    pointerDown(point: Point) {
      id = crypto.randomUUID()
      points = [point]
    },

    pointerMove(point: Point) {
      const last = points.at(-1)
      if (!last || points.length >= PEN_MAX_POINTS) return
      if (Math.hypot(point.x - last.x, point.y - last.y) < PEN_MIN_GAP) return
      points.push(point)
    },

    preview(): DrawingObject | null {
      const me = getIdentity()
      const shape = build()
      if (!shape || !me) return null
      return { ...shape, authorId: me.id, version: 0 }
    },

    cancel() {
      points = []
    },

    // Returns the new stroke for the server, or undefined for a click with no movement.
    pointerUp(): NewObject | undefined {
      const shape = points.length >= 2 ? build() : null
      points = []
      return shape ? addLocally(shape) : undefined
    },
  }
}
