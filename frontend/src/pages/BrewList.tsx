import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useBrews, useIngredientPrices } from '@/api/hooks'
import type { BrewSummary, IngredientPrice } from '@/api/types'
import { Bottle, Carboy, PlannedCarboy } from '@/components/Vessels'
import { HoneyWall, PageBody, Plank, ShelfPage, StagePill } from '@/components/shelf'
import { Skeleton } from '@/components/ui/skeleton'
import { daysBetween, fullDate, startOfToday } from '@/lib/dates'
import { batchColour } from '@/lib/pantry'
import {
  btnInk,
  eyebrowClass,
  fieldClass,
  h1Class,
  h2Class,
  monoMuted,
  plankBottle,
} from '@/lib/shelfStyles'
import { IN_VESSEL, STAGES, stagePill, vesselFor } from '@/lib/status'
import { cn } from '@/lib/utils'

type SortKey = 'newest' | 'oldest' | 'abv' | 'name'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'abv', label: 'Highest ABV' },
  { key: 'name', label: 'Name' },
]

const RAIL_VESSELS = 4

function sortBrews(brews: BrewSummary[], key: SortKey): BrewSummary[] {
  const sorted = [...brews]
  switch (key) {
    case 'oldest':
      return sorted.sort((a, b) => a.start_date.localeCompare(b.start_date))
    case 'abv':
      return sorted.sort((a, b) => (b.calculated_abv ?? -1) - (a.calculated_abv ?? -1))
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return sorted.sort((a, b) => b.start_date.localeCompare(a.start_date))
  }
}

function VesselThumb({
  brew,
  prices,
  size,
}: {
  brew: BrewSummary
  prices: IngredientPrice[] | undefined
  size: 'rail' | 'row'
}) {
  const kind = vesselFor(brew.status)
  const color = batchColour(brew.ingredient_names, prices).color
  if (kind === 'planned') {
    return <PlannedCarboy label={false} className={size === 'rail' ? 'h-[84px] w-[38px]' : 'h-[57px] w-[26px]'} />
  }
  if (kind === 'carboy') {
    return <Carboy color={color} stroke={6} className={size === 'rail' ? 'h-[84px] w-[38px]' : 'h-[57px] w-[26px]'} />
  }
  return <Bottle color={color} stroke={6} className={size === 'rail' ? 'h-[78px] w-[24px]' : 'ml-1 h-[57px] w-[18px]'} />
}

function StageRail({
  brews,
  prices,
  selected,
  onSelect,
}: {
  brews: BrewSummary[]
  prices: IngredientPrice[] | undefined
  selected: string | null
  onSelect: (status: string | null) => void
}) {
  const stations = [...STAGES]
  if (brews.some((b) => b.status === 'Discarded')) stations.push({ status: 'Discarded', label: 'Discarded' })

  return (
    <div className="-mx-4 mt-3.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="relative min-w-[880px]">
        <Plank className={cn('top-24 h-3.5', plankBottle)} />
        <div
          role="group"
          aria-label="Filter by stage"
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${stations.length}, minmax(0, 1fr))` }}
        >
          {stations.map(({ status, label }) => {
            const here = brews.filter((b) => b.status === status)
            const on = selected === status
            return (
              <button
                key={status}
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(on ? null : status)}
                className="flex flex-col items-center rounded-xl pb-2 text-ink transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.06)]"
              >
                <span className="flex h-24 w-full items-end justify-center gap-1">
                  {here.slice(0, RAIL_VESSELS).map((brew) => (
                    <VesselThumb key={brew.id} brew={brew} prices={prices} size="rail" />
                  ))}
                  {here.length > RAIL_VESSELS && (
                    <span className="mb-2 font-mono text-xs font-semibold text-[#6E4B00]">
                      +{here.length - RAIL_VESSELS}
                    </span>
                  )}
                </span>
                <span aria-hidden="true" className="h-3.5" />
                <span
                  className={cn(
                    'mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold',
                    on ? 'bg-ink text-cream' : here.length ? 'text-ink' : 'text-[#8C7F68]',
                  )}
                >
                  {label}
                  <span className={cn('font-mono text-xs', on ? 'text-honey' : 'font-medium text-[#6E5A2A]')}>
                    {here.length}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function stageText(brew: BrewSummary): string {
  if (IN_VESSEL.includes(brew.status)) {
    return `${stagePill(brew.status).label} · day ${Math.max(0, daysBetween(brew.start_date, startOfToday()))}`
  }
  return stagePill(brew.status).label
}

export function BrewList() {
  const { data: brews, isLoading } = useBrews()
  const { data: prices } = useIngredientPrices()
  const [stage, setStage] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')

  const all = brews ?? []
  const q = query.trim().toLowerCase()
  const rows = sortBrews(
    all.filter(
      (b) =>
        (!stage || b.status === stage) &&
        (!q || `${b.name} ${b.style ?? ''} ${b.brew_type}`.toLowerCase().includes(q)),
    ),
    sort,
  )
  const earliest = all.reduce<string | null>(
    (min, b) => (!min || b.start_date < min ? b.start_date : min),
    null,
  )
  const empty = !isLoading && all.length === 0
  const heading = stage ? (STAGES.find((s) => s.status === stage)?.label ?? stage) : 'All batches'

  return (
    <ShelfPage>
      <HoneyWall className="pb-11">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="min-w-0 flex-[1_1_480px]">
            <p className={cn(eyebrowClass, 'mb-3')}>
              Batches{earliest ? ` · since ${fullDate(earliest)}` : ''}
            </p>
            {isLoading ? (
              <Skeleton className="h-14 w-96 max-w-full bg-honey-line" />
            ) : (
              <h1 className={h1Class}>
                {empty
                  ? 'No batches yet.'
                  : `${all.length} ${all.length === 1 ? 'batch' : 'batches'}, from must to bottle.`}
              </h1>
            )}
          </div>
          {empty ? (
            <Link to="/brews/new" className={btnInk}>
              <Plus className="size-[18px]" strokeWidth={2.2} />
              Start your first batch
            </Link>
          ) : (
            <label className="flex min-h-12 w-full max-w-[300px] items-center gap-2 rounded-xl border-[1.5px] border-[#E2CF95] bg-white px-3.5 text-[#6E6150] focus-within:border-ink focus-within:shadow-[0_0_0_3px_rgba(244,180,0,0.45)]">
              <Search className="size-[18px]" strokeWidth={2} />
              <span className="sr-only">Search batches</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none"
              />
            </label>
          )}
        </div>

        {!isLoading && !empty && (
          <>
            <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
              <h2 className="font-display text-2xl font-bold tracking-[-0.015em]">Where everything is</h2>
              <span className="font-mono text-[13px] text-[#6E4B00]">Pick a stage to filter</span>
            </div>
            <StageRail brews={all} prices={prices} selected={stage} onSelect={setStage} />
          </>
        )}
      </HoneyWall>

      {!isLoading && !empty && (
        <PageBody>
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className={h2Class}>{heading}</h2>
              <span className={monoMuted}>
                {rows.length} {rows.length === 1 ? 'batch' : 'batches'}
              </span>
              {(stage || q) && (
                <button
                  type="button"
                  onClick={() => {
                    setStage(null)
                    setQuery('')
                  }}
                  className="min-h-9 rounded-full border border-[#DCCFB3] bg-white px-3 text-[13px] font-semibold text-[#4A3E2A] transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.06)]"
                >
                  Show all
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-[#6E6150]">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className={cn(fieldClass, 'min-h-10 w-auto font-semibold')}
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 rounded-[20px] border-[1.5px] border-dashed border-[#D9CBAE] bg-white px-6 py-12 text-center">
              <p className="font-display text-xl font-bold">Nothing matches</p>
              <p className="text-sm text-[#6E6150]">Pick another stage on the rail, or show every batch.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[20px] border border-[#E7DFCF] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FBF8F1] text-left text-xs uppercase tracking-[0.06em] text-[#6E6150]">
                      <th scope="col" className="w-10 border-b border-[#EFE8DA] py-3 pl-5 pr-2 font-medium">
                        <span className="sr-only">Vessel</span>
                      </th>
                      <th scope="col" className="border-b border-[#EFE8DA] p-3 font-medium">Batch</th>
                      <th scope="col" className="border-b border-[#EFE8DA] p-3 font-medium">Stage</th>
                      <th scope="col" className="border-b border-[#EFE8DA] p-3 font-medium">Started</th>
                      <th scope="col" className="border-b border-[#EFE8DA] p-3 font-medium">Gravity</th>
                      <th scope="col" className="border-b border-[#EFE8DA] p-3 text-right font-medium">ABV</th>
                      <th scope="col" className="border-b border-[#EFE8DA] p-3 text-right font-medium">Cost</th>
                      <th scope="col" className="border-b border-[#EFE8DA] py-3 pl-3 pr-5 text-right font-medium">
                        Readings
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((brew) => {
                      const latest = brew.latest_gravity ?? brew.final_gravity
                      return (
                        <tr key={brew.id} className="transition-colors duration-150 ease-out hover:bg-[#FFFCF3]">
                          <td className="border-b border-[#EFE8DA] py-2.5 pl-5 pr-2 align-middle">
                            <VesselThumb brew={brew} prices={prices} size="row" />
                          </td>
                          <td className="border-b border-[#EFE8DA] px-3 py-2.5">
                            <Link to={`/brews/${brew.id}`} className="block text-[15px] font-semibold text-ink hover:underline">
                              {brew.name}
                            </Link>
                            <span className="text-[13px] text-[#6E6150]">{brew.style || brew.brew_type}</span>
                          </td>
                          <td className="border-b border-[#EFE8DA] px-3 py-2.5">
                            <StagePill status={brew.status} text={stageText(brew)} />
                          </td>
                          <td className="whitespace-nowrap border-b border-[#EFE8DA] px-3 py-2.5 text-[#4A3E2A]">
                            {fullDate(brew.start_date)}
                          </td>
                          <td className="whitespace-nowrap border-b border-[#EFE8DA] px-3 py-2.5 font-mono text-[#4A3E2A]">
                            {brew.original_gravity != null
                              ? `${brew.original_gravity.toFixed(3)} → ${latest != null ? latest.toFixed(3) : '—'}`
                              : '—'}
                          </td>
                          <td className="whitespace-nowrap border-b border-[#EFE8DA] px-3 py-2.5 text-right font-mono font-semibold">
                            {brew.calculated_abv != null ? `${brew.calculated_abv.toFixed(1)}%` : '—'}
                          </td>
                          <td className="whitespace-nowrap border-b border-[#EFE8DA] px-3 py-2.5 text-right font-mono text-[#4A3E2A]">
                            {brew.total_ingredient_cost != null ? `$${brew.total_ingredient_cost.toFixed(2)}` : '—'}
                          </td>
                          <td className="border-b border-[#EFE8DA] py-2.5 pl-3 pr-5 text-right font-mono text-[#4A3E2A]">
                            {brew.reading_count}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <p className="mt-4 text-[13px] text-[#6E6150]">
            Vessel colours come from each batch's ingredients, the same as on the shelf.
          </p>
        </PageBody>
      )}
    </ShelfPage>
  )
}
