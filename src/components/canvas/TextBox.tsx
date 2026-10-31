import { useRef } from 'react'
import { TEXT_MAX_LENGTH } from '@/canvas/textTool'
import type { Point } from '@/types'

// A text box over the canvas, because a canvas cannot receive typing.
// Enter or clicking away confirms the text, Escape cancels.
export default function TextBox({
  point,
  initial,
  fontSize,
  onDone,
}: {
  point: Point
  initial: string
  fontSize: number
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
      defaultValue={initial}
      maxLength={TEXT_MAX_LENGTH}
      onFocus={(e) => e.currentTarget.select()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(e.currentTarget.value)
        if (e.key === 'Escape') finish(null)
      }}
      onBlur={(e) => finish(e.currentTarget.value)}
      className="absolute m-0 w-60 border border-primary bg-transparent p-0 font-sans outline-none"
      style={{
        left: point.x,
        top: point.y,
        fontSize,
        lineHeight: 1,
      }}
    />
  )
}
