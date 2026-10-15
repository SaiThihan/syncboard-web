import { CircleAlert } from 'lucide-react'
import { useState, type SubmitEvent } from 'react'
import { Button } from '@/components/ui/button'
import { NAME_MAX_LENGTH } from '@/lib/identity'

// Asks for a display name, for someone who opened a board link without going through
// the home page.
export default function NameForm({
  onSubmit,
}: {
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState('')
  const [showError, setShowError] = useState(false)

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed === '') {
      setShowError(true)
      return
    }
    onSubmit(trimmed)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold">What should we call you?</h1>
      <p className="text-muted-foreground">
        Your teammates will see this name next to your cursor.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-2">
        <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
          Display name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="nickname"
          autoFocus
          placeholder="How teammates will see you"
          aria-invalid={showError}
          aria-describedby={showError ? 'name-error' : undefined}
          className="h-12 w-full min-w-0 rounded-[10px] border-[1.5px] border-input bg-card px-3.5 text-base outline-none placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30 aria-invalid:border-destructive"
        />
        {showError && (
          <p
            id="name-error"
            role="alert"
            className="mt-1.5 flex gap-1.5 text-sm font-semibold text-destructive"
          >
            <CircleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            Enter a name so teammates know who is drawing.
          </p>
        )}
        <Button
          type="submit"
          className="mt-4 h-11 w-full text-base font-semibold"
        >
          Join board
        </Button>
      </form>
    </main>
  )
}
