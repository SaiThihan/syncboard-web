import {
  ArrowUpRight,
  Circle,
  MousePointer2,
  Pencil,
  RectangleHorizontal,
  Trash2,
  Type,
  type LucideIcon,
} from 'lucide-react'
import { useEffect } from 'react'
import { useToolStore } from '@/stores/toolStore'
import type { Tool } from '@/types'

const TOOLS: { tool: Tool; label: string; key: string; Icon: LucideIcon }[] = [
  { tool: 'select', label: 'Select', key: 'v', Icon: MousePointer2 },
  { tool: 'pen', label: 'Pen', key: 'p', Icon: Pencil },
  { tool: 'rect', label: 'Rectangle', key: 'r', Icon: RectangleHorizontal },
  { tool: 'circle', label: 'Circle', key: 'o', Icon: Circle },
  { tool: 'arrow', label: 'Arrow', key: 'a', Icon: ArrowUpRight },
  { tool: 'text', label: 'Text', key: 't', Icon: Type },
]

const buttonClass =
  'inline-flex size-10 items-center justify-center rounded-full hover:bg-accent focus-visible:ring-3 focus-visible:ring-primary/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-primary aria-pressed:text-primary-foreground md:size-11'

// The tool buttons and Delete, with the keyboard shortcuts: V P R O A T pick a tool,
// Delete removes the selected shape, and Escape goes back to the Select tool.
export default function Toolbar({ onDelete }: { onDelete: () => void }) {
  const tool = useToolStore((s) => s.tool)
  const selectedCount = useToolStore((s) => s.selectedIds.length)
  const setTool = useToolStore((s) => s.setTool)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLInputElement) return // typing, for example a text note

      const tools = useToolStore.getState()
      const picked = TOOLS.find((t) => t.key === e.key.toLowerCase())
      if (picked) {
        e.preventDefault()
        tools.setTool(picked.tool)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        onDelete()
      } else if (e.key === 'Escape') {
        tools.select([])
        if (tools.tool !== 'select') tools.setTool('select')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onDelete])

  return (
    <div
      role="toolbar"
      aria-label="Tools"
      className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-md"
    >
      {TOOLS.map(({ tool: t, label, key, Icon }) => (
        <button
          key={t}
          type="button"
          onClick={() => setTool(t)}
          aria-label={label}
          aria-pressed={tool === t}
          title={`${label}  ${key.toUpperCase()}`}
          className={buttonClass}
        >
          <Icon className="size-5" aria-hidden="true" />
        </button>
      ))}
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      <button
        type="button"
        onClick={onDelete}
        disabled={selectedCount === 0}
        aria-label={
          selectedCount > 1
            ? `Delete ${selectedCount} selected objects`
            : 'Delete selected object'
        }
        title="Delete  Del"
        className={buttonClass}
      >
        <Trash2 className="size-5" aria-hidden="true" />
      </button>
    </div>
  )
}
