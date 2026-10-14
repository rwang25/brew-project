import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { useDeleteIngredientPrice, useUpsertIngredientPrice } from '@/api/hooks'
import type { IngredientPrice } from '@/api/types'
import { PantryContainer } from '@/components/Vessels'
import { HoneycombBackdrop } from '@/components/shelf'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  CONTAINERS,
  SWATCHES,
  containerInfo,
  guessContainer,
  pantryLook,
  swatchName,
} from '@/lib/pantry'
import type { ContainerKind } from '@/lib/pantry'
import { btnInk, btnQuiet, fieldClass, plankBottle } from '@/lib/shelfStyles'
import { cn } from '@/lib/utils'

const UNITS = ['lb', 'oz', 'g', 'kg', 'gal', 'L', 'qt', 'mL', 'each', 'pack', 'bean']

const NO_TINT: Partial<Record<ContainerKind, string>> = {
  spice: 'Plain spices don’t change a batch’s colour. Botanicals that do, like hibiscus, get one here.',
  wood: 'Oak doesn’t pick a colour; it darkens a batch’s colour one step.',
  sachet: 'Yeast and nutrients don’t change a batch’s colour.',
  packaging: 'Packaging isn’t part of the batch, so it has no colour.',
  other: 'Doesn’t change a batch’s colour. Pick a different shape above if it should.',
}

function Neighbour({ price }: { price: IngredientPrice | null | undefined }) {
  if (!price) return <div aria-hidden="true" />
  const look = pantryLook(price.ingredient_name, price)
  return (
    <div aria-hidden="true" className="flex flex-col items-center opacity-40">
      <span className="flex h-[150px] items-end">
        <PantryContainer kind={look.container} fill={look.fill} className="h-[120px] w-[80px]" />
      </span>
      <span className="h-3.5" />
      <span className="mt-3.5 px-1 text-center text-xs font-semibold">{price.ingredient_name}</span>
    </div>
  )
}

export interface PantryDraft {
  existing: IngredientPrice | null
  name: string
}

function PantryForm({
  draft,
  neighbours,
  onClose,
}: {
  draft: PantryDraft
  neighbours: IngredientPrice[]
  onClose: () => void
}) {
  const existing = draft.existing
  const upsert = useUpsertIngredientPrice()
  const deletePrice = useDeleteIngredientPrice()
  const queryClient = useQueryClient()

  const [name, setName] = useState(existing?.ingredient_name ?? draft.name)
  const [cost, setCost] = useState(existing ? String(existing.unit_cost) : '')
  const [unit, setUnit] = useState(existing?.unit ?? '')
  const [container, setContainer] = useState<ContainerKind | null>(
    CONTAINERS.some((c) => c.id === existing?.container) ? (existing?.container as ContainerKind) : null,
  )
  const [color, setColor] = useState<string | null>(existing?.color ?? null)

  const guess = guessContainer(name)
  const look = pantryLook(name, { container, color })
  const auto = pantryLook(name, { container })
  const effectiveUnit = unit || containerInfo(look.container).defaultUnit
  const costNumber = Number(cost)
  const priceText = cost && !Number.isNaN(costNumber) ? `$${costNumber.toFixed(2)}` : '$ —'
  const displayName = name.trim() || 'Your ingredient'

  let colourHint = ''
  if (look.tint) {
    if (color) colourHint = `Set by you · ${swatchName(color) ?? 'custom'}`
    else if (auto.colourSource === 'matched') colourHint = `Automatic · matched “${auto.match}”`
    else colourHint = `No match for this name, so it uses the ${containerInfo(look.container).label.toLowerCase()} default. Pick what it really gives.`
  }
  const effect = look.tint
    ? 'Batches that use it get this colour on the shelf'
    : look.darkens
      ? 'Batches that use it turn one step darker on the shelf'
      : (NO_TINT[look.container] ?? '')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !cost || Number.isNaN(costNumber)) {
      toast.error('Ingredient and cost are both required.')
      return
    }
    await upsert.mutateAsync({
      ingredient_name: name.trim(),
      unit: effectiveUnit,
      unit_cost: costNumber,
      container,
      color: look.tint ? color : null,
    })
    if (
      existing &&
      (existing.ingredient_name.trim().toLowerCase() !== name.trim().toLowerCase() ||
        existing.unit.toLowerCase() !== effectiveUnit.toLowerCase())
    ) {
      await deletePrice.mutateAsync(existing.id)
    }
    await queryClient.invalidateQueries({ queryKey: ['ingredient-usage'] })
    toast.success(`${name.trim()} is on the shelf.`)
    onClose()
  }

  return (
    <div className="flex flex-wrap">
      <div className="relative isolate flex min-w-0 flex-[1_1_340px] flex-col overflow-hidden bg-honey-wall py-7">
        <HoneycombBackdrop />
        <p className="px-7 font-mono text-xs uppercase tracking-[0.08em] text-[#6E4B00]">On the pantry shelf</p>
        <div className="relative mb-8 mt-12">
          <div aria-hidden="true" className={cn('absolute inset-x-0 top-[150px] h-3.5', plankBottle)} />
          <div className="relative grid grid-cols-3">
            {[neighbours[0], null, neighbours[1]].map((n, i) =>
              i === 1 ? (
                <div key="new" className="flex flex-col items-center">
                  <span className="flex h-[150px] items-end">
                    <PantryContainer kind={look.container} fill={look.fill} stroke={2.2} className="h-[150px] w-[100px]" />
                  </span>
                  <span aria-hidden="true" className="h-3.5" />
                  <span aria-hidden="true" className="mt-[5px] h-4 w-0.5 bg-[#6E4B00]" />
                  <span className="inline-flex min-w-[84px] -rotate-2 flex-col items-center rounded-[4px_4px_12px_12px] border-[1.5px] border-ink bg-honey px-2.5 pb-2 pt-1.5 shadow-[0_8px_14px_-10px_rgba(33,25,12,0.6)]">
                    <span className="font-mono text-[17px] font-bold leading-tight">{priceText}</span>
                    <span className="text-[11px] text-[#3A2E14]">per {effectiveUnit}</span>
                  </span>
                  <span className="mt-3 max-w-[150px] text-center text-sm font-bold leading-tight">{displayName}</span>
                </div>
              ) : (
                <Neighbour key={n?.id ?? `empty-${i}`} price={n} />
              ),
            )}
          </div>
        </div>
        <div className="mx-7 mt-auto rounded-2xl border border-honey-line bg-white/70 p-[18px] pt-4">
          <p className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-[#6E4B00]">Once it's on the shelf</p>
          <ul className="flex flex-col gap-2.5 text-sm text-[#3A2E14]">
            <li className="flex gap-2.5">
              <Check className="mt-0.5 size-[18px] shrink-0 text-[#3B4A28]" strokeWidth={2.6} />
              Batch costs use its price, converted between units
            </li>
            <li className="flex gap-2.5">
              <Check className="mt-0.5 size-[18px] shrink-0 text-[#3B4A28]" strokeWidth={2.6} />
              It shows up in New batch's quick-add
            </li>
            <li className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mx-0.5 mt-[3px] size-3.5 shrink-0 rounded-full shadow-[0_0_0_1.5px_var(--ink)]"
                style={{ background: look.tint ?? (look.darkens ? '#7A3F12' : '#FFFFFF') }}
              />
              {effect}
            </li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex min-w-0 flex-[1_1_520px] flex-col gap-[18px] px-8 pb-6 pt-6">
        <div className="pr-8">
          <DialogTitle className="font-display text-[28px] font-bold tracking-[-0.02em]">
            {existing ? `Edit ${existing.ingredient_name}` : 'Add to the pantry'}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6E6150]">
            Its shape and colour are guessed from the name. Change either if the guess is wrong.
          </DialogDescription>
        </div>

        <div className="flex flex-wrap gap-3.5">
          <label className="flex flex-[2_1_240px] flex-col gap-1.5 text-[13px] font-semibold text-[#4A3E2A]">
            Ingredient
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className={cn(fieldClass, 'min-h-[46px] text-base font-medium')} />
          </label>
          <label className="flex flex-[1_1_110px] flex-col gap-1.5 text-[13px] font-semibold text-[#4A3E2A]">
            Cost ($)
            <input type="number" step="any" min="0" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} className={cn(fieldClass, 'min-h-[46px] font-mono text-base')} />
          </label>
          <label className="flex flex-[1_1_110px] flex-col gap-1.5 text-[13px] font-semibold text-[#4A3E2A]">
            Per
            <input
              list="pantry-units"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={containerInfo(look.container).defaultUnit}
              className={cn(fieldClass, 'min-h-[46px] text-base')}
            />
            <datalist id="pantry-units">
              {UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 flex flex-wrap items-baseline gap-x-2.5 text-[13px] font-semibold text-[#4A3E2A]">
            Looks like
            <span className="font-normal text-[#6E6150]">
              {container ? 'Set by you' : name.trim() ? 'Guessed from the name' : ''}
            </span>
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CONTAINERS.map((c) => {
              const on = look.container === c.id
              const isGuess = c.id === guess && !!name.trim()
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setContainer(c.id === guess ? null : c.id)
                    setColor(null)
                  }}
                  className={cn(
                    'relative flex min-h-[60px] items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[13px] font-semibold text-ink transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.05)]',
                    on ? 'border-2 border-ink bg-[#FFF6DA]' : 'border border-[#E7DFCF] bg-white',
                  )}
                >
                  <PantryContainer kind={c.id} fill={c.baseColor} stroke={5} className="h-12 w-8 shrink-0" />
                  <span className="leading-tight">{c.label}</span>
                  {isGuess && (
                    <span className="absolute -top-2 right-1.5 rounded-full border border-[#E2CF95] bg-honey-soft px-1.5 text-[10px] font-bold tracking-[0.04em] text-[#6E4B00]">
                      GUESS
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[13px] font-semibold text-[#4A3E2A]">
            Colour it gives a batch
            <span className="font-normal text-[#6E6150]">{colourHint}</span>
          </legend>
          {look.tint ? (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={!color}
                onClick={() => setColor(null)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-full bg-white pl-1.5 pr-3 text-[13px] font-semibold text-ink',
                  !color ? 'border-2 border-ink' : 'border border-[#DCCFB3]',
                )}
              >
                <span className="size-[30px] rounded-full border-2 border-dashed border-[#B07400]" style={{ background: auto.tint ?? undefined }} />
                Automatic
              </button>
              {SWATCHES.map((s) => {
                const on = color?.toLowerCase() === s.hex.toLowerCase()
                return (
                  <button
                    key={s.hex}
                    type="button"
                    aria-pressed={on}
                    aria-label={s.name}
                    title={s.name}
                    onClick={() => setColor(s.hex)}
                    className="grid size-11 place-items-center rounded-full transition-transform duration-150 ease-out hover:scale-[1.08]"
                  >
                    <span
                      className="grid size-[34px] place-items-center rounded-full"
                      style={{
                        background: s.hex,
                        boxShadow: on ? '0 0 0 3px #FFFFFF, 0 0 0 5px #21190C' : 'inset 0 0 0 1px rgba(33,25,12,0.2)',
                      }}
                    >
                      {on && <Check className="size-4" strokeWidth={3} color={s.light ? '#21190C' : '#FFFFFF'} />}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-[#EFE8DA] bg-[#FBF8F1] px-3.5 py-3 text-sm text-[#4A3E2A]">
              {NO_TINT[look.container]}
            </p>
          )}
        </fieldset>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#EFE8DA] pt-4">
          <button type="button" onClick={onClose} className={btnQuiet}>
            Cancel
          </button>
          <button type="submit" disabled={upsert.isPending} className={btnInk}>
            {existing ? 'Save changes' : 'Put it on the shelf'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function PantryDialog({
  draft,
  prices,
  onClose,
}: {
  draft: PantryDraft | null
  prices: IngredientPrice[]
  onClose: () => void
}) {
  const neighbours = prices.filter((p) => p.id !== draft?.existing?.id).slice(0, 2)
  return (
    <Dialog open={draft != null} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-white p-0 sm:max-w-[1040px]">
        {draft && (
          <PantryForm
            key={draft.existing?.id ?? `new-${draft.name}`}
            draft={draft}
            neighbours={neighbours}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
