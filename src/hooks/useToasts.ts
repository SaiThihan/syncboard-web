import { useCallback, useRef, useState } from 'react'

export interface Toast {
  id: number
  text: string
}

const MAX_TOASTS = 4
const TOAST_MS = 4000

// Short messages that disappear by themselves, newest last.
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const notify = useCallback((text: string) => {
    const id = nextId.current++
    setToasts((list) => [...list.slice(-(MAX_TOASTS - 1)), { id, text }])
    setTimeout(
      () => setToasts((list) => list.filter((toast) => toast.id !== id)),
      TOAST_MS,
    )
  }, [])

  return { toasts, notify }
}
