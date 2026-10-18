import { usePresenceStore } from '@/stores/presenceStore'

// Other people's cursors, drawn over the canvas with their name and colour. It sits on
// top of the canvas but lets every mouse event through, and it is hidden from screen
// readers because the user list already says who is here.
export default function CursorLayer() {
  const users = usePresenceStore((s) => s.users)
  const cursors = usePresenceStore((s) => s.cursors)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {Object.values(cursors).map((cursor) => {
        const user = users[cursor.userId]
        if (!user) return null
        return (
          <div
            key={cursor.userId}
            className="absolute left-0 top-0 transition-transform duration-75 ease-linear"
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          >
            <svg width="18" height="20" viewBox="0 0 18 20" fill={user.color}>
              <path
                d="M1 1 L1 17 L5.5 13 L8.5 19 L11 18 L8 12 L14 12 Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{ backgroundColor: user.color }}
              className="ml-3.5 -mt-1 inline-block max-w-40 truncate rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            >
              {user.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
