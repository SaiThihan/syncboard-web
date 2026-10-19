import { beforeEach, describe, expect, it } from 'vitest'
import { commitTextEdit, TEXT_MAX_LENGTH } from '@/canvas/textTool'
import { useBoardStore } from '@/stores/boardStore'

const initialBoard = useBoardStore.getState()
const board = () => useBoardStore.getState()

describe('commitTextEdit', () => {
  beforeEach(() => {
    useBoardStore.setState(initialBoard, true)
    board().addObject({
      id: 't1',
      type: 'text',
      authorId: 'u1',
      version: 1,
      x: 200,
      y: 200,
      text: 'Hello',
      fontSize: 24,
      stroke: '#111827',
      strokeWidth: 2,
    })
    board().addObject({
      id: 'r1',
      type: 'rect',
      authorId: 'u1',
      version: 1,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      stroke: '#000000',
      strokeWidth: 2,
    })
  })

  it('changes the words and returns what to send, with the old words for a rollback', () => {
    const change = commitTextEdit('t1', '  Hello world ')

    expect(board().objects.t1).toMatchObject({ text: 'Hello world', x: 200 })
    expect(change).toEqual({
      id: 't1',
      patch: { text: 'Hello world' },
      previous: { text: 'Hello' },
    })
  })

  it('does nothing when the words are the same', () => {
    expect(commitTextEdit('t1', 'Hello')).toBeUndefined()
    expect(commitTextEdit('t1', '  Hello  ')).toBeUndefined()
  })

  it('does nothing for empty text, so the old words stay', () => {
    expect(commitTextEdit('t1', '   ')).toBeUndefined()
    expect(board().objects.t1).toMatchObject({ text: 'Hello' })
  })

  it('cuts text that is too long for the server', () => {
    const change = commitTextEdit('t1', 'a'.repeat(TEXT_MAX_LENGTH + 500))

    expect(change?.patch).toEqual({ text: 'a'.repeat(TEXT_MAX_LENGTH) })
  })

  it('ignores a shape that is not text, and an id that is not on the board', () => {
    expect(commitTextEdit('r1', 'x')).toBeUndefined()
    expect(commitTextEdit('nope', 'x')).toBeUndefined()
    expect(board().objects.r1).not.toHaveProperty('text')
  })
})
