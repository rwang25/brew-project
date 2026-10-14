import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Droplet } from 'lucide-react'
import {
  useBrew,
  useGravityReadings,
  useIngredientPrices,
  useIngredients,
  useRecipes,
} from '@/api/hooks'
import type { Brew } from '@/api/types'
import { Bottle, Carboy, PlannedCarboy } from '@/components/Vessels'
import { ColourDot, HoneyWall, PageBody, ShelfPage, StagePill } from '@/components/shelf'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { MONTHS, dayMonth, daysBetween, fullDate, parseDate, startOfToday } from '@/lib/dates'
import { batchColour, priceFor, swatchName } from '@/lib/pantry'
import { btnInk, btnOutline, btnQuiet, cardClass, plankBench, plankBottle } from '@/lib/shelfStyles'
import { FERMENTING, IN_VESSEL, STAGES, stagePill, vesselFor } from '@/lib/status'
import { cn } from '@/lib/utils'
import { EditBrewTab } from '@/pages/brew-detail/EditBrewTab'
import { GravityTab } from '@/pages/brew-detail/GravityTab'
import { IngredientsTab } from '@/pages/brew-detail/IngredientsTab'
import { NutrientScheduleTab } from '@/pages/brew-detail/NutrientScheduleTab'
import { SaveAsRecipeDialog } from '@/pages/brew-detail/SaveAsRecipeDialog'
import { Timeline } from '@/pages/brew-detail/Timeline'

const READING_DUE_AFTER_DAYS = 14
const TRACK = STAGES.slice(0, 7)

function StageTrack({ brew }: { brew: Brew }) {
  const today = startOfToday()
  const index = brew.status === 'Completed' ? TRACK.length : TRACK.findIndex((s) => s.status === brew.status)
  const dateFor = (status: string): string | null => {
    if (status === 'Primary fermentation') {
      const end = brew.rack_date ? parseDate(brew.rack_date) : today
      return `${dayMonth(brew.start_date)} · ${Math.max(0, daysBetween(brew.start_date, end))} days`
    }
    if (status === 'Secondary fermentation' && brew.rack_date) return dayMonth(brew.rack_date)
    if (status === 'Bottled' && brew.bottle_date) return dayMonth(brew.bottle_date)
    return null
  }

  return (
    <div className="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {brew.status === 'Discarded' && (
        <p className="mb-3 text-sm font-semibold text-[#7A2E22]">This batch was discarded.</p>
      )}
      <ol aria-label="Stage" className="grid min-w-[770px] grid-cols-7">
        {TRACK.map((stage, i) => {
          const done = index > i
          const current = index === i
          const last = i === TRACK.length - 1
          const date = done || current ? dateFor(stage.status) : null
          return (
            <li key={stage.status} aria-current={current ? 'step' : undefined}>
              <div className="flex items-center">
                <span
                  className={cn(
                    'shrink-0 rounded-full',
                    done && 'size-3.5 bg-ink',
                    current && '-my-[3px] size-5 border-[3px] border-ink bg-honey',
                    !done && !current && 'size-3.5 border-2 border-[#B59A5C] bg-honey-wall',
                  )}
                />
                {!last && (
                  <span
                    className={cn(
                      'flex-1',
                      done ? 'h-[3px] bg-ink' : 'h-0 border-t-[3px] border-dashed border-[#C9A25A]',
                    )}
                  />
                )}
              </div>
              <p className={cn('mt-2.5 text-sm', current ? 'font-bold' : done ? 'font-semibold' : 'font-medium text-[#4A3A12]')}>
                {stage.label}
              </p>
              {date && <p className="font-mono text-xs text-[#6E4B00]">{current ? `${date} · now` : date}</p>}
              {last && !done && !current && <p className="font-mono text-xs text-[#6E4B00]">moves to the shelf</p>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col-reverse gap-0.5 pr-4 pt-3.5">
      <dt className="text-xs uppercase tracking-[0.06em] text-[#6E4B00]">{label}</dt>
      <dd className={cn('font-mono text-[30px] leading-tight', strong ? 'font-semibold' : 'font-medium')}>{value}</dd>
    </div>
  )
}

function BrewDetailSkeleton() {
  return (
    <ShelfPage>
      <HoneyWall>
        <div className="flex flex-wrap items-end gap-12">
          <Skeleton className="h-[372px] w-[240px] bg-honey-line" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-40 bg-honey-line" />
            <Skeleton className="h-14 w-80 bg-honey-line" />
            <Skeleton className="h-20 w-full bg-honey-line" />
          </div>
        </div>
      </HoneyWall>
    </ShelfPage>
  )
}

export function BrewDetail() {
  const { id } = useParams()
  const brewId = Number(id)
  const { data: brew, isLoading } = useBrew(brewId)
  const { data: ingredients, isLoading: ingredientsLoading } = useIngredients(brewId)
  const { data: readings } = useGravityReadings(brewId)
  const { data: prices } = useIngredientPrices()
  const { data: recipes } = useRecipes()
  const [editOpen, setEditOpen] = useState(false)

  if (isLoading || ingredientsLoading) return <BrewDetailSkeleton />
  if (!brew) {
    return (
      <ShelfPage>
        <PageBody>
          <p className="text-[#6E6150]">Batch not found.</p>
        </PageBody>
      </ShelfPage>
    )
  }

  const today = startOfToday()
  const active = IN_VESSEL.includes(brew.status) || brew.status === 'Planning'
  const vessel = vesselFor(brew.status)
  const names = (ingredients ?? []).map((i) => i.ingredient_name)
  const colour = batchColour(names, prices)
  const colourName = swatchName(colour.color)
  const latest = [...(readings ?? [])].sort((a, b) => b.reading_date.localeCompare(a.reading_date))[0]
  const lastCheck = latest?.reading_date ?? brew.start_date
  const readingDue = FERMENTING.includes(brew.status) && daysBetween(lastCheck, today) >= READING_DUE_AFTER_DAYS
  const og = brew.original_gravity
  const latestGravity = latest?.specific_gravity ?? brew.final_gravity
  const totalCost = (ingredients ?? []).reduce((sum, i) => sum + (i.total_cost ?? 0), 0)
  const hasCost = (ingredients ?? []).some((i) => i.total_cost != null)
  const recipe = recipes?.find((r) => r.id === brew.recipe_id)
  const day = Math.max(0, daysBetween(brew.start_date, today))
  const pillText = IN_VESSEL.includes(brew.status) ? `${stagePill(brew.status).label} · day ${day}` : undefined
  const bottleTag = (() => {
    const d = parseDate(brew.bottle_date ?? brew.start_date)
    return `${MONTHS[d.getMonth()].toUpperCase()} ${String(d.getFullYear()).slice(2)}`
  })()
  const priceEntry = colour.decidedBy ? priceFor(colour.decidedBy, prices) : undefined

  const editButton = (label: string, className: string) => (
    <button type="button" onClick={() => setEditOpen(true)} className={className}>
      {label}
    </button>
  )

  return (
    <ShelfPage>
      <HoneyWall className="pt-6">
        <nav aria-label="Breadcrumb" className="text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/brews" className="inline-flex min-h-11 items-center font-semibold text-[#5C3A00] hover:underline">
                Batches
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#B59A5C]">/</li>
            <li aria-current="page" className="text-[#4A3A12]">{brew.name}</li>
          </ol>
        </nav>

        <div className="mt-1 flex flex-wrap items-end gap-x-12 gap-y-6">
          <div className="flex flex-[0_0_240px] flex-col items-center">
            <div className="relative w-[240px]">
              {readingDue && (
                <span className="absolute left-[calc(50%+24px)] top-[74px] z-10 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-honey">
                  <Droplet className="size-3" strokeWidth={2.6} />
                  Reading due
                </span>
              )}
              <div className="flex h-[372px] items-end justify-center">
                {vessel === 'planned' && <PlannedCarboy className="h-[361px] w-[164px]" />}
                {vessel === 'carboy' && (
                  <Carboy
                    color={colour.color}
                    bubbling={FERMENTING.includes(brew.status)}
                    stroke={2.2}
                    className="h-[361px] w-[164px]"
                  />
                )}
                {vessel === 'bottle' && (
                  <Bottle
                    color={colour.color}
                    label={brew.calculated_abv != null ? `${brew.calculated_abv.toFixed(1)}%` : '—'}
                    sublabel={bottleTag}
                    stroke={2}
                    className="h-[326px] w-[100px]"
                  />
                )}
              </div>
              <div aria-hidden="true" className={cn('h-[18px] rounded', vessel === 'bottle' ? plankBottle : plankBench)} />
            </div>
            <p className="mt-5 flex items-center gap-2 text-[13px] text-[#4A3A12]">
              <ColourDot color={colour.color} className="size-3" />
              {colour.decidedBy
                ? `${colourName ?? 'Colour'}, from ${colour.decidedBy}${colour.darkened ? ', a step darker for oak' : ''}`
                : 'Default gold. Add a honey or fruit to colour it.'}
            </p>
            {colour.decidedBy && (
              <Link
                to={`/prices?ingredient=${encodeURIComponent(colour.decidedBy)}`}
                className="inline-flex min-h-9 items-center text-[13px] font-semibold text-[#5C3A00] hover:underline"
              >
                {priceEntry ? 'Change it in the price book' : 'Set it in the price book'}
              </Link>
            )}
          </div>

          <div className="min-w-0 flex-[1_1_520px] pb-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <StagePill status={brew.status} text={pillText} className="px-3 text-[13px]" />
              {brew.rack_date && IN_VESSEL.includes(brew.status) && (
                <span className="font-mono text-[13px] text-[#6E4B00]">
                  {daysBetween(brew.rack_date, today)} days since racking
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-[clamp(38px,4.8vw,64px)] font-bold leading-none tracking-[-0.03em]">
              {brew.name}
            </h1>
            <p className="mt-2.5 text-base text-[#4A3A12]">
              {[
                brew.style || brew.brew_type,
                brew.batch_size != null ? `${brew.batch_size} ${brew.batch_size_unit ?? ''}`.trim() : null,
                brew.yeast,
                `started ${fullDate(brew.start_date)}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <dl className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] border-t-[1.5px] border-ink">
              <Stat label="Original" value={og != null ? og.toFixed(3) : '—'} />
              <Stat
                label={active ? (latest ? `Latest · ${dayMonth(latest.reading_date)}` : 'Latest') : 'Final'}
                value={latestGravity != null ? latestGravity.toFixed(3) : '—'}
              />
              <Stat
                label={active ? 'ABV so far' : 'ABV'}
                value={brew.calculated_abv != null ? `${brew.calculated_abv.toFixed(1)}%` : '—'}
                strong
              />
              {active ? (
                <Stat label="If it finishes dry" value={og != null ? `${Math.max(0, (og - 1) * 131.25).toFixed(1)}%` : '—'} />
              ) : (
                <Stat label="Ingredient cost" value={hasCost ? `$${totalCost.toFixed(2)}` : '—'} />
              )}
            </dl>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {active && (
                <a href="#log" className={btnInk}>
                  <Droplet className="size-[18px]" strokeWidth={2} />
                  Log a reading
                </a>
              )}
              {editButton('Edit batch', btnOutline)}
              <SaveAsRecipeDialog brewId={brew.id} brewName={brew.name} triggerClassName={btnOutline} />
            </div>
          </div>
        </div>

        <StageTrack brew={brew} />
      </HoneyWall>

      <PageBody className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
          <GravityTab brew={brew} />
          <IngredientsTab brew={brew} />
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <Timeline brew={brew} setReadyAction={editButton('Set ready date', btnQuiet)} />
          <NutrientScheduleTab brew={brew} />

          <section className={cardClass}>
            <h2 className="mb-1.5 font-display text-xl font-bold tracking-[-0.01em]">Details</h2>
            <dl className="text-sm">
              {[
                ['Vessel', brew.vessel],
                ['Ferment temp', brew.temperature != null ? `${brew.temperature}${brew.temperature_unit ?? ''}` : null],
                ['Target ABV', brew.target_abv != null ? `${brew.target_abv}%` : null],
                ['Expected ready', brew.expected_ready_date ? fullDate(brew.expected_ready_date) : null],
                ['From recipe', recipe?.name ?? null],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-[#EFE8DA] py-2.5 last:border-b-0">
                  <dt className="text-[#6E6150]">{label}</dt>
                  <dd className={value ? 'text-right font-semibold' : 'text-[#6E6150]'}>{value ?? 'Not set'}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={cardClass}>
            <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Notes</h2>
            {brew.process_notes || brew.tasting_notes ? (
              <div className="mt-2.5 space-y-3 text-[15px] leading-relaxed text-[#3A3020]">
                {brew.process_notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6E6150]">Process</p>
                    <p className="whitespace-pre-line">{brew.process_notes}</p>
                  </div>
                )}
                {brew.tasting_notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6E6150]">Tasting</p>
                    <p className="whitespace-pre-line">{brew.tasting_notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#6E6150]">
                No process or tasting notes yet. Process notes carry into a recipe if you save one.
              </p>
            )}
            {editButton(brew.process_notes || brew.tasting_notes ? 'Edit notes' : 'Add a note', cn(btnQuiet, 'mt-3.5'))}
          </section>
        </div>
      </PageBody>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Edit batch</DialogTitle>
          </DialogHeader>
          <EditBrewTab brew={brew} onSaved={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </ShelfPage>
  )
}
