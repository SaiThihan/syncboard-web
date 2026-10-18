import { ChevronDown, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePresenceStore } from '@/stores/presenceStore'
import { useSessionStore } from '@/stores/sessionStore'
import type { ConnectionStatus, User } from '@/types'

const MAX_AVATARS = 4

const STATUS: Record<ConnectionStatus, { text: string; dot: string }> = {
  idle: { text: 'Not connected', dot: 'bg-muted-foreground' },
  connecting: { text: 'Connecting', dot: 'bg-amber-500' },
  joined: { text: 'Connected', dot: 'bg-green-600' },
  reconnecting: { text: 'Reconnecting', dot: 'bg-amber-500' },
  error: { text: 'Connection problem', dot: 'bg-destructive' },
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join('')
    .toUpperCase()
}

// The colour comes from the server, so everyone sees the same colour for a person.
function Avatar({ user, small = false }: { user: User; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: user.color }}
      className={`inline-flex flex-none items-center justify-center rounded-full border-2 border-card font-bold text-white ${
        small ? 'size-8 text-xs' : 'size-10 text-sm [&+&]:-ml-2'
      }`}
    >
      {initialsOf(user.name)}
    </span>
  )
}

// Top-right of the board: the connection status and who is here. A click opens the full
// list, with a "You" tag on your own name.
export default function PresenceBar() {
  const status = useSessionStore((s) => s.status)
  const meId = useSessionStore((s) => s.me?.id)
  const users = usePresenceStore((s) => s.users)
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  // You first, then the others in the order they joined.
  const people = Object.values(users).sort(
    (a, b) => Number(b.id === meId) - Number(a.id === meId),
  )
  const shown = people.slice(0, MAX_AVATARS)
  const extra = people.length - shown.length

  // Escape or a click outside closes the list.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const { text, dot } = STATUS[status]
  const count = `${people.length} ${people.length === 1 ? 'person' : 'people'}`

  return (
    <div ref={root} className="relative">
      <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-md">
        <span className="flex items-center gap-2 px-3 text-sm font-semibold">
          <span className={`size-2.5 rounded-full ${dot}`} aria-hidden="true" />
          {text}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="people-list"
          aria-label={`Who is here. ${count}.`}
          className="flex min-h-11 items-center rounded-full p-1 hover:bg-accent focus-visible:ring-3 focus-visible:ring-primary/30 focus-visible:outline-none"
        >
          <span className="hidden items-center md:flex">
            {shown.map((user) => (
              <Avatar key={user.id} user={user} />
            ))}
            {extra > 0 && (
              <span className="ml-1 text-sm font-semibold">+{extra}</span>
            )}
          </span>
          <span className="flex items-center gap-1.5 px-2.5 text-sm font-semibold md:hidden">
            <Users className="size-4" aria-hidden="true" />
            {people.length}
          </span>
          <span className="hidden items-center gap-1.5 px-3 text-sm font-semibold md:inline-flex">
            Who is here
            <ChevronDown className="size-4" aria-hidden="true" />
          </span>
        </button>
      </div>

      {open && (
        <div
          id="people-list"
          role="dialog"
          aria-labelledby="people-title"
          className="absolute right-0 top-full z-20 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-[14px] border bg-card p-4 shadow-lg"
        >
          <h2 id="people-title" className="m-0 text-lg font-bold">
            Who is here
          </h2>
          <ul className="m-0 mt-3 list-none space-y-2 p-0">
            {people.map((user) => (
              <li key={user.id} className="flex items-center gap-3">
                <Avatar user={user} small />
                <span className="font-semibold">{user.name}</span>
                {user.id === meId && (
                  <span className="ml-auto text-sm text-muted-foreground">
                    You
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
