import axios from 'axios'

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// REST client for board create/lookup. Calls arrive with the board feature.
export const api = axios.create({ baseURL: `${API_URL}/api` })
