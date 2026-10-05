import type { ReactNode } from 'react'

interface BoardMessageProps {
  title: string
  text: string
  children?: ReactNode
}

// A centred message with optional buttons, for states like "board not found".
export default function BoardMessage({
  title,
  text,
  children,
}: BoardMessageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
      {children && <div className="mt-2 flex gap-2">{children}</div>}
    </main>
  )
}
