import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CalendarDays, Check, Clock, Droplet, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useBrews, useIngredientPrices, useReminders } from '@/api/hooks'
import type { BrewSummary, IngredientPrice, Reminders } from '@/api/types'
import { Bottle, Carboy, PlannedCarboy } from '@/components/Vessels'
import { HoneycombBackdrop, Plank, StagePill } from '@/components/shelf'
import { Skeleton } from '@/components/ui/skeleton'
import { MONTHS, daysBetween, dayMonth, monthYear, parseDate, startOfToday, todayLabel } from '@/lib/dates'
import { batchColour } from '@/lib/pantry'
import { plankBench, plankBottle } from '@/lib/shelfStyles'
import { FERMENTING, IN_VESSEL, OFF_SHELF, stagePill } from '@/lib/status'
import { estimateBottleCount } from '@/lib/units'
import { cn } from '@/lib/utils'

const READING_DUE_AFTER_DAYS = 14
const BOTTLES_PER_SHELF = 7
const MAX_SHELVES = 3
const PHONE_ROW_MAX = 12
const MAX_ATTENTION_ITEMS = 6

function daysSince(value: string, today: Date): number {
  return daysBetween(value, today)
}

function bottleDate(brew: BrewSummary): string {
  return brew.bottle_date ?? brew.start_date
}

// Days since the last gravity reading (or since pitching, if there are none)
// when a fermenting batch is overdue for one; null when it isn't.
function readingOverdueDays(brew: BrewSummary, today: Date): number | null {
  if (!FERMENTING.includes(brew.status)) return null
  const days = daysSince(brew.last_reading_date ?? brew.start_date, today)
  return days >= READING_DUE_AFTER_DAYS ? days : null
}

interface AttentionItem {
  key: string
  brewId: number
  icon: LucideIcon
  title: string
  detail: string
  urgent: boolean
}

function buildAttention(
  brews: BrewSummary[],
  reminders: Reminders | undefined,
  today: Date,
): AttentionItem[] {
  const items: AttentionItem[] = []

  for (const r of reminders?.nutrient_reminders ?? []) {
    const overdue = r.status === 'overdue'
    items.push({
      key: `nutrient-${r.brew_id}-${r.nutrient_type}-${r.scheduled_date}`,
      brewId: r.brew_id,
      icon: overdue ? AlertTriangle : Clock,
      title: `Add ${r.nutrient_type}`,
      detail: `${r.brew_name} · ${overdue ? 'was due' : 'due'} ${dayMonth(r.scheduled_date)}`,
      urgent: overdue,
    })
  }

  for (const r of reminders?.ready_reminders ?? []) {
    const overdue = r.status === 'overdue'
    items.push({
      key: `ready-${r.brew_id}`,
      brewId: r.brew_id,
      icon: overdue ? AlertTriangle : Clock,
      title: `${r.brew_name} should be ready`,
      detail: `${overdue ? 'Expected' : 'Expected by'} ${dayMonth(r.expected_ready_date)}`,
      urgent: overdue,
    })
  }

  for (const brew of brews) {
    const days = readingOverdueDays(brew, today)
    if (days == null) continue
    const detail =
      brew.last_reading_date && brew.latest_gravity != null
        ? `${brew.name} · last ${brew.latest_gravity.toFixed(3)} on ${dayMonth(brew.last_reading_date)}, ${days} days ago`
        : `${brew.name} · no readings in the ${days} days since it started`
    items.push({
      key: `reading-${brew.id}`,
      brewId: brew.id,
      icon: Droplet,
      title: 'Take a gravity reading',
      detail,
      urgent: false,
    })
  }

  for (const brew of brews) {
    if (!IN_VESSEL.includes(brew.status) || brew.expected_ready_date) continue
    items.push({
      key: `ready-date-${brew.id}`,
      brewId: brew.id,
      icon: CalendarDays,
      title: 'Set an expected-ready date',
      detail: `${brew.name} has none, so no ready reminder will fire`,
      urgent: false,
    })
  }

  return [...items.filter((i) => i.urgent), ...items.filter((i) => !i.urgent)].slice(
    0,
    MAX_ATTENTION_ITEMS,
  )
}

type ShelfSlot = { kind: 'bottle'; brew: BrewSummary } | { kind: 'more'; count: number }

// Fills slots up to `capacity`; past that, the last slot becomes a "+N older"
// link so the shelf never grows without bound.
function fillSlots(bottled: BrewSummary[], capacity: number): ShelfSlot[] {
  if (bottled.length <= capacity) return bottled.map((brew) => ({ kind: 'bottle', brew }))
  const shown = bottled.slice(0, capacity - 1)
  return [
    ...shown.map((brew): ShelfSlot => ({ kind: 'bottle', brew })),
    { kind: 'more', count: bottled.length - shown.length },
  ]
}

function shelfLabel(slots: ShelfSlot[], index: number): string {
  const dates = slots.flatMap((s) => (s.kind === 'bottle' ? [parseDate(bottleDate(s.brew))] : []))
  if (dates.length === 0) return `Shelf ${index + 1}`
  const newest = dates[0]
  const oldest = dates[dates.length - 1]
  const fmt = (d: Date, withYear: boolean) =>
    withYear ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}` : MONTHS[d.getMonth()]
  let range: string
  if (newest.getFullYear() !== oldest.getFullYear()) range = `${fmt(oldest, true)} – ${fmt(newest, true)}`
  else if (newest.getMonth() !== oldest.getMonth()) range = `${fmt(oldest, false)} – ${fmt(newest, true)}`
  else range = fmt(newest, true)
  return `Shelf ${index + 1} · ${range}`
}

function benchSummary(bench: BrewSummary[]): string {
  const fermenting = bench.filter((b) => FERMENTING.includes(b.status)).length
  const parts = fermenting ? [`${fermenting} fermenting`] : []
  for (const status of ['Stabilizing', 'Backsweetened', 'Conditioning']) {
    const n = bench.filter((b) => b.status === status).length
    if (n) parts.push(`${n} ${status.toLowerCase()}`)
  }
  const planned = bench.filter((b) => b.status === 'Planning').length
  if (planned) parts.push(`${planned} planned`)
  return parts.join(' · ')
}

function BenchItem({
  brew,
  today,
  prices,
}: {
  brew: BrewSummary
  today: Date
  prices: IngredientPrice[] | undefined
}) {
  const planned = brew.status === 'Planning'
  const pill = stagePill(brew.status)
  const pillText = planned
    ? brew.recipe_id
      ? 'Planned · from recipe'
      : 'Planned'
    : `${pill.label} · day ${Math.max(0, daysSince(brew.start_date, today))}`
  const readingDue = readingOverdueDays(brew, today) != null
  const vesselClass =
    'h-auto w-[92px] transition-transform duration-200 ease-out group-hover:-translate-y-1.5 sm:w-[120px]'

  return (
    <Link
      to={`/brews/${brew.id}`}
      className="group relative flex flex-col items-center rounded-lg text-ink outline-offset-4 focus-visible:outline-2 focus-visible:outline-ink"
    >
      {readingDue && (
        <span className="absolute left-[calc(50%+14px)] top-12 z-10 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-ink px-2 py-1 text-[11px] font-semibold text-honey sm:left-[calc(50%+18px)] sm:top-[60px] sm:text-xs">
          <Droplet className="size-3" strokeWidth={2.6} />
          Reading due
        </span>
      )}
      <span className="flex h-[214px] w-full items-end justify-center sm:h-[276px]">
        {planned ? (
          <PlannedCarboy className={vesselClass} />
        ) : (
          <Carboy
            color={batchColour(brew.ingredient_names, prices).color}
            bubbling={FERMENTING.includes(brew.status)}
            className={vesselClass}
          />
        )}
      </span>
      <span aria-hidden="true" className="h-4 sm:h-[18px]" />
      <span className="mt-[18px] px-2 text-center text-sm font-semibold leading-tight sm:mt-[22px] sm:text-[15px]">
        {brew.name}
      </span>
      <StagePill status={brew.status} text={pillText} className="mt-1.5 text-[11px] sm:text-xs" />
    </Link>
  )
}

function BottleItem({
  brew,
  prices,
  compact = false,
}: {
  brew: BrewSummary
  prices: IngredientPrice[] | undefined
  compact?: boolean
}) {
  const date = bottleDate(brew)
  const parsed = parseDate(date)
  const tag = `${MONTHS[parsed.getMonth()].toUpperCase()} ${String(parsed.getFullYear()).slice(2)}`
  const abv = brew.calculated_abv != null ? `${brew.calculated_abv.toFixed(1)}%` : '—'
  const when = compact
    ? monthYear(date)
    : `${brew.bottle_date ? 'Bottled' : 'Started'} ${monthYear(date)}`
  // No bottle-count field yet, so the badge estimates from batch size.
  const bottles = estimateBottleCount(brew.batch_size, brew.batch_size_unit)

  return (
    <Link
      to={`/brews/${brew.id}`}
      className="group relative flex flex-col items-center rounded-lg text-ink outline-offset-4 focus-visible:outline-2 focus-visible:outline-ink"
    >
      <span className={cn('flex w-full items-end justify-center', compact ? 'h-[194px]' : 'h-[246px]')}>
        <Bottle
          color={batchColour(brew.ingredient_names, prices).color}
          label={abv}
          sublabel={tag}
          className={cn(
            'h-auto transition-transform duration-200 ease-out group-hover:-translate-y-1.5',
            compact ? 'w-[56px]' : 'w-[70px]',
          )}
        />
      </span>
      {bottles != null && bottles > 1 && (
        <span
          title={`About ${bottles} × 750 ml bottles, estimated from batch size`}
          className={cn(
            'absolute inline-flex items-center rounded-full bg-ink font-mono font-semibold text-cream shadow-[0_0_0_2px_var(--honey-wall)] transition-transform duration-200 ease-out group-hover:-translate-y-1.5',
            compact
              ? 'left-[calc(50%+16px)] top-[72px] h-[22px] px-[7px] text-[11px]'
              : 'left-[calc(50%+22px)] top-[92px] h-6 px-2 text-xs',
          )}
        >
          ×{bottles}
          <span className="sr-only"> bottles, estimated</span>
        </span>
      )}
      <span aria-hidden="true" className={compact ? 'h-3' : 'h-3.5'} />
      <span
        className={cn(
          'line-clamp-2 px-1.5 text-center font-semibold leading-tight',
          compact ? 'mt-3 text-xs' : 'mt-4 text-[13px]',
        )}
      >
        {brew.name}
      </span>
      <span className="mt-0.5 font-mono text-[11px] text-[#6E5A2A]">{when}</span>
    </Link>
  )
}

function MoreItem({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <Link
      to="/brews"
      className="flex flex-col items-center rounded-lg text-ink outline-offset-4 focus-visible:outline-2 focus-visible:outline-ink"
    >
      <span className={cn('flex w-full items-end justify-center', compact ? 'h-[194px]' : 'h-[246px]')}>
        <span
          className={cn(
            'grid place-items-center rounded-full border-2 border-dashed border-[#8A6A3A] bg-white/50 font-display font-bold',
            compact ? 'mb-9 size-[76px] text-[22px]' : 'mb-10 size-[92px] text-[28px]',
          )}
        >
          +{count}
        </span>
      </span>
      <span aria-hidden="true" className={compact ? 'h-3' : 'h-3.5'} />
      <span className={cn('text-center font-semibold', compact ? 'mt-3 text-xs' : 'mt-4 text-[13px]')}>
        Older bottles
      </span>
      <span className="mt-0.5 font-mono text-[11px] text-[#6E5A2A]">in Batches</span>
    </Link>
  )
}

function Shelves({
  bottled,
  prices,
}: {
  bottled: BrewSummary[]
  prices: IngredientPrice[] | undefined
}) {
  if (bottled.length === 0) {
    return (
      <div className="relative mt-4 h-40">
        <p className="flex h-[136px] items-center justify-center text-[15px] text-[#6E4B00]">
          Nothing bottled yet. Bottled batches land here.
        </p>
        <Plank className={cn('top-[136px] h-3.5', plankBottle)} />
      </div>
    )
  }

  const desktopSlots = fillSlots(bottled, BOTTLES_PER_SHELF * MAX_SHELVES)
  const shelves: ShelfSlot[][] = []
  for (let i = 0; i < desktopSlots.length; i += BOTTLES_PER_SHELF) {
    shelves.push(desktopSlots.slice(i, i + BOTTLES_PER_SHELF))
  }
  const phoneSlots = fillSlots(bottled, PHONE_ROW_MAX)

  return (
    <>
      <div className="hidden sm:block">
        {shelves.map((slots, index) => (
          <div key={index} className="mt-5">
            <p className="mb-1 font-mono text-xs tracking-[0.04em] text-[#6E4B00]">
              {shelfLabel(slots, index)}
            </p>
            <div className="relative">
              <Plank className={cn('top-[246px] h-3.5', plankBottle)} />
              <ul className="relative grid grid-cols-7">
                {slots.map((slot) => (
                  <li key={slot.kind === 'bottle' ? slot.brew.id : 'more'} className="min-w-0">
                    {slot.kind === 'bottle' ? (
                      <BottleItem brew={slot.brew} prices={prices} />
                    ) : (
                      <MoreItem count={slot.count} />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="sm:hidden">
        <div className="-mx-4 mt-2 snap-x snap-mandatory scroll-pl-4 overflow-x-auto px-4 [scrollbar-width:none]">
          <div className="relative w-max min-w-full">
            <Plank className={cn('top-[194px] h-3', plankBottle)} />
            <ul className="relative flex">
              {phoneSlots.map((slot) => (
                <li
                  key={slot.kind === 'bottle' ? slot.brew.id : 'more'}
                  className="w-[104px] shrink-0 snap-start"
                >
                  {slot.kind === 'bottle' ? (
                    <BottleItem brew={slot.brew} prices={prices} compact />
                  ) : (
                    <MoreItem count={slot.count} compact />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {bottled.length > 3 && (
          <p className="mt-3.5 flex items-center gap-2 text-[13px] text-[#6E4B00]">
            <ArrowRight className="size-4" strokeWidth={2.2} />
            Swipe the shelf · {bottled.length} batches
          </p>
        )}
      </div>
    </>
  )
}

function Bench({
  bench,
  today,
  prices,
}: {
  bench: BrewSummary[]
  today: Date
  prices: IngredientPrice[] | undefined
}) {
  if (bench.length === 0) {
    return (
      <div className="relative mt-3 h-40">
        <p className="flex h-[136px] items-center justify-center gap-1 text-[15px] text-[#6E4B00]">
          Nothing fermenting.
          <Link to="/brews/new" className="font-semibold text-[#5C3A00] underline-offset-4 hover:underline">
            Start a batch
          </Link>
        </p>
        <Plank className={cn('top-[136px] h-[18px]', plankBench)} />
      </div>
    )
  }

  return (
    <div className="-mx-4 mt-3 snap-x snap-mandatory scroll-pl-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:snap-none sm:px-0">
      <div className="relative w-max min-w-full">
        <Plank className={cn('top-[214px] h-4 sm:top-[276px] sm:h-[18px]', plankBench)} />
        <ul className="relative flex">
          {bench.map((brew) => (
            <li key={brew.id} className="w-[150px] shrink-0 snap-start sm:w-[220px]">
              <BenchItem brew={brew} today={today} prices={prices} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function NeedsAttention({ items }: { items: AttentionItem[] }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-10">
      <h2 className="mb-4 font-display text-[22px] font-bold tracking-[-0.015em]">Needs attention</h2>
      {items.length === 0 ? (
        <p className="flex items-center gap-3 rounded-2xl border border-[#E7DFCF] bg-white px-[18px] py-4 text-[15px]">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E4E9DA] text-[#3B4A28]">
            <Check className="size-5" strokeWidth={2.4} />
          </span>
          All caught up. Nothing is due in the next few days.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ key, brewId, icon: Icon, title, detail, urgent }) => (
            <li key={key}>
              <Link
                to={`/brews/${brewId}`}
                className="flex h-full items-center gap-3.5 rounded-2xl border border-[#E7DFCF] bg-white px-[18px] py-4 text-ink transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.04)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-xl',
                    urgent ? 'bg-[#F6DCD5] text-destructive' : 'bg-honey-soft text-[#8A5300]',
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.9} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold">{title}</span>
                  <span className="block text-[13px] text-[#6E6150]">{detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function Home() {
  const { data: brews, isLoading } = useBrews()
  const { data: reminders } = useReminders()
  const { data: prices } = useIngredientPrices()
  const today = startOfToday()

  const all = brews ?? []
  const bench = [
    ...all
      .filter((b) => IN_VESSEL.includes(b.status))
      .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    ...all.filter((b) => b.status === 'Planning'),
  ]
  const bottled = all
    .filter((b) => b.status === 'Bottled')
    .sort((a, b) => bottleDate(b).localeCompare(bottleDate(a)))
  const archived = all.filter((b) => OFF_SHELF.includes(b.status)).length
  const attention = buildAttention(all, reminders, today)
  const readingTarget =
    all.find((b) => readingOverdueDays(b, today) != null) ??
    all.find((b) => FERMENTING.includes(b.status))
  const benchCount = bench.filter((b) => b.status !== 'Planning').length
  const empty = !isLoading && all.length === 0

  return (
    <main className="flex-1 bg-[#FBF6EA] text-ink">
      <section className="relative isolate overflow-hidden border-b border-honey-line bg-honey-wall">
        <HoneycombBackdrop />
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <div className="min-w-0 flex-[1_1_480px]">
              <p className="mb-3 font-mono text-[13px] uppercase tracking-[0.08em] text-[#6E4B00]">
                Your cellar · {todayLabel()}
              </p>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-72 bg-honey-line" />
                  <Skeleton className="h-12 w-60 bg-honey-line" />
                </div>
              ) : empty ? (
                <h1 className="font-display text-[clamp(34px,4.4vw,60px)] font-bold leading-[1.02] tracking-[-0.03em]">
                  Your shelf is empty.
                </h1>
              ) : (
                <h1 className="font-display text-[clamp(34px,4.4vw,60px)] font-bold leading-[1.02] tracking-[-0.03em]">
                  {benchCount ? `${benchCount} on the bench.` : 'Nothing on the bench.'}
                  <br />
                  {bottled.length ? `${bottled.length} in bottles.` : 'Nothing bottled yet.'}
                </h1>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {empty ? (
                <Link
                  to="/brews/new"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink px-[18px] text-[15px] font-semibold text-cream transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(255,246,220,0.12)]"
                >
                  <Plus className="size-[18px]" strokeWidth={2.2} />
                  Start your first batch
                </Link>
              ) : (
                <>
                  {readingTarget && (
                    <Link
                      to={`/brews/${readingTarget.id}`}
                      className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink px-[18px] text-[15px] font-semibold text-cream transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(255,246,220,0.12)]"
                    >
                      <Droplet className="size-[18px]" strokeWidth={2} />
                      Log a reading
                    </Link>
                  )}
                  <Link
                    to="/brews"
                    className="inline-flex min-h-12 items-center rounded-xl border-[1.5px] border-ink px-[18px] text-[15px] font-semibold text-ink transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.08)]"
                  >
                    All batches
                  </Link>
                </>
              )}
            </div>
          </div>

          {!isLoading && !empty && (
            <>
              <div className="mt-11 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
                <h2 className="font-display text-2xl font-bold tracking-[-0.015em]">On the bench</h2>
                {bench.length > 0 && (
                  <span className="font-mono text-[13px] text-[#6E4B00]">{benchSummary(bench)}</span>
                )}
              </div>
              <Bench bench={bench} today={today} prices={prices} />

              <div className="mt-[52px] flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
                <h2 className="font-display text-2xl font-bold tracking-[-0.015em]">In bottles</h2>
                {bottled.length > 0 && (
                  <span className="font-mono text-[13px] text-[#6E4B00]">
                    {bottled.length === 1 ? '1 batch' : `${bottled.length} batches`} · newest first
                  </span>
                )}
              </div>
              <Shelves bottled={bottled} prices={prices} />

              <Link
                to="/brews"
                className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#5C3A00] underline-offset-4 hover:underline"
              >
                {archived
                  ? `Finished batches leave the shelf when marked Completed · ${archived} in Batches`
                  : 'Batches marked Completed leave the shelf and stay in Batches'}
                <ArrowRight className="size-4" strokeWidth={2.2} />
              </Link>
            </>
          )}
        </div>
      </section>

      {!isLoading && !empty && <NeedsAttention items={attention} />}
    </main>
  )
}
