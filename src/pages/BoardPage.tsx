import { LogOut } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import BoardMessage from '@/components/board/BoardMessage'
import NameForm from '@/components/board/NameForm'
import ShareBar from '@/components/board/ShareBar'
import Toasts from '@/components/board/Toasts'
import Toolbar from '@/components/board/Toolbar'
import BoardCanvas from '@/components/canvas/BoardCanvas'
import CursorLayer from '@/components/presence/CursorLayer'
import PresenceBar from '@/components/presence/PresenceBar'
import { Button } from '@/components/ui/button'
import { ApiError, getBoard } from '@/lib/api'
import { isValidBoardId } from '@/lib/boardId'
import { useBoardSocket } from '@/hooks/useBoardSocket'
import { useToasts } from '@/hooks/useToasts'
import { createIdentity, getIdentity } from '@/lib/identity'
import { useBoardStore } from '@/stores/boardStore'
import { useToolStore } from '@/stores/toolStore'
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

// The board while joined: the canvas fills the page, with the link and who is here on
// top of it, the tools below, and short messages (a refused change, someone joining).
function JoinedBoard({
  boardId,
  identity,
}: {
  boardId: string
  identity: Identity
}) {
  const { toasts, notify } = useToasts()
  const navigate = useNavigate()
  const { sendCreated, sendChanged, sendDeleted, sendCursor } = useBoardSocket(
    boardId,
    identity,
    notify,
  )

  // Removes every selected shape. The Delete button and the Delete key both use this.
  const deleteSelected = useCallback(() => {
    const { selectedIds, select } = useToolStore.getState()
    const { objects, deleteObject } = useBoardStore.getState()
    const shapes = selectedIds.flatMap((id) =>
      objects[id] ? [objects[id]] : [],
    )
    if (shapes.length === 0) return
    for (const shape of shapes) {
      deleteObject(shape.id)
      sendDeleted(shape)
    }
    select([])
  }, [sendDeleted])

  return (
    <main className="relative h-dvh">
      <BoardCanvas
        onObjectCreated={sendCreated}
        onObjectChanged={sendChanged}
        onCursorMove={sendCursor}
      >
        <CursorLayer />
      </BoardCanvas>
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/')}
          aria-label="Leave board"
          title="Leave this board and go back to the home page"
          className="h-13 gap-2 border bg-card px-3.5 font-semibold shadow-md md:px-4"
        >
          <LogOut aria-hidden="true" />
          <span className="hidden md:inline">Leave</span>
        </Button>
        <ShareBar boardId={boardId} notify={notify} />
      </div>
      <div className="absolute right-4 top-4 z-10">
        <PresenceBar />
      </div>
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <Toolbar onDelete={deleteSelected} />
      </div>
      <Toasts toasts={toasts} />
    </main>
  )
}
