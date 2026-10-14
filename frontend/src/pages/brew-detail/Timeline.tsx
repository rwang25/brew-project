import type { ReactNode } from 'react'
import { useGravityReadings, useIngredients } from '@/api/hooks'
import type { Brew } from '@/api/types'
import { dayMonth, daysBetween, startOfToday, todayIso } from '@/lib/dates'
import { cardClass } from '@/lib/shelfStyles'
import { IN_VESSEL } from '@/lib/status'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  date: string | null
  title: string
  detail?: string
  kind: 'done' | 'today' | 'pending'
  action?: ReactNode
}

export function Timeline({ brew, setReadyAction }: { brew: Brew; setReadyAction: ReactNode }) {
  const { data: ingredients } = useIngredients(brew.id)
  const { data: readings } = useGravityReadings(brew.id)
  const today = todayIso()
  const active = IN_VESSEL.includes(brew.status) || brew.status === 'Planning'

  const events: TimelineEvent[] = [
    {
      date: brew.start_date,
      title: brew.yeast ? `Pitched ${brew.yeast}` : 'Started',
      detail: brew.original_gravity != null ? `OG ${brew.original_gravity.toFixed(3)}` : undefined,
      kind: 'done',
    },
  ]
  for (const ing of ingredients ?? []) {
    if (!ing.addition_date) continue
    events.push({
      date: ing.addition_date,
      title: `Added ${ing.ingredient_name}`,
      detail: [ing.stage, ing.amount != null ? `${ing.amount} ${ing.unit ?? ''}`.trim() : null]
        .filter(Boolean)
        .join(' · '),
      kind: 'done',
    })
  }
  // Only the latest reading here; the gravity card has the full history.
  const latest = [...(readings ?? [])].sort((a, b) => b.reading_date.localeCompare(a.reading_date))[0]
  if (latest && latest.reading_date !== brew.start_date) {
    events.push({ date: latest.reading_date, title: `Latest gravity ${latest.specific_gravity.toFixed(3)}`, kind: 'done' })
  }
  if (brew.rack_date) events.push({ date: brew.rack_date, title: 'Racked to secondary', kind: 'done' })
  if (brew.bottle_date) events.push({ date: brew.bottle_date, title: 'Bottled', kind: 'done' })
  events.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  if (active) {
    events.push({
      date: today,
      title: `Day ${Math.max(0, daysBetween(brew.start_date, startOfToday()))}`,
      kind: 'today',
    })
    if (!brew.bottle_date) events.push({ date: null, title: 'Bottling', kind: 'pending' })
  }
  if (brew.expected_ready_date) {
    events.push({
      date: brew.expected_ready_date,
      title: 'Ready to drink',
      kind: brew.expected_ready_date <= today ? 'done' : 'pending',
    })
  } else if (active) {
    events.push({ date: null, title: 'Ready to drink', kind: 'pending', action: setReadyAction })
  }

  return (
    <section className={cardClass}>
      <h2 className="mb-4 font-display text-xl font-bold tracking-[-0.01em]">Timeline</h2>
      <ol>
        {events.map((event, i) => {
          const lastItem = i === events.length - 1
          return (
            <li key={`${event.title}-${i}`} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'mt-[5px] shrink-0 rounded-full',
                    event.kind === 'done' && 'size-3 bg-ink',
                    event.kind === 'today' && 'mt-[3px] size-4 border-[3px] border-ink bg-honey',
                    event.kind === 'pending' && 'size-3 border-2 border-[#CDBF9F]',
                  )}
                />
                {!lastItem && (
                  <span
                    className={cn(
                      'flex-1',
                      event.kind === 'done' ? 'w-0.5 bg-[#E7DFCF]' : 'w-0 border-l-2 border-dashed border-[#E7DFCF]',
                    )}
                  />
                )}
              </div>
              <div className={cn(!lastItem && 'pb-4')}>
                <p className={cn('font-mono text-xs', event.kind === 'today' ? 'text-[#8A5300]' : 'text-[#6E6150]')}>
                  {event.date ? dayMonth(event.date) : 'Not set'}
                  {event.kind === 'today' && ' · today'}
                </p>
                <p className={cn('text-[15px] font-semibold', event.kind === 'pending' && 'text-[#4A3E2A]')}>
                  {event.title}
                </p>
                {event.detail && <p className="text-[13px] text-[#6E6150]">{event.detail}</p>}
                {event.action && <div className="mt-2">{event.action}</div>}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
