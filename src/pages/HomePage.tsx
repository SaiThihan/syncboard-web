import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">SyncBoard</h1>
      <p className="text-muted-foreground">
        Real-time collaborative whiteboard.
      </p>
      <Button disabled>Create board (coming soon)</Button>
    </main>
  )
}
