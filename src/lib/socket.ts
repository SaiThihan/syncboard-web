import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types'
import { API_URL } from './api'

// The one connection to the server, shared by the whole app. It stays closed until
// the board page calls socket.connect(), and the page closes it when the user leaves.
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  API_URL,
  { autoConnect: false },
)
