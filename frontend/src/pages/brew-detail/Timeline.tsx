import { useIngredients } from '@/api/hooks'
import type { Brew } from '@/api/types'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  date: string
  label: string
  detail?: string
  variant: 'milestone' | 'addition'
}

export function Timeline({ brew }: { brew: Brew }) {
  const { data: ingredients } = useIngredients(brew.id)

  const events: TimelineEvent[] = []

  events.push({ date: brew.start_date, label: 'Start', variant: 'milestone' })

  for (const ing of ingredients ?? []) {
    if (!ing.addition_date) continue
    events.push({
      date: ing.addition_date,
      label: `${ing.stage ?? 'Addition'}: ${ing.ingredient_name}`,
      detail: ing.amount != null ? `${ing.amount} ${ing.unit ?? ''}`.trim() : undefined,
      variant: 'addition',
    })
  }

  if (brew.rack_date) events.push({ date: brew.rack_date, label: 'Racked', variant: 'milestone' })
  if (brew.bottle_date)
    events.push({ date: brew.bottle_date, label: 'Bottled', variant: 'milestone' })

  events.sort((a, b) => a.date.localeCompare(b.date))

  if (events.length <= 1) return null

  return (
    <div className="mb-8">
      <h2 className="text-sm font-medium text-muted-foreground mb-3">Timeline</h2>
      <ol className="space-y-3">
        {events.map((event, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <div
              className={cn(
                'mt-1.5 size-2 rounded-full shrink-0',
                event.variant === 'milestone' ? 'bg-primary' : 'bg-muted-foreground/40',
              )}
            />
            <span className="text-muted-foreground w-24 shrink-0">{event.date}</span>
            <span className="font-medium">{event.label}</span>
            {event.detail && <span className="text-muted-foreground">({event.detail})</span>}
          </li>
        ))}
      </ol>
    </div>
  )
}
