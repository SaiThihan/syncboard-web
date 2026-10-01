import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types'
import { API_URL } from './api'

// Single shared connection. Not connected until the join feature calls connect().
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  API_URL,
  { autoConnect: false },
)
