import { cn } from '@/lib/utils'

/** A row of hydrometer-scale ticks standing in for a progress bar — reads as
 * an instrument reading rather than a generic loading/progress affordance. */
export function GravityGauge({
  progress,
  muted,
  segments = 12,
}: {
  progress: number
  muted?: boolean
  segments?: number
}) {
  const filled = Math.round((progress / 100) * segments)
  return (
    <div className="flex items-end gap-[3px]" aria-hidden="true">
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] rounded-[1px]',
            i % 3 === 0 ? 'h-2.5' : 'h-1.5',
            i < filled ? (muted ? 'bg-muted-foreground/50' : 'bg-primary') : 'bg-border',
          )}
        />
      ))}
    </div>
  )
}
