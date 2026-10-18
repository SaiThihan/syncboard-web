import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { throttle } from '@/lib/throttle'

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('lets the first call through at once', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    throttled(1)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1)
  })

  it('skips calls inside the interval but sends the latest one when it ends', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    throttled(1) // 0 ms: sent
    vi.advanceTimersByTime(16)
    throttled(2) // 16 ms: waits
    vi.advanceTimersByTime(17)
    throttled(3) // 33 ms: replaces 2
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(17) // 50 ms
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(3)
  })

  it('sends nothing extra when the calls stop', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    throttled(1)
    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('lets a call through at once after a quiet interval', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)
    throttled(1)

    vi.advanceTimersByTime(60)
    throttled(2)

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(2)
  })

  it('sends about 20 per second for 60 calls per second', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    for (let i = 0; i < 60; i++) {
      throttled(i)
      vi.advanceTimersByTime(1000 / 60)
    }
    vi.advanceTimersByTime(100)

    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(19)
    expect(fn.mock.calls.length).toBeLessThanOrEqual(22)
    expect(fn).toHaveBeenLastCalledWith(59) // the final position is not lost
  })

  it('cancel drops a call that is waiting', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)
    throttled(1)
    throttled(2)

    throttled.cancel()
    vi.advanceTimersByTime(100)

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
