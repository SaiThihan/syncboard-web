import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  drawHandles,
  drawMarquee,
  drawSelection,
  renderBoard,
} from '@/canvas/render'
import { handlesOf } from '@/canvas/handles'
import { findObjectAt } from '@/canvas/hitTest'
import { createSelectTool } from '@/canvas/selectTool'
import {
  createArrowTool,
  createCircleTool,
  createPenTool,
  createRectTool,
} from '@/canvas/shapeTools'
import { commitText, commitTextEdit, FONT_SIZE } from '@/canvas/textTool'
import TextBox from '@/components/canvas/TextBox'
import { throttle } from '@/lib/throttle'
import { useBoardStore } from '@/stores/boardStore'
import { useToolStore } from '@/stores/toolStore'
import type { NewObject, ObjectChange, Point } from '@/types'

const CURSOR_INTERVAL_MS = 50
// The board is this big. A smaller window shows part of it and scrolls.
const BOARD_WIDTH = 3000
const BOARD_HEIGHT = 2000
// The dot grid from the design: a dot every 24 pixels.
const DOTS =
  'radial-gradient(circle at 2px 2px, #C5CEDB 1.2px, transparent 1.7px)'

interface Props {
  // False while there is no connection: you can look and scroll, but nothing can be changed.
  editable: boolean
  // Called when the user finishes a change, so the caller can tell the server.
  onObjectCreated?: (shape: NewObject) => void
  onObjectChanged?: (change: ObjectChange) => void
  // Where the mouse is, at most 20 times per second.
  onCursorMove?: (point: Point) => void
  // Drawn on top of the board and scrolling with it, for example other people's cursors.
  children?: ReactNode
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

// A text box that is open: for new text (no id), or for changing a text shape.
interface TextEditor {
  point: Point
  id?: string
  text: string
  fontSize: number
}

// The drawing area. It sends mouse events to the tool picked in toolStore and redraws
// the board from boardStore. Mouse positions are converted to canvas coordinates first.
export default function BoardCanvas({
  editable,
  onObjectCreated,
  onObjectChanged,
  onCursorMove,
  children,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [selectTool] = useState(createSelectTool)
  const [drawTools] = useState(createDrawTools)
  const [textBox, setTextBox] = useState<TextEditor | null>(null)
  // Typed words are not kept when the connection drops: close the text box at that moment.
  const [wasEditable, setWasEditable] = useState(editable)
  if (editable !== wasEditable) {
    setWasEditable(editable)
    if (!editable) setTextBox(null)
  }
  // The shape whose words are being changed is not drawn, the text box shows them.
  const editingId = useRef<string | null>(null)
  const tool = useToolStore((s) => s.tool)

  // The mouse fires about 60 moves per second; other people only need 20.
  const reportCursor = useMemo(
    () => throttle((point: Point) => onCursorMove?.(point), CURSOR_INTERVAL_MS),
    [onCursorMove],
  )
  useEffect(() => () => reportCursor.cancel(), [reportCursor])

  // The canvas is only as big as the window. It draws the part of the board that has
  // scrolled into view, so a big board does not need a big canvas.
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const scroller = scrollerRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !scroller || !ctx) return
    // One canvas pixel per screen pixel. Changing the size clears the canvas, which is fine
    // because everything is drawn again right below.
    const width = Math.round(canvas.clientWidth * devicePixelRatio)
    const height = Math.round(canvas.clientHeight * devicePixelRatio)
    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height
    const { scrollLeft, scrollTop } = scroller
    canvas.style.backgroundPosition = `${-scrollLeft}px ${-scrollTop}px`

    const { objects, order } = useBoardStore.getState()
    const shapes = order
      .filter((id) => id !== editingId.current)
      .map((id) => objects[id])
    const preview = drawToolFor(drawTools)?.preview()
    ctx.setTransform(
      devicePixelRatio,
      0,
      0,
      devicePixelRatio,
      -scrollLeft * devicePixelRatio,
      -scrollTop * devicePixelRatio,
    )
    renderBoard(ctx, preview ? [...shapes, preview] : shapes)
    drawSelection(
      ctx,
      useToolStore
        .getState()
        .selectedIds.flatMap((id) => (objects[id] ? [objects[id]] : [])),
    )
    const { selectedIds } = useToolStore.getState()
    const only = selectedIds.length === 1 ? objects[selectedIds[0]] : undefined
    if (only) drawHandles(ctx, handlesOf(only))
    const box = selectTool.selectionBox()
    if (box) drawMarquee(ctx, box)
  }, [drawTools, selectTool])

  // Draw at most once per screen frame. Many changes can arrive within one frame (a burst
  // of shapes from someone else, a fast mouse), and only the last picture is ever seen.
  const frame = useRef(0)
  const requestDraw = useCallback(() => {
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      draw()
    })
  }, [draw])
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      frame.current = 0 // so a draw can be asked for again (React runs effects twice in dev)
    },
    [],
  )

  // Redraw when the shapes change and when the canvas changes size.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // At once, not at the next frame: after a resize the old picture would show stretched.
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    const unsubscribeBoard = useBoardStore.subscribe(requestDraw)
    const unsubscribeTools = useToolStore.subscribe(requestDraw)
    return () => {
      observer.disconnect()
      unsubscribeBoard()
      unsubscribeTools()
    }
  }, [draw, requestDraw])

  // The window can move to a screen with a different density without changing size, which
  // the resize observer does not notice. Watch for it and draw again with the new density.
  useEffect(() => {
    let query: MediaQueryList | undefined
    let stopped = false
    const watch = () => {
      query = matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
      query.addEventListener('change', onChange, { once: true })
    }
    function onChange() {
      if (stopped) return
      draw()
      watch()
    }
    watch()
    return () => {
      stopped = true
      query?.removeEventListener('change', onChange)
    }
  }, [draw])

  useEffect(() => {
    editingId.current = textBox?.id ?? null
    requestDraw()
  }, [textBox, requestDraw])

  // Escape cancels what is being drawn or dragged. It cancels every tool, so it does not
  // matter whether another Escape handler has already switched the tool.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'Escape') {
        selectTool.cancel()
        for (const tool of Object.values(drawTools)) tool.cancel()
        requestDraw()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectTool, drawTools, requestDraw])

  // clientX/clientY count from the window. The board's own top-left corner moves when the
  // board scrolls, so measuring from it gives board coordinates whatever the scroll is.
  function toBoardPoint(e: { clientX: number; clientY: number }): Point {
    const rect = contentRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target instanceof HTMLInputElement) return // a click inside the text box
    if (!editable) return
    e.currentTarget.setPointerCapture(e.pointerId) // keep getting events outside the board
    const tool = useToolStore.getState().tool
    if (tool === 'text') return // the text box opens on release
    const point = toBoardPoint(e)
    if (tool === 'select') selectTool.pointerDown(point)
    else drawTools[tool].pointerDown(point)
    requestDraw()
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target instanceof HTMLInputElement) return
    const tool = useToolStore.getState().tool
    const point = toBoardPoint(e)
    reportCursor(point)
    if (!editable) return
    // With no button pressed nothing is being drawn or dragged, so there is nothing to redraw.
    if (tool === 'text' || e.buttons === 0) return
    if (tool === 'select') selectTool.pointerMove(point)
    else drawTools[tool].pointerMove(point)
    requestDraw()
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.target instanceof HTMLInputElement) return
    if (!editable) {
      // The connection dropped while something was being drawn or dragged: drop it.
      selectTool.cancel()
      for (const drawTool of Object.values(drawTools)) drawTool.cancel()
      requestDraw()
      return
    }
    const tool = useToolStore.getState().tool
    if (tool === 'text') {
      setTextBox({ point: toBoardPoint(e), text: '', fontSize: FONT_SIZE })
      return
    }
    if (tool === 'select') {
      const change = selectTool.pointerUp()
      if (change) onObjectChanged?.(change)
    } else {
      const shape = drawTools[tool].pointerUp()
      if (shape) onObjectCreated?.(shape)
    }
    requestDraw()
  }

  // A double click on text, with the Select tool, opens it for changing.
  function onDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target instanceof HTMLInputElement) return
    if (!editable || useToolStore.getState().tool !== 'select') return
    const { objects, order } = useBoardStore.getState()
    const shape = findObjectAt(
      order.map((id) => objects[id]),
      toBoardPoint(e),
    )
    if (shape?.type !== 'text') return
    setTextBox({
      point: { x: shape.x, y: shape.y },
      id: shape.id,
      text: shape.text,
      fontSize: shape.fontSize,
    })
  }

  function onTextDone(text: string | null) {
    if (editable && text !== null && textBox) {
      if (textBox.id) {
        const change = commitTextEdit(textBox.id, text)
        if (change) onObjectChanged?.(change)
      } else {
        const shape = commitText(textBox.point, text)
        if (shape) onObjectCreated?.(shape)
      }
    }
    setTextBox(null)
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Whiteboard"
        style={{ backgroundImage: DOTS, backgroundSize: '24px 24px' }}
        className={`pointer-events-none absolute inset-0 block h-full w-full bg-[#F8FAFC] ${editable ? '' : 'opacity-50'}`}
      />
      <div
        ref={scrollerRef}
        onScroll={requestDraw}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          selectTool.cancel()
          drawToolFor(drawTools)?.cancel()
          requestDraw()
        }}
        className={`absolute inset-0 overflow-auto ${
          !editable
            ? 'cursor-not-allowed touch-pan-x touch-pan-y'
            : tool === 'select'
              ? 'touch-pan-x touch-pan-y'
              : 'cursor-crosshair touch-none'
        }`}
      >
        <div
          ref={contentRef}
          className="relative min-h-full min-w-full"
          style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
        >
          {children}
          {textBox && (
            <TextBox
              key={`${textBox.point.x},${textBox.point.y},${textBox.id ?? ''}`}
              point={textBox.point}
              initial={textBox.text}
              fontSize={textBox.fontSize}
              onDone={onTextDone}
            />
          )}
        </div>
      </div>
    </div>
  )
}
