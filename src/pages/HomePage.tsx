import { CircleAlert, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import BoardScene from '@/components/board/BoardScene'
import { Button } from '@/components/ui/button'
import { ApiError, createBoard } from '@/lib/api'
import { isValidBoardId } from '@/lib/boardId'
import { createIdentity, getIdentity, NAME_MAX_LENGTH } from '@/lib/identity'

interface FormValues {
  name: string
  join: string
}

const inputClass =
  'h-12 w-full min-w-0 rounded-[10px] border-[1.5px] border-input bg-card px-3.5 text-base outline-none placeholder:text-muted-foreground hover:border-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30 aria-invalid:border-destructive'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex gap-1.5 text-sm font-semibold text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { name: getIdentity()?.name ?? '', join: '' },
  })

  // Both actions need a display name. Submitting the form (Create board) checks only the name.
  const nameField = register('name', {
    validate: (value) =>
      value.trim() !== '' || 'Enter a name so teammates know who is drawing.',
  })
  const joinField = register('join', { onChange: () => clearErrors('join') })

  async function onCreate({ name }: FormValues) {
    try {
      const boardId = await createBoard()
      createIdentity(name.trim())
      navigate(`/board/${boardId}`)
    } catch (error) {
      const tooMany = error instanceof ApiError && error.code === 'BOARD_LIMIT'
      setError('root.create', {
        message: tooMany
          ? 'The server has too many boards right now. Try again in a few minutes.'
          : 'Could not create a board. Check your connection and try again.',
      })
    }
  }

  // Accepts a pasted link or just the id: the last part of the text is the id.
  async function onJoin() {
    if (!(await trigger('name'))) return
    const id = getValues('join').trim().split('/').filter(Boolean).pop() ?? ''
    if (!isValidBoardId(id)) {
      setError('join', {
        message: 'That is not a board link or an 8 character board id.',
      })
      return
    }
    createIdentity(getValues('name').trim())
    navigate(`/board/${id}`)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col px-5 pb-24 pt-6 lg:px-10">
      <header className="flex h-12 items-center gap-2 text-lg font-bold">
        <span className="relative inline-block h-7 w-9" aria-hidden="true">
          <span className="absolute left-0 top-0 h-7 w-7 rounded-full bg-[#2F5BEA]" />
          <span className="absolute left-3 top-0 h-7 w-7 rounded-full bg-[#2E7D52] opacity-90" />
        </span>
        SyncBoard
      </header>

      <div className="grid flex-1 grid-cols-1 content-start items-start gap-y-8 pt-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-x-14 lg:pt-16">
        <div className="lg:col-start-1 lg:row-start-1">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl">
            Think out loud with your team.
          </h1>
          <p className="mt-4 max-w-[46ch] text-lg text-muted-foreground">
            A shared whiteboard for retros and brainstorms. Draw, add notes, and
            see everyone's cursors live.
          </p>
        </div>

        <BoardScene className="lg:col-start-2 lg:row-start-1 lg:row-span-2" />

        <form
          onSubmit={handleSubmit(onCreate)}
          noValidate
          className="rounded-[14px] border bg-card p-5 shadow-[0_6px_20px_rgba(38,55,92,0.12)] lg:col-start-1 lg:row-start-2"
        >
          <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
            Display name
          </label>
          <input
            id="name"
            {...nameField}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="nickname"
            placeholder="How teammates will see you"
            aria-invalid={errors.name !== undefined}
            aria-describedby={
              errors.name ? 'name-hint name-error' : 'name-hint'
            }
            className={inputClass}
          />
          <p id="name-hint" className="mt-1.5 text-sm text-muted-foreground">
            Up to {NAME_MAX_LENGTH} characters. No account needed.
          </p>
          <FieldError id="name-error" message={errors.name?.message} />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 h-11 w-full text-base font-semibold"
          >
            <Plus aria-hidden="true" />
            {isSubmitting ? 'Creating...' : 'Create board'}
          </Button>
          <FieldError
            id="create-error"
            message={errors.root?.create?.message}
          />

          <hr className="my-5 border-border" />

          <label htmlFor="join" className="mb-1.5 block text-sm font-semibold">
            Join with a link or board ID
          </label>
          <div className="flex gap-2">
            <input
              id="join"
              {...joinField}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void onJoin()
                }
              }}
              autoComplete="off"
              spellCheck={false}
              placeholder="k7x2qm9a"
              aria-invalid={errors.join !== undefined}
              aria-describedby={
                errors.join ? 'join-hint join-error' : 'join-hint'
              }
              className={inputClass}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void onJoin()}
              className="h-12 px-5 text-base font-semibold"
            >
              Join board
            </Button>
          </div>
          <p id="join-hint" className="mt-1.5 text-sm text-muted-foreground">
            Paste a link, or type the 8 characters.
          </p>
          <FieldError id="join-error" message={errors.join?.message} />
        </form>
      </div>
    </main>
  )
}
