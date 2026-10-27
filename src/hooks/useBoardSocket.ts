import { useCallback, useEffect, useRef } from 'react'
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
  ObjectChange,
  Point,
  ServerToClientEvents,
} from '@/types'

// What to tell the user when the server refuses a change.
export function noticeFor(code: ErrorCode, what: string): string {
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
  onBoardGone: () => void,
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
          // The board is gone (it expired, or the server restarted), which is not a
          // connection problem.
          if (res.error.code === 'BOARD_NOT_FOUND') onBoardGone()
          else useSessionStore.getState().setStatus('error')
          return
        }
        // The server's list replaces everything we had, so a rejoin catches up.
        const { board, me } = res.data
        useBoardStore.getState().setObjects(board.objects)
        // A shape that was selected may have been deleted while we were away.
        const tools = useToolStore.getState()
        const present = new Set(board.objects.map((object) => object.id))
        tools.select(tools.selectedIds.filter((id) => present.has(id)))
        usePresenceStore.getState().setUsers(board.users)
        useSessionStore.getState().setJoined(boardId, me)
        // A reply that was on its way when the connection dropped will never come, and
        // the snapshot already shows the server's answer, so stop waiting for it.
        inFlight.current.clear()
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
      if (tools.selectedIds.includes(id)) {
        tools.select(tools.selectedIds.filter((selected) => selected !== id))
      }
    }

    // People coming and going. A user with several tabs only counts as one.
    const onJoined: ServerToClientEvents['presence:joined'] = ({ user }) => {
      const presence = usePresenceStore.getState()
      const known = user.id in presence.users
      presence.addUser(user)
      if (!known) onNotice(`${user.name} joined the board`)
    }
    const onLeft: ServerToClientEvents['presence:left'] = ({ userId }) => {
      const presence = usePresenceStore.getState()
      const user = presence.users[userId]
      presence.removeUser(userId)
      if (user) onNotice(`${user.name} left the board`)
    }

    const onCursor: ServerToClientEvents['cursor:moved'] = (cursor) =>
      usePresenceStore.getState().setCursor(cursor)

    socket.on('connect', join)
    socket.on('cursor:moved', onCursor)
    socket.on('presence:joined', onJoined)
    socket.on('presence:left', onLeft)
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
      socket.off('cursor:moved', onCursor)
      socket.off('presence:joined', onJoined)
      socket.off('presence:left', onLeft)
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
  }, [boardId, identity, onNotice, onBoardGone])

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

  const sendChanged = useCallback(
    ({ id, patch, previous }: ObjectChange) => {
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
          onNotice(noticeFor(res.error.code, 'change that shape'))
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

  // Volatile: if the connection is down, the position is dropped instead of queued, so
  // nobody gets a burst of old cursor positions after a reconnect.
  const sendCursor = useCallback((point: Point) => {
    socket.volatile.emit('cursor:move', point)
  }, [])

  return { sendCreated, sendChanged, sendDeleted, sendCursor }
}
