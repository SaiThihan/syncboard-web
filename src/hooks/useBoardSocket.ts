import { useEffect } from 'react'
import { socket } from '@/lib/socket'
import { useBoardStore } from '@/stores/boardStore'
import { usePresenceStore } from '@/stores/presenceStore'
import { useSessionStore } from '@/stores/sessionStore'
import type { Identity } from '@/types'

// Connects to the server and joins the board while the page is open.
// The join is sent from the `connect` event, which fires on the first connection and
// again after every automatic reconnect, so a dropped connection rejoins by itself.
export function useBoardSocket(boardId: string, identity: Identity) {
  useEffect(() => {
    let leftPage = false
    const session = useSessionStore.getState()
    session.setStatus('connecting')

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

    socket.on('connect', join)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.connect()

    return () => {
      leftPage = true
      socket.off('connect', join)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.disconnect()
      useBoardStore.getState().setObjects([])
      usePresenceStore.getState().setUsers([])
      useSessionStore.getState().reset()
    }
  }, [boardId, identity])
}
