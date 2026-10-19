import { getIdentity } from '@/lib/identity'
import { useBoardStore } from '@/stores/boardStore'
import { useToolStore } from '@/stores/toolStore'
import type { NewObject, ObjectChange, Point } from '@/types'

type NewText = Extract<NewObject, { type: 'text' }>

export const FONT_SIZE = 24
// The same limit the server enforces, for the text box to use as its maxLength.
export const TEXT_MAX_LENGTH = 1000

// The text tool: a click opens a text box (React UI), and this runs when the text is
// confirmed with Enter or by clicking away. Escape never calls it.
// Adds the text to the board and returns it for the server (undefined if empty).
export function commitText(point: Point, text: string): NewText | undefined {
  const me = getIdentity()
  const trimmed = text.trim().slice(0, TEXT_MAX_LENGTH)
  if (!me || trimmed === '') return undefined

  const shape: NewText = {
    id: crypto.randomUUID(),
    type: 'text',
    x: point.x,
    y: point.y,
    text: trimmed,
    fontSize: FONT_SIZE,
    stroke: useToolStore.getState().stroke,
    strokeWidth: useToolStore.getState().strokeWidth,
  }
  // version 0 until the server confirms and gives it version 1
  useBoardStore.getState().addObject({ ...shape, authorId: me.id, version: 0 })
  return shape
}

// Changes the words of a text shape that is already on the board. Returns the change to
// send to the server, or undefined when there is nothing to send (empty or the same).
export function commitTextEdit(
  id: string,
  text: string,
): ObjectChange | undefined {
  const board = useBoardStore.getState()
  const shape = board.objects[id]
  const trimmed = text.trim().slice(0, TEXT_MAX_LENGTH)
  if (!shape || shape.type !== 'text') return undefined
  if (trimmed === '' || trimmed === shape.text) return undefined

  board.updateObject(id, { text: trimmed })
  return { id, patch: { text: trimmed }, previous: { text: shape.text } }
}
