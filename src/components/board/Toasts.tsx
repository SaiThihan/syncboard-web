import type { Toast } from '@/hooks/useToasts'

// The messages above the toolbar. A screen reader reads each new one out politely.
export default function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute bottom-20 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map((toast) => (
        <p
          key={toast.id}
          className="rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-md"
        >
          {toast.text}
        </p>
      ))}
    </div>
  )
}
