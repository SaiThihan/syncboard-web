import { create } from 'zustand'
import type { DrawingObject, ObjectPatch } from '@/types'

interface BoardState {
  objects: Record<string, DrawingObject>
  order: string[] // z-order, bottom to top
  addObject: (object: DrawingObject) => void
  updateObject: (id: string, patch: ObjectPatch) => void
  applyUpdate: (id: string, patch: ObjectPatch, version: number) => void
  deleteObject: (id: string) => void
  setObjects: (list: DrawingObject[]) => void
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

  // For a change that came from the server. Applied only if its version is newer than
  // ours, so a repeated or late message changes nothing.
  applyUpdate: (id, patch, version) =>
    set((state) => {
      const object = state.objects[id]
      if (!object || version <= object.version) return state
      return {
        objects: { ...state.objects, [id]: { ...object, ...patch, version } },
      }
    }),

  deleteObject: (id) =>
    set((state) => {
      if (!state.objects[id]) return state
      const objects = { ...state.objects }
      delete objects[id]
      return { objects, order: state.order.filter((x) => x !== id) }
    }),

  // Replaces everything with the server's list (in drawing order), e.g. after joining.
  setObjects: (list) =>
    set({
      objects: Object.fromEntries(list.map((object) => [object.id, object])),
      order: list.map((object) => object.id),
    }),
}))
