// Contracts mirrored by hand from syncboard-api (separate repo, no shared package).

export type Tool = 'select' | 'pen' | 'rect' | 'circle' | 'arrow' | 'text'

export interface Point {
  x: number
  y: number
}

interface BaseObject {
  id: string
  authorId: string
  x: number
  y: number
  stroke: string
  strokeWidth: number
  fill?: string
  version: number
}

export type DrawingObject =
  | (BaseObject & { type: 'pen'; points: Point[] })
  | (BaseObject & { type: 'rect'; width: number; height: number })
  | (BaseObject & { type: 'circle'; width: number; height: number })
  | (BaseObject & { type: 'arrow'; dx: number; dy: number })
  | (BaseObject & { type: 'text'; text: string; fontSize: number })

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

// Sent by the client; the server stamps authorId and version.
export type NewObject = DistributiveOmit<DrawingObject, 'authorId' | 'version'>

export type ObjectPatch = Partial<{
  x: number
  y: number
  width: number
  height: number
  dx: number
  dy: number
  text: string
  fontSize: number
  stroke: string
  strokeWidth: number
  fill: string
}>

export interface Identity {
  id: string
  name: string
}

export interface User extends Identity {
  color: string
}

export interface Cursor {
  userId: string
  x: number
  y: number
}

export interface BoardSnapshot {
  id: string
  objects: DrawingObject[]
  users: User[]
}

export type ConnectionStatus =
  'idle' | 'connecting' | 'joined' | 'reconnecting' | 'error'

// REST
export interface CreateBoardResponse {
  id: string
}
export interface BoardInfo {
  id: string
  createdAt: number
}

// Socket.IO acks
export type ErrorCode =
  | 'NOT_FOUND'
  | 'BOARD_NOT_FOUND'
  | 'NOT_JOINED'
  | 'ALREADY_JOINED'
  | 'VALIDATION_FAILED'
  | 'OBJECT_NOT_FOUND'
  | 'DUPLICATE_OBJECT'
  | 'BOARD_FULL'
  | 'BOARD_LIMIT'
  | 'INTERNAL'

export type Ack<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string } }

// Socket.IO payloads: client -> server
export interface JoinBoardPayload {
  boardId: string
  user: Identity
}
export interface JoinBoardAck {
  board: BoardSnapshot
  me: User
}
export interface VersionAck {
  version: number
}

// Socket.IO payloads: server -> client
export interface ObjectUpdatedPayload {
  id: string
  patch: ObjectPatch
  version: number
}
export type CursorMovedPayload = Cursor

// Typed Socket.IO event maps
export interface ServerToClientEvents {
  'object:added': (payload: { object: DrawingObject }) => void
  'object:updated': (payload: ObjectUpdatedPayload) => void
  'object:deleted': (payload: { id: string }) => void
  'presence:joined': (payload: { user: User }) => void
  'presence:left': (payload: { userId: string }) => void
  'cursor:moved': (payload: CursorMovedPayload) => void
}

export interface ClientToServerEvents {
  'board:join': (
    payload: JoinBoardPayload,
    ack: (res: Ack<JoinBoardAck>) => void,
  ) => void
  'object:add': (
    payload: { object: NewObject },
    ack: (res: Ack<VersionAck>) => void,
  ) => void
  'object:update': (
    payload: { id: string; patch: ObjectPatch },
    ack: (res: Ack<VersionAck>) => void,
  ) => void
  'object:delete': (payload: { id: string }, ack: (res: Ack) => void) => void
  'cursor:move': (payload: { x: number; y: number }) => void
}
