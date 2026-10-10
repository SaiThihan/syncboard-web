import type { DrawingObject, Point } from '@/types'

// How far from a line (arrow, pen) a click still counts as touching it.
const LINE_TOLERANCE = 6
// Text width is guessed, because measuring it needs a canvas.
const TEXT_CHAR_WIDTH = 0.6 // ponytail: guess, use ctx.measureText if text selection feels off

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  // t is how far along a→b the closest point is (0 = at a, 1 = at b)
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared),
        )
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function insideBox(
  p: Point,
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return p.x >= x && p.x <= x + width && p.y >= y && p.y <= y + height
}

// Is the point (in canvas coordinates) on this shape?
export function hitTest(object: DrawingObject, p: Point): boolean {
  const reach = LINE_TOLERANCE + object.strokeWidth / 2

  switch (object.type) {
    case 'rect':
      return insideBox(p, object.x, object.y, object.width, object.height)

    case 'circle': {
      const rx = object.width / 2
      const ry = object.height / 2
      if (rx === 0 || ry === 0) return false
      const nx = (p.x - (object.x + rx)) / rx
      const ny = (p.y - (object.y + ry)) / ry
      return nx * nx + ny * ny <= 1
    }

    case 'arrow':
      return (
        distanceToSegment(
          p,
          { x: object.x, y: object.y },
          { x: object.x + object.dx, y: object.y + object.dy },
        ) <= reach
      )

    case 'pen': {
      const points = object.points.map((q) => ({
        x: object.x + q.x,
        y: object.y + q.y,
      }))
      if (points.length === 1) {
        return Math.hypot(p.x - points[0].x, p.y - points[0].y) <= reach
      }
      return points.some(
        (q, i) => i > 0 && distanceToSegment(p, points[i - 1], q) <= reach,
      )
    }

    case 'text':
      return insideBox(
        p,
        object.x,
        object.y,
        object.text.length * object.fontSize * TEXT_CHAR_WIDTH,
        object.fontSize,
      )
  }
}

// Objects are in drawing order, so the last one is on top: check from the end.
export function findObjectAt(
  objects: DrawingObject[],
  p: Point,
): DrawingObject | undefined {
  return objects.findLast((object) => hitTest(object, p))
}
