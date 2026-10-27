import { describe, expect, it } from 'vitest'
import { noticeFor } from '@/hooks/useBoardSocket'

describe('noticeFor', () => {
  it('tells the person when the board is full', () => {
    expect(noticeFor('BOARD_FULL', 'save that shape')).toBe(
      'This board is full. Delete something to draw more.',
    )
  })

  it.each([
    'VALIDATION_FAILED',
    'NOT_JOINED',
    'OBJECT_NOT_FOUND',
    'INTERNAL',
  ] as const)('keeps the details out of the message for %s', (code) => {
    expect(noticeFor(code, 'move that shape')).toBe(
      'Could not move that shape. Please try again.',
    )
  })

  it('says what was being done', () => {
    expect(noticeFor('INTERNAL', 'delete that shape')).toContain(
      'delete that shape',
    )
  })
})
