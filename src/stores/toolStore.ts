import { create } from 'zustand'
import type { Tool } from '@/types'

interface ToolState {
  tool: Tool
  selectedIds: string[] // the shapes that are selected
  draggingId: string | null // the shape being dragged right now
  stroke: string
  strokeWidth: number
  setTool: (tool: Tool) => void
  select: (ids: string[]) => void
  setDragging: (id: string | null) => void
}

export const useToolStore = create<ToolState>()((set) => ({
  tool: 'select',
  selectedIds: [],
  draggingId: null,
  stroke: '#111827',
  strokeWidth: 2,

  // Switching tools clears the selection, so Delete can't remove a shape by accident.
  setTool: (tool) => set({ tool, selectedIds: [] }),
  select: (ids) => set({ selectedIds: ids }),
  setDragging: (id) => set({ draggingId: id }),
}))
