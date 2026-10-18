import { useCallback, useEffect, useRef } from 'react'
import type { MoveChange } from '@/canvas/selectTool'
import { socket } from '@/lib/socket'
import { useBoardStore } from '@/stores/boardStore'
import { usePresenceStore } from '@/stores/presenceStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useToolStore } from '@/stores/toolStore'
import type {
  DrawingObject,
  ErrorCode,
  Identity,
  NewObject,
  ServerToClientEvents,
} from '@/types'

// What to tell the user when the server refuses a change.
function noticeFor(code: ErrorCode, what: string): string {
  return code === 'BOARD_FULL'
    ? 'This board is full. Delete something to draw more.'
    : `Could not ${what}. Please try again.`
}

// Connects to the server and joins the board while the page is open, applies what other
// people do, and sends what this user does. Our own changes show on screen at once; if the
// server refuses one, it is rolled back and `onNotice` says so.
export function useBoardSocket(
  boardId: string,
  identity: Identity,
  onNotice: (message: string) => void,
) {
  // Shapes whose own update is waiting for the server's reply, with how many.
  const inFlight = useRef(new Map<string, number>())

  useEffect(() => {
    let leftPage = false
    useSessionStore.getState().setStatus('connecting')

    function join() {
      socket.emit('board:join', { boardId, user: identity }, (res) => {
        if (leftPage) return // the reply came after the user left
        if (!res.ok) {
          useSessionStore.getState().setStatus('error')
          return
        }
        // The server's list replaces everything we had, so a rejoin catches up.
        const { board, me } = res.data
        useBoardStore.getState().setObjects(board.objects)
        usePresenceStore.getState().setUsers(board.users)
        useSessionStore.getState().setJoined(boardId, me)
      })
    }
    const onDisconnect = () =>
      useSessionStore.getState().setStatus('reconnecting')
    const onConnectError = () => useSessionStore.getState().setStatus('error')

    // Changes other people made. The server does not echo our own changes back to us.
    const onAdded: ServerToClientEvents['object:added'] = ({ object }) =>
      useBoardStore.getState().addObject(object)
    const onUpdated: ServerToClientEvents['object:updated'] = ({
      id,
      patch,
      version,
    }) => {
      // Our own change wins while we hold the shape or wait for the server to confirm
      // it, because ours will be the last write.
      if (useToolStore.getState().draggingId === id) return
      if (inFlight.current.has(id)) return
      useBoardStore.getState().applyUpdate(id, patch, version)
    }
    const onDeleted: ServerToClientEvents['object:deleted'] = ({ id }) => {
      useBoardStore.getState().deleteObject(id)
      const tools = useToolStore.getState()
      if (tools.selectedId === id) tools.select(null)
    }

    socket.on('connect', join)
    socket.on('object:added', onAdded)
    socket.on('object:updated', onUpdated)
    socket.on('object:deleted', onDeleted)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.connect()

    const waiting = inFlight.current
    return () => {
      leftPage = true
      socket.off('connect', join)
      socket.off('object:added', onAdded)
      socket.off('object:updated', onUpdated)
      socket.off('object:deleted', onDeleted)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.disconnect()
      waiting.clear()
      useBoardStore.getState().setObjects([])
      usePresenceStore.getState().setUsers([])
      useSessionStore.getState().reset()
    }
  }, [boardId, identity])

  const sendCreated = useCallback(
    (shape: NewObject) => {
      socket.emit('object:add', { object: shape }, (res) => {
        const board = useBoardStore.getState()
        if (res.ok) {
          board.applyUpdate(shape.id, {}, res.data.version) // 0 becomes 1
          return
        }
        board.deleteObject(shape.id) // rollback
        onNotice(noticeFor(res.error.code, 'save that shape'))
      })
    },
    [onNotice],
  )

  const sendMoved = useCallback(
    ({ id, patch, previous }: MoveChange) => {
      const waiting = inFlight.current
      waiting.set(id, (waiting.get(id) ?? 0) + 1)
      socket.emit('object:update', { id, patch }, (res) => {
        const left = (waiting.get(id) ?? 1) - 1
        if (left > 0) waiting.set(id, left)
        else waiting.delete(id)

        const board = useBoardStore.getState()
        if (res.ok) {
          board.applyUpdate(id, {}, res.data.version)
        } else if (res.error.code === 'OBJECT_NOT_FOUND') {
          board.deleteObject(id) // someone deleted it meanwhile
        } else {
          board.updateObject(id, previous) // rollback
          onNotice(noticeFor(res.error.code, 'move that shape'))
        }
      })
    },
    [onNotice],
  )

  const sendDeleted = useCallback(
    (shape: DrawingObject) => {
      socket.emit('object:delete', { id: shape.id }, (res) => {
        if (res.ok || res.error.code === 'OBJECT_NOT_FOUND') return
        // rollback: the shape comes back on top, whatever its old place was
        useBoardStore.getState().addObject(shape)
        onNotice(noticeFor(res.error.code, 'delete that shape'))
      })
    },
    [onNotice],
  )

  return { sendCreated, sendMoved, sendDeleted }
}
