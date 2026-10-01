import { create } from 'zustand'
import type { Tool } from '@/types'

interface ToolState {
  tool: Tool
  selectedId: string | null
  stroke: string
  strokeWidth: number
}

// State shape only. Actions arrive with the tools feature.
export const useToolStore = create<ToolState>()(() => ({
  tool: 'select',
  selectedId: null,
  stroke: '#111827',
  strokeWidth: 2,
}))
