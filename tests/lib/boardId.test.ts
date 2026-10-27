import { describe, expect, it } from 'vitest'
import { isValidBoardId } from '@/lib/boardId'

describe('isValidBoardId', () => {
  it.each(['k7x2qm9a', 'AAAAAAAA', '12345678', 'ab-_CD12', '-_-_-_-_'])(
    'accepts %s',
    (id) => {
      expect(isValidBoardId(id)).toBe(true)
    },
  )

  it.each([
    ['empty', ''],
    ['too short', 'k7x2qm9'],
    ['too long', 'k7x2qm9ab'],
    ['a character that is not allowed', 'k7x2qm9!'],
    ['a space', 'k7x2 m9a'],
    ['a slash', 'k7x2/m9a'],
    ['a whole link', 'http://localhost:5173/board/k7x2qm9a'],
    ['a new line after it', 'k7x2qm9a\n'],
  ])('rejects %s', (_name, id) => {
    expect(isValidBoardId(id)).toBe(false)
  })
})
