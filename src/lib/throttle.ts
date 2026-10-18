// Calls `fn` at most once per `intervalMs`. The first call goes through at once, and
// when calls keep coming, the latest arguments are sent when the interval ends, so the
// last value is never lost.
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  intervalMs: number,
) {
  let lastCall = -Infinity
  let timer: ReturnType<typeof setTimeout> | undefined
  let latest: A | undefined

  const throttled = (...args: A) => {
    const wait = intervalMs - (Date.now() - lastCall)
    if (wait <= 0) {
      throttled.cancel()
      lastCall = Date.now()
      fn(...args)
      return
    }
    latest = args
    timer ??= setTimeout(() => {
      timer = undefined
      const args = latest
      latest = undefined
      lastCall = Date.now()
      if (args) fn(...args)
    }, wait)
  }

  // Drops a call that is still waiting.
  throttled.cancel = () => {
    clearTimeout(timer)
    timer = undefined
    latest = undefined
  }

  return throttled
}
