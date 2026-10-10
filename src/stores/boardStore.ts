import { create } from 'zustand'
import type { DrawingObject, ObjectPatch } from '@/types'

interface BoardState {
  objects: Record<string, DrawingObject>
  order: string[] // z-order, bottom to top
  addObject: (object: DrawingObject) => void
  updateObject: (id: string, patch: ObjectPatch) => void
  deleteObject: (id: string) => void
}

export const useBoardStore = create<BoardState>()((set) => ({
  objects: {},
  order: [],

  // A new shape goes on top. An id already on the board keeps its place in the order.
  addObject: (object) =>
    set((state) => ({
      objects: { ...state.objects, [object.id]: object },
      order: state.objects[object.id]
        ? state.order
        : [...state.order, object.id],
    })),

  // Changes only the given fields. The place in `order` and the version stay as they are.
  updateObject: (id, patch) =>
    set((state) => {
      const object = state.objects[id]
      if (!object) return state
      return { objects: { ...state.objects, [id]: { ...object, ...patch } } }
    }),

  deleteObject: (id) =>
    set((state) => {
      if (!state.objects[id]) return state
      const objects = { ...state.objects }
      delete objects[id]
      return { objects, order: state.order.filter((x) => x !== id) }
    }),
}))
