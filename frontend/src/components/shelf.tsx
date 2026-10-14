import { useId } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { stagePill } from '@/lib/status'

// Shared pieces of the shelf look: the honey-tinted wall with its honeycomb
// backdrop, oak planks and stage pills. Class strings live in lib/shelfStyles.

export function ShelfPage({ children }: { children: ReactNode }) {
  return <main className="flex-1 bg-[#FBF6EA] text-ink">{children}</main>
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-10', className)}>
      {children}
    </div>
  )
}

export function HoneycombBackdrop() {
  const id = useId()
  return (
    <svg aria-hidden="true" className="absolute inset-0 -z-10 size-full">
      <defs>
        <pattern id={id} width="34.64" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M17.32 0L34.64 10V30L17.32 40L0 30V10Z M17.32 40V60"
            fill="none"
            stroke="#B07400"
            strokeOpacity={0.1}
            strokeWidth={1.2}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

export function HoneyWall({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-honey-line bg-honey-wall">
      <HoneycombBackdrop />
      <div className={cn('mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-10', className)}>
        {children}
      </div>
    </section>
  )
}

export function Plank({ className }: { className: string }) {
  return <div aria-hidden="true" className={cn('absolute inset-x-0 rounded', className)} />
}

export function StagePill({
  status,
  text,
  className,
}: {
  status: string
  text?: string
  className?: string
}) {
  const pill = stagePill(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
        pill.className,
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {text ?? pill.label}
    </span>
  )
}

export function ColourDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-4 shrink-0 rounded-full shadow-[0_0_0_1.5px_var(--ink)]', className)}
      style={{ background: color }}
    />
  )
}
