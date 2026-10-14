import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import {
  useBrews,
  useDeleteIngredientPrice,
  useIngredientPrices,
  useIngredientUsage,
} from '@/api/hooks'
import type { IngredientPrice, IngredientUsage } from '@/api/types'
import { PantryContainer } from '@/components/Vessels'
import { HoneyWall, PageBody, Plank, ShelfPage } from '@/components/shelf'
import { Skeleton } from '@/components/ui/skeleton'
import { fullDate } from '@/lib/dates'
import { pantryLook, priceFor } from '@/lib/pantry'
import type { ContainerKind } from '@/lib/pantry'
import { btnIcon, btnInk, eyebrowClass, h1Class, h2Class, plankBottle } from '@/lib/shelfStyles'
import { convertUnitCost, unitsAreConvertible } from '@/lib/units'
import { cn } from '@/lib/utils'
import { PantryDialog } from '@/pages/price-book/PantryDialog'
import type { PantryDraft } from '@/pages/price-book/PantryDialog'

const PER_SHELF = 7
const TILTS = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-2', 'rotate-1']
const WEIGHT_TARGETS = ['oz', 'lb', 'g', 'kg']
const VOLUME_TARGETS = ['L', 'qt', 'gal', 'mL']

const SPEND_GROUPS: { id: string; label: string; kinds: ContainerKind[]; color: string }[] = [
  { id: 'honey', label: 'Honey', kinds: ['honey'], color: '#F4B400' },
  { id: 'fruit', label: 'Fruit', kinds: ['fruit'], color: '#7B2D48' },
  { id: 'juice', label: 'Juice & cider', kinds: ['jug'], color: '#E9C47A' },
  { id: 'oak', label: 'Oak & spice', kinds: ['wood', 'spice'], color: '#21190C' },
  { id: 'other', label: 'Everything else', kinds: ['sachet', 'packaging', 'other'], color: '#CDBF9F' },
]

function money(value: number, digits = 2): string {
  return `$${value.toFixed(digits)}`
}

function conversions(price: IngredientPrice): { label: string; value: string }[] {
  const targets = unitsAreConvertible(price.unit, 'lb')
    ? WEIGHT_TARGETS
    : unitsAreConvertible(price.unit, 'L')
      ? VOLUME_TARGETS
      : []
  return targets
    .filter((t) => t.toLowerCase() !== price.unit.toLowerCase())
    .slice(0, 3)
    .map((t) => {
      const v = convertUnitCost(price.unit_cost, price.unit, t) ?? 0
      return { label: `per ${t}`, value: money(v, v < 0.1 ? 4 : v < 1 ? 3 : 2) }
    })
}

function usageText(usage: IngredientUsage | undefined): string {
  if (!usage || (usage.batch_count === 0 && usage.recipe_count === 0)) return 'Not used yet'
  const parts = []
  if (usage.batch_count) parts.push(`${usage.batch_count} ${usage.batch_count === 1 ? 'batch' : 'batches'}`)
  if (usage.recipe_count) parts.push(`${usage.recipe_count} ${usage.recipe_count === 1 ? 'recipe' : 'recipes'}`)
  return parts.join(' · ')
}

function SpendCard({
  usage,
  prices,
  pricedBatches,
}: {
  usage: IngredientUsage[]
  prices: IngredientPrice[]
  pricedBatches: number
}) {
  const totals = SPEND_GROUPS.map((g) => ({
    ...g,
    total: usage
      .filter((u) => u.total_cost && g.kinds.includes(pantryLook(u.ingredient_name, priceFor(u.ingredient_name, prices)).container))
      .reduce((sum, u) => sum + (u.total_cost ?? 0), 0),
  })).filter((g) => g.total > 0)
  const grand = totals.reduce((sum, g) => sum + g.total, 0)

  const honeysPerLb = prices
    .filter((p) => pantryLook(p.ingredient_name, p).container === 'honey')
    .map((p) => ({ name: p.ingredient_name, perLb: convertUnitCost(p.unit_cost, p.unit, 'lb') }))
    .filter((h): h is { name: string; perLb: number } => h.perLb != null)
    .sort((a, b) => a.perLb - b.perLb)
  const honeyShare = grand ? Math.round(((totals.find((g) => g.id === 'honey')?.total ?? 0) / grand) * 100) : 0

  return (
    <section className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[22px] border border-[#E7DFCF] bg-white p-6">
      <div>
        <h2 className={h2Class}>Where the money went</h2>
        <p className="mt-1 text-sm text-[#6E6150]">
          {grand
            ? `${money(grand)} across the ${pricedBatches} ${pricedBatches === 1 ? 'batch' : 'batches'} with priced ingredients`
            : 'No priced ingredients on any batch yet.'}
        </p>
      </div>
      {grand > 0 && (
        <>
          <div
            role="img"
            aria-label={totals.map((g) => `${g.label} ${money(g.total)}`).join(', ')}
            className="flex h-7 gap-[3px]"
          >
            {totals.map((g, i) => (
              <span
                key={g.id}
                className={cn('min-w-1.5 rounded-[3px]', i === 0 && 'rounded-l-lg', i === totals.length - 1 && 'rounded-r-lg')}
                style={{ flex: `${g.total} 1 0`, background: g.color }}
              />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-2.5 text-sm">
            {totals.map((g) => (
              <li key={g.id} className="flex items-center gap-2.5">
                <span aria-hidden="true" className="size-3 shrink-0 rounded-[3px] shadow-[inset_0_0_0_1px_rgba(33,25,12,0.2)]" style={{ background: g.color }} />
                <span className="flex-1">{g.label}</span>
                <span className="font-mono">{money(g.total)}</span>
              </li>
            ))}
          </ul>
          {honeysPerLb.length > 0 && (
            <p className="mt-auto border-t border-[#EFE8DA] pt-3 text-sm text-[#4A3E2A]">
              Honey is {honeyShare}% of the spend.
              {honeysPerLb.length > 1 &&
                ` ${honeysPerLb[0].name} runs ${money(honeysPerLb[honeysPerLb.length - 1].perLb - honeysPerLb[0].perLb)}/lb less than ${honeysPerLb[honeysPerLb.length - 1].name}.`}
            </p>
          )}
        </>
      )}
    </section>
  )
}

export function PriceBook() {
  const { data: prices, isLoading } = useIngredientPrices()
  const { data: usage } = useIngredientUsage()
  const { data: brews } = useBrews()
  const deletePrice = useDeleteIngredientPrice()
  const [params, setParams] = useSearchParams()
  const [pickedId, setPickedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<PantryDraft | null>(null)
  const handledParam = useRef(false)

  const list = prices ?? []

  // ?ingredient=<name> from a batch's "Change it in the price book" link.
  const wanted = params.get('ingredient')
  useEffect(() => {
    if (handledParam.current || !prices || !wanted) return
    handledParam.current = true
    setDraft({ existing: priceFor(wanted, prices) ?? null, name: wanted })
  }, [prices, wanted])

  const closeDialog = () => {
    setDraft(null)
    if (wanted) setParams({}, { replace: true })
  }

  const picked = list.find((p) => p.id === pickedId) ?? list[0]
  const shelves: IngredientPrice[][] = []
  for (let i = 0; i < list.length; i += PER_SHELF) shelves.push(list.slice(i, i + PER_SHELF))
  const lastChange = list.reduce<string | null>((max, p) => (!max || p.updated_at > max ? p.updated_at : max), null)
  const usageFor = (name: string) => usage?.find((u) => u.ingredient_name.trim().toLowerCase() === name.trim().toLowerCase())
  const pricedBatches = (brews ?? []).filter((b) => b.total_ingredient_cost != null).length
  const conv = picked ? conversions(picked) : []

  return (
    <ShelfPage>
      <HoneyWall>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="min-w-0 flex-[1_1_480px]">
            <p className={cn(eyebrowClass, 'mb-3')}>
              Price book{lastChange ? ` · last change ${fullDate(lastChange)}` : ''}
            </p>
            {isLoading ? (
              <Skeleton className="h-14 w-96 max-w-full bg-honey-line" />
            ) : (
              <h1 className={h1Class}>
                {list.length
                  ? `${list.length} ${list.length === 1 ? 'thing' : 'things'} in the pantry.`
                  : 'The pantry is empty.'}
              </h1>
            )}
            <p className="mt-3.5 max-w-[560px] text-[17px] text-[#4A3A12]">
              Batch and recipe costs read from here, converted between compatible units.
            </p>
          </div>
          <button type="button" onClick={() => setDraft({ existing: null, name: '' })} className={btnInk}>
            <Plus className="size-[18px]" strokeWidth={2.2} />
            Add a price
          </button>
        </div>

        {shelves.map((shelf, s) => (
          <div key={s} className="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="relative min-w-[980px]">
              <Plank className={cn('top-32 h-3.5', plankBottle)} />
              <ul aria-label="Pantry, pick one to convert its price" className="relative grid grid-cols-7">
                {shelf.map((p, i) => {
                  const look = pantryLook(p.ingredient_name, p)
                  const on = picked?.id === p.id
                  return (
                    <li key={p.id} className="min-w-0">
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setPickedId(p.id)}
                        className="group flex w-full flex-col items-center pb-1.5 text-ink"
                      >
                        <span className="flex h-32 w-full items-end justify-center">
                          <PantryContainer
                            kind={look.container}
                            fill={look.fill}
                            className="h-[120px] w-20 transition-transform duration-200 ease-out group-hover:-translate-y-1"
                          />
                        </span>
                        <span aria-hidden="true" className="h-3.5" />
                        <span aria-hidden="true" className="mt-[5px] h-4 w-0.5 bg-[#6E4B00]" />
                        <span
                          className={cn(
                            'inline-flex min-w-[78px] flex-col items-center rounded-[4px_4px_12px_12px] border-[1.5px] border-ink px-2.5 pb-2 pt-1.5 shadow-[0_8px_14px_-10px_rgba(33,25,12,0.6)]',
                            TILTS[(s * PER_SHELF + i) % TILTS.length],
                            on ? 'bg-honey' : 'bg-[#FFF8E6]',
                          )}
                        >
                          <span className="font-mono text-base font-bold leading-tight">{money(p.unit_cost)}</span>
                          <span className="text-[11px] text-[#5C4A1C]">per {p.unit}</span>
                        </span>
                        <span className="mt-3 px-1 text-center text-[13px] font-semibold leading-tight">{p.ingredient_name}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        ))}
        {!isLoading && list.length === 0 && (
          <div className="relative mt-8 h-40">
            <p className="flex h-32 items-center justify-center text-[15px] text-[#6E4B00]">
              Nothing priced yet. Add a honey and see it land here.
            </p>
            <Plank className={cn('top-32 h-3.5', plankBottle)} />
          </div>
        )}
      </HoneyWall>

      {list.length > 0 && (
        <PageBody>
          <div className="flex flex-wrap gap-4">
            {picked && (
              <section className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[22px] bg-ink p-6 text-cream">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className={h2Class}>Unit converter</h2>
                  <span className="text-sm font-semibold text-[#E9DDBF]">{picked.ingredient_name}</span>
                </div>
                <p className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-[52px] font-bold leading-none tracking-[-0.02em] text-honey">
                    {money(picked.unit_cost)}
                  </span>
                  <span className="text-[17px] text-[#E9DDBF]">per {picked.unit}</span>
                </p>
                {conv.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {conv.map((c) => (
                      <div key={c.label} className="rounded-[14px] bg-[rgba(255,246,220,0.07)] p-3.5">
                        <span className="block font-mono text-lg font-medium">{c.value}</span>
                        <span className="block text-[13px] text-[#B9AA88]">{c.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-[14px] bg-[rgba(255,246,220,0.07)] p-3.5 text-sm text-[#E9DDBF]">
                    Counted per {picked.unit}, so there's nothing to convert.
                  </p>
                )}
                <p className="text-[13px] text-[#B9AA88]">Pick anything on the pantry shelf to convert it.</p>
              </section>
            )}
            <SpendCard usage={usage ?? []} prices={list} pricedBatches={pricedBatches} />
          </div>

          <section className="mt-4 overflow-hidden rounded-[22px] border border-[#E7DFCF] bg-white">
            <div className="px-6 py-[18px]">
              <h2 className={h2Class}>All prices</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FBF8F1] text-left text-xs uppercase tracking-[0.06em] text-[#6E6150]">
                    <th scope="col" className="border-y border-[#EFE8DA] px-6 py-3 font-medium">Ingredient</th>
                    <th scope="col" className="border-y border-[#EFE8DA] px-4 py-3 text-right font-medium">Cost</th>
                    <th scope="col" className="border-y border-[#EFE8DA] px-4 py-3 font-medium">Per</th>
                    <th scope="col" className="border-y border-[#EFE8DA] px-4 py-3 font-medium">Used in</th>
                    <th scope="col" className="border-y border-[#EFE8DA] px-4 py-3 font-medium">Updated</th>
                    <th scope="col" className="border-y border-[#EFE8DA] px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const look = pantryLook(p.ingredient_name, p)
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          'transition-colors duration-150 ease-out hover:bg-[#FFFCF3]',
                          picked?.id === p.id && 'bg-[#FFF8E1]',
                        )}
                      >
                        <td className="border-b border-[#EFE8DA] px-6 py-2.5">
                          <span className="inline-flex items-center gap-2.5 font-semibold">
                            <span aria-hidden="true" className="size-2.5 rounded-full shadow-[0_0_0_1.5px_var(--ink)]" style={{ background: look.fill }} />
                            {p.ingredient_name}
                          </span>
                        </td>
                        <td className="border-b border-[#EFE8DA] px-4 py-2.5 text-right font-mono font-semibold">{money(p.unit_cost)}</td>
                        <td className="border-b border-[#EFE8DA] px-4 py-2.5 text-[#4A3E2A]">{p.unit}</td>
                        <td className="border-b border-[#EFE8DA] px-4 py-2.5 text-[#4A3E2A]">{usageText(usageFor(p.ingredient_name))}</td>
                        <td className="whitespace-nowrap border-b border-[#EFE8DA] px-4 py-2.5 font-mono text-[13px] text-[#6E6150]">
                          {fullDate(p.updated_at)}
                        </td>
                        <td className="whitespace-nowrap border-b border-[#EFE8DA] py-1 pl-4 pr-6 text-right">
                          <button
                            type="button"
                            aria-label={`Edit ${p.ingredient_name}`}
                            onClick={() => setDraft({ existing: p, name: p.ingredient_name })}
                            className="min-h-11 rounded-[10px] px-3 text-[13px] font-semibold text-[#8A5300] transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.06)]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${p.ingredient_name}`}
                            onClick={() => {
                              if (confirm(`Remove ${p.ingredient_name} from the price book?`)) deletePrice.mutate(p.id)
                            }}
                            className={cn(btnIcon, 'inline-grid align-middle')}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </PageBody>
      )}

      <PantryDialog draft={draft} prices={list} onClose={closeDialog} />
    </ShelfPage>
  )
}
