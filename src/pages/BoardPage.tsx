import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import BoardMessage from '@/components/board/BoardMessage'
import { Button } from '@/components/ui/button'
import { ApiError, getBoard } from '@/lib/api'
import { isValidBoardId } from '@/lib/boardId'

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

  // The canvas arrives in Phase 7.
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-muted-foreground">Board {boardId}</p>
    </main>
  )
}
