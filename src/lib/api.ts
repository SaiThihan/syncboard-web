import axios from 'axios'
import type { BoardInfo, CreateBoardResponse } from '@/types'

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// The one HTTP client. Components call the functions below, never axios directly.
export const api = axios.create({ baseURL: `${API_URL}/api` })

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
