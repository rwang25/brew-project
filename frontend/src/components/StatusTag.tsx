import { cn } from '@/lib/utils'
import { STATUS_ACCENT_CLASS } from '@/lib/status'

export function StatusTag({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase',
        STATUS_ACCENT_CLASS[status] ?? 'text-muted-foreground border-border',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  )
}
