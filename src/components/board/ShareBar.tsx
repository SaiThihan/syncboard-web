import { Link } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Top-left of the board: the board id, and a button that copies the link to send to
// someone else. The id can be selected with one click, in case copying is blocked.
export default function ShareBar({
  boardId,
  notify,
}: {
  boardId: string
  notify: (message: string) => void
}) {
  const copy = () =>
    navigator.clipboard
      .writeText(`${window.location.origin}/board/${boardId}`)
      .then(
        () => notify('Link copied'),
        () => notify('Could not copy the link'), // for example when the browser blocks it
      )

  return (
    <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-md">
      <span className="hidden items-baseline gap-1.5 pl-3 pr-2 text-sm md:flex">
        <span className="text-muted-foreground">Board ID</span>
        <span title="Click to select" className="select-all font-semibold">
          {boardId}
        </span>
      </span>
      <Button
        type="button"
        onClick={() => void copy()}
        title="Copy a link to invite others"
        className="h-11 gap-2 px-3 font-semibold md:px-4"
      >
        <Link aria-hidden="true" />
        <span className="sr-only md:not-sr-only">Copy link</span>
      </Button>
    </div>
  )
}
