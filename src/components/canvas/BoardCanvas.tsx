import { useCallback, useEffect, useRef, useState } from 'react'
import { renderBoard } from '@/canvas/render'
import { createSelectTool } from '@/canvas/selectTool'
import {
  createArrowTool,
  createCircleTool,
  createPenTool,
  createRectTool,
} from '@/canvas/shapeTools'
import { commitText, FONT_SIZE, TEXT_MAX_LENGTH } from '@/canvas/textTool'
import { useBoardStore } from '@/stores/boardStore'
import { useToolStore } from '@/stores/toolStore'
import type { NewObject, ObjectPatch, Point } from '@/types'

interface Props {
  // Called when the user finishes a change, so the caller can tell the server.
  onObjectCreated?: (shape: NewObject) => void
  onObjectMoved?: (change: { id: string; patch: ObjectPatch }) => void
  onObjectDeleted?: (id: string) => void
}

// The text tool has no drag, so it is not here: a click opens a text box instead.
function createDrawTools() {
  return {
    pen: createPenTool(),
    rect: createRectTool(),
    circle: createCircleTool(),
    arrow: createArrowTool(),
  }
}
type DrawTools = ReturnType<typeof createDrawTools>

function drawToolFor(tools: DrawTools) {
  const tool = useToolStore.getState().tool
  return tool === 'select' || tool === 'text' ? undefined : tools[tool]
}

// A text box over the canvas, because a canvas cannot receive typing.
// Enter or clicking away confirms the text, Escape cancels.
function TextBox({
  point,
  onDone,
}: {
  point: Point
  onDone: (text: string | null) => void
}) {
  const finished = useRef(false)
  const finish = (text: string | null) => {
    if (finished.current) return
    finished.current = true
    onDone(text)
  }
  return (
    <input
      autoFocus
      aria-label="Text"
      maxLength={TEXT_MAX_LENGTH}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(e.currentTarget.value)
        if (e.key === 'Escape') finish(null)
      }}
      onBlur={(e) => finish(e.currentTarget.value)}
      className="absolute m-0 w-60 border border-primary bg-transparent p-0 font-sans outline-none"
      style={{
        left: point.x,
        top: point.y,
        fontSize: FONT_SIZE,
        lineHeight: 1,
      }}
    />
  )
}

// The drawing area. It sends mouse events to the tool picked in toolStore and redraws
// the board from boardStore. Mouse positions are converted to canvas coordinates first.
export default function BoardCanvas({
  onObjectCreated,
  onObjectMoved,
  onObjectDeleted,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectTool] = useState(createSelectTool)
  const [drawTools] = useState(createDrawTools)
  const [textBox, setTextBox] = useState<Point | null>(null)
  const tool = useToolStore((s) => s.tool)

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { objects, order } = useBoardStore.getState()
    const shapes = order.map((id) => objects[id])
    const preview = drawToolFor(drawTools)?.preview()
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    renderBoard(ctx, preview ? [...shapes, preview] : shapes)
  }, [drawTools])

  // Redraw when the shapes change and when the canvas changes size.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth * devicePixelRatio
      canvas.height = canvas.clientHeight * devicePixelRatio
      draw()
    })
    observer.observe(canvas)
    const unsubscribe = useBoardStore.subscribe(draw)
    return () => {
      observer.disconnect()
      unsubscribe()
    }
  }, [draw])

  // Escape cancels what is being drawn. Delete removes the selected shape.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'Escape') {
        drawToolFor(drawTools)?.cancel()
        draw()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const id = useToolStore.getState().selectedId
        if (!id) return
        useBoardStore.getState().deleteObject(id)
        useToolStore.getState().select(null)
        onObjectDeleted?.(id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawTools, draw, onObjectDeleted])

  // clientX/clientY count from the window, the canvas counts from its own top-left corner.
  function toCanvasPoint(e: React.PointerEvent): Point {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId) // keep getting events outside the canvas
    const tool = useToolStore.getState().tool
    if (tool === 'text') return // the text box opens on release
    const point = toCanvasPoint(e)
    if (tool === 'select') selectTool.pointerDown(point)
    else drawTools[tool].pointerDown(point)
    draw()
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const tool = useToolStore.getState().tool
    if (tool === 'text') return
    const point = toCanvasPoint(e)
    if (tool === 'select') selectTool.pointerMove(point)
    else drawTools[tool].pointerMove(point)
    draw()
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const tool = useToolStore.getState().tool
    if (tool === 'text') {
      setTextBox(toCanvasPoint(e))
      return
    }
    if (tool === 'select') {
      const change = selectTool.pointerUp()
      if (change) onObjectMoved?.(change)
    } else {
      const shape = drawTools[tool].pointerUp()
      if (shape) onObjectCreated?.(shape)
    }
    draw()
  }

  function onTextDone(text: string | null) {
    if (text !== null && textBox) {
      const shape = commitText(textBox, text)
      if (shape) onObjectCreated?.(shape)
    }
    setTextBox(null)
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Whiteboard"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drawToolFor(drawTools)?.cancel()
          draw()
        }}
        className={`block h-full w-full touch-none bg-card ${tool === 'select' ? '' : 'cursor-crosshair'}`}
      />
      {textBox && (
        <TextBox
          key={`${textBox.x},${textBox.y}`}
          point={textBox}
          onDone={onTextDone}
        />
      )}
    </div>
  )
}
