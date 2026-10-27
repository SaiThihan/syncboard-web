import axios, { isAxiosError, isCancel } from 'axios'
import type { BoardInfo, CreateBoardResponse, ErrorCode } from '@/types'

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Every failed request becomes an ApiError with a plain code, so components never
// need to know about Axios errors or HTTP status numbers.
export type ApiErrorCode = ErrorCode | 'NETWORK_ERROR' | 'UNKNOWN'

export class ApiError extends Error {
  readonly code: ApiErrorCode

  constructor(code: ApiErrorCode, message: string = code) {
    super(message)
    this.code = code
  }
}

// The codes the API puts in the body of an error reply ({ statusCode, code, message }).
const API_CODES: readonly string[] = [
  'NOT_FOUND',
  'BOARD_NOT_FOUND',
  'NOT_JOINED',
  'ALREADY_JOINED',
  'VALIDATION_FAILED',
  'OBJECT_NOT_FOUND',
  'DUPLICATE_OBJECT',
  'BOARD_FULL',
  'BOARD_LIMIT',
  'INTERNAL',
] satisfies ErrorCode[]

function toApiError(error: unknown): unknown {
  // A cancelled request (the page was left) stays as it is. Axios makes it a kind of
  // AxiosError, so it has to be checked first or it would look like a network failure.
  if (isCancel(error) || !isAxiosError(error)) return error
  if (!error.response) return new ApiError('NETWORK_ERROR', error.message)

  const body: unknown = error.response.data
  const code =
    typeof body === 'object' && body !== null && 'code' in body
      ? body.code
      : undefined
  if (typeof code === 'string' && API_CODES.includes(code)) {
    return new ApiError(code as ErrorCode)
  }
  // Not from our API (for example a proxy in front of it): a 400 still means bad input.
  return new ApiError(
    error.response.status === 400 ? 'VALIDATION_FAILED' : 'UNKNOWN',
  )
}

// The one HTTP client. Components call the functions below, never axios directly.
export const api = axios.create({ baseURL: `${API_URL}/api` })
api.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(toApiError(error)),
)

export async function createBoard(): Promise<string> {
  const { data } = await api.post<CreateBoardResponse>('/boards')
  return data.id
}

export async function getBoard(
  id: string,
  signal?: AbortSignal,
): Promise<BoardInfo> {
  const { data } = await api.get<BoardInfo>(`/boards/${id}`, { signal })
  return data
}
