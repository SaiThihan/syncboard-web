import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import BoardMessage from '@/components/board/BoardMessage'
import NameForm from '@/components/board/NameForm'
import BoardCanvas from '@/components/canvas/BoardCanvas'
import CursorLayer from '@/components/presence/CursorLayer'
import PresenceBar from '@/components/presence/PresenceBar'
import { Button } from '@/components/ui/button'
import { ApiError, getBoard } from '@/lib/api'
import { isValidBoardId } from '@/lib/boardId'
import { useBoardSocket } from '@/hooks/useBoardSocket'
import { createIdentity, getIdentity } from '@/lib/identity'
import type { Identity } from '@/types'

type Status = 'loading' | 'ready' | 'not-found' | 'error'

// Checks the id in the URL, then loads the board. `key` restarts the loader for a new id.
export default function BoardPage() {
  const { boardId = '' } = useParams()
  const navigate = useNavigate()

  if (!isValidBoardId(boardId)) {
    return (
      <BoardMessage
        title="That is not a board link"
        text="Board ids are 8 characters long. Check the link and try again."
      >
        <Button onClick={() => navigate('/')}>Back to home</Button>
      </BoardMessage>
    )
  }
  return <BoardLoader key={boardId} boardId={boardId} />
}

function BoardLoader({ boardId }: { boardId: string }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')
  const [attempt, setAttempt] = useState(0)
  const [identity, setIdentity] = useState(getIdentity)

  useEffect(() => {
    const controller = new AbortController()
    getBoard(boardId, controller.signal)
      .then(() => setStatus('ready'))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const missing =
          error instanceof ApiError && error.code === 'BOARD_NOT_FOUND'
        setStatus(missing ? 'not-found' : 'error')
      })
    return () => controller.abort()
  }, [boardId, attempt])

  if (status === 'loading') {
    return (
      <main
        role="status"
        aria-label="Loading board"
        className="flex min-h-screen animate-pulse flex-col gap-4 p-4"
      >
        <div className="h-10 w-64 rounded-lg bg-muted" />
        <div className="flex-1 rounded-xl bg-muted" />
      </main>
    )
  }

  if (status === 'not-found') {
    return (
      <BoardMessage
        title="This board is not here"
        text="It may have expired. Boards are removed after 30 minutes with nobody on them."
      >
        <Button onClick={() => navigate('/')}>Back to home</Button>
      </BoardMessage>
    )
  }

  if (status === 'error') {
    return (
      <BoardMessage
        title="Could not load the board"
        text="Check your connection and try again."
      >
        <Button
          onClick={() => {
            setStatus('loading')
            setAttempt((n) => n + 1)
          }}
        >
          Try again
        </Button>
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to home
        </Button>
      </BoardMessage>
    )
  }

  // Someone who opened the link directly has no name yet: ask for it on this page.
  if (!identity) {
    return <NameForm onSubmit={(name) => setIdentity(createIdentity(name))} />
  }

  return <JoinedBoard boardId={boardId} identity={identity} />
}

// The board while joined: the canvas fills the page, with who is here on top of it and a
// notice when the server refuses a change.
function JoinedBoard({
  boardId,
  identity,
}: {
  boardId: string
  identity: Identity
}) {
  const [notice, setNotice] = useState<string | null>(null)
  const { sendCreated, sendMoved, sendDeleted, sendCursor } = useBoardSocket(
    boardId,
    identity,
    setNotice,
  )

  // A notice goes away by itself.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  return (
    <main className="relative h-dvh">
      <BoardCanvas
        onObjectCreated={sendCreated}
        onObjectMoved={sendMoved}
        onObjectDeleted={sendDeleted}
        onCursorMove={sendCursor}
      />
      <CursorLayer />
      <div className="absolute right-4 top-4 z-10">
        <PresenceBar />
      </div>
      {notice && (
        <p
          role="status"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border bg-card px-4 py-2 text-sm font-semibold shadow-md"
        >
          {notice}
        </p>
      )}
    </main>
  )
}
