import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createIdentity, getIdentity } from '@/lib/identity'

// sessionStorage does not exist in Node, so each test gets a stand-in.
function stubStorage(overrides: Partial<Storage> = {}) {
  const data = new Map<string, string>()
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    ...overrides,
  }
  vi.stubGlobal('sessionStorage', storage)
  return data
}

describe('identity', () => {
  beforeEach(() => {
    stubStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is empty before a name was entered', () => {
    expect(getIdentity()).toBeNull()
  })

  it('remembers the name and a generated id', () => {
    const made = createIdentity('Ana')

    expect(made.name).toBe('Ana')
    expect(made.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(getIdentity()).toEqual(made)
  })

  it('keeps the same id when the name changes in the same tab', () => {
    const first = createIdentity('Ana')

    const second = createIdentity('Ana P.')

    expect(second.id).toBe(first.id)
    expect(second.name).toBe('Ana P.')
  })

  it.each([
    ['text that is not JSON', 'not json {'],
    ['JSON that is not an object', '42'],
    ['an object without a name', '{"id":"u1"}'],
    ['an object without an id', '{"name":"Ana"}'],
    ['an id that is not text', '{"id":7,"name":"Ana"}'],
  ])('acts as if nothing is saved for %s', (_name, saved) => {
    const data = stubStorage()
    data.set('syncboard.identity', saved)

    expect(getIdentity()).toBeNull()
  })

  it('acts as if nothing is saved when the browser blocks storage', () => {
    stubStorage({
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError')
      },
    })

    expect(getIdentity()).toBeNull()
  })
})
