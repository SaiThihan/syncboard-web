import { create } from 'zustand'
import type { Tool } from '@/types'

interface ToolState {
  tool: Tool
  selectedId: string | null
  draggingId: string | null // the shape being dragged right now
  stroke: string
  strokeWidth: number
  setTool: (tool: Tool) => void
  select: (id: string | null) => void
  setDragging: (id: string | null) => void
}

export const useToolStore = create<ToolState>()((set) => ({
  tool: 'select',
  selectedId: null,
  draggingId: null,
  stroke: '#111827',
  strokeWidth: 2,

  // Switching tools clears the selection, so Delete can't remove a shape by accident.
  setTool: (tool) => set({ tool, selectedId: null }),
  select: (id) => set({ selectedId: id }),
  setDragging: (id) => set({ draggingId: id }),
}))
