import { create } from 'zustand'
import type { DrawingObject } from '@/types'

interface BoardState {
  objects: Record<string, DrawingObject>
  order: string[] // z-order, bottom to top
}

// State shape only. Actions arrive with the board feature.
export const useBoardStore = create<BoardState>()(() => ({
  objects: {},
  order: [],
}))
