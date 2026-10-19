import type { DrawingObject } from '@/types'
import { boundsOf, type Rect } from './bounds'

const ARROW_HEAD = 12

// Draws one shape. Moving a shape only changes its x and y, so a pen stroke's
// points are relative to (x, y).
function drawObject(ctx: CanvasRenderingContext2D, object: DrawingObject) {
  ctx.strokeStyle = object.stroke
  ctx.lineWidth = object.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (object.type) {
    case 'rect':
      if (object.fill) {
        ctx.fillStyle = object.fill
        ctx.fillRect(object.x, object.y, object.width, object.height)
      }
      ctx.strokeRect(object.x, object.y, object.width, object.height)
      break

    case 'circle':
      // width and height are the box around the circle
      ctx.beginPath()
      ctx.ellipse(
        object.x + object.width / 2,
        object.y + object.height / 2,
        object.width / 2,
        object.height / 2,
        0,
        0,
        Math.PI * 2,
      )
      if (object.fill) {
        ctx.fillStyle = object.fill
        ctx.fill()
      }
      ctx.stroke()
      break

    case 'arrow': {
      const endX = object.x + object.dx
      const endY = object.y + object.dy
      const angle = Math.atan2(object.dy, object.dx)
      ctx.beginPath()
      ctx.moveTo(object.x, object.y)
      ctx.lineTo(endX, endY)
      // two short lines going back from the tip make the arrow head
      for (const side of [-1, 1]) {
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - ARROW_HEAD * Math.cos(angle + side * (Math.PI / 6)),
          endY - ARROW_HEAD * Math.sin(angle + side * (Math.PI / 6)),
        )
      }
      ctx.stroke()
      break
    }

    case 'pen':
      ctx.beginPath()
      object.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(object.x + p.x, object.y + p.y)
        else ctx.lineTo(object.x + p.x, object.y + p.y)
      })
      ctx.stroke()
      break

    case 'text':
      ctx.fillStyle = object.stroke
      ctx.font = `${object.fontSize}px sans-serif`
      ctx.textBaseline = 'top'
      ctx.fillText(object.text, object.x, object.y)
      break
  }
}

// Clears the canvas and draws every object in list order (the last one ends up on top).
// The caller may have moved the origin (for scrolling), so the clearing ignores that.
export function renderBoard(
  ctx: CanvasRenderingContext2D,
  objects: DrawingObject[],
) {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
  for (const object of objects) drawObject(ctx, object)
}

const SELECTION_COLOR = '#2F5BEA'
const SELECTION_PADDING = 6

// A dashed box around each selected shape.
export function drawSelection(
  ctx: CanvasRenderingContext2D,
  selected: DrawingObject[],
) {
  ctx.save()
  ctx.strokeStyle = SELECTION_COLOR
  ctx.lineWidth = 1.5
  ctx.setLineDash([5, 4])
  for (const object of selected) {
    const box = boundsOf(object)
    ctx.strokeRect(
      box.x - SELECTION_PADDING,
      box.y - SELECTION_PADDING,
      box.width + SELECTION_PADDING * 2,
      box.height + SELECTION_PADDING * 2,
    )
  }
  ctx.restore()
}

// The box being dragged to select several shapes.
export function drawMarquee(ctx: CanvasRenderingContext2D, box: Rect) {
  ctx.save()
  ctx.fillStyle = 'rgba(47, 91, 234, 0.08)'
  ctx.strokeStyle = SELECTION_COLOR
  ctx.lineWidth = 1
  ctx.setLineDash([5, 4])
  ctx.fillRect(box.x, box.y, box.width, box.height)
  ctx.strokeRect(box.x, box.y, box.width, box.height)
  ctx.restore()
}
