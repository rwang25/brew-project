import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, Plus, X } from 'lucide-react'
import { api } from '@/api/client'
import { useCreateBrew, useIngredientPrices, useMeta, useRecipes } from '@/api/hooks'
import type { IngredientPrice, RecipeIngredient, RecipeNutrientAddition, RecipeSummary } from '@/api/types'
import { Carboy, PlannedCarboy } from '@/components/Vessels'
import { ColourDot, HoneyWall, HoneycombBackdrop, PageBody, ShelfPage } from '@/components/shelf'
import { todayIso, todayLabel } from '@/lib/dates'
import { batchColour, pantryLook, priceFor, swatchName } from '@/lib/pantry'
import type { ContainerKind } from '@/lib/pantry'
import {
  btnHoney,
  btnIcon,
  btnQuiet,
  cardClass,
  eyebrowClass,
  fieldClass,
  h1Class,
  h2Class,
  labelClass,
  plankBench,
} from '@/lib/shelfStyles'
import { convertUnitCost, estimateBottleCount } from '@/lib/units'
import { cn } from '@/lib/utils'

interface Row {
  key: number
  name: string
  amount: string
  unit: string
  category: string
  stage: string
}

const CATEGORY_FOR: Record<ContainerKind, string> = {
  honey: 'Fermentable',
  fruit: 'Fruit',
  jug: 'Fermentable',
  spice: 'Spice',
  wood: 'Additive',
  sachet: 'Nutrient',
  packaging: 'Other',
  other: 'Other',
}

let nextKey = 1

function rowFromName(name: string, unit: string): Row {
  const kind = pantryLook(name).container
  return {
    key: nextKey++,
    name,
    amount: '',
    unit,
    category: CATEGORY_FOR[kind],
    stage: kind === 'wood' || kind === 'spice' ? 'Secondary' : 'Primary',
  }
}

function unitCostFor(row: Row, prices: IngredientPrice[] | undefined): number | null {
  const name = row.name.trim().toLowerCase()
  const candidates = prices?.filter((p) => p.ingredient_name.trim().toLowerCase() === name) ?? []
  for (const p of candidates) {
    if (!row.unit) return p.unit_cost
    const converted = convertUnitCost(p.unit_cost, p.unit, row.unit)
    if (converted != null) return converted
  }
  return null
}

export function BrewCreate() {
  const { data: meta } = useMeta()
  const { data: recipes } = useRecipes()
  const { data: prices } = useIngredientPrices()
  const createBrew = useCreateBrew()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [recipeId, setRecipeId] = useState<number | null>(null)
  const [recipeSchedule, setRecipeSchedule] = useState<RecipeNutrientAddition[]>([])
  const initialRecipeHandled = useRef(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [brewType, setBrewType] = useState('Mead')
  const [style, setStyle] = useState('')
  const [startDate, setStartDate] = useState(todayIso())
  const [status, setStatus] = useState('Planning')
  const [batchSize, setBatchSize] = useState('')
  const [batchSizeUnit, setBatchSizeUnit] = useState('gal')
  const [originalGravity, setOriginalGravity] = useState('')
  const [targetAbv, setTargetAbv] = useState('')
  const [yeast, setYeast] = useState('')
  const [vessel, setVessel] = useState('')
  const [temperature, setTemperature] = useState('')
  const [temperatureUnit, setTemperatureUnit] = useState('°F')
  const [processNotes, setProcessNotes] = useState('')
  const [readyDate, setReadyDate] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [custom, setCustom] = useState('')

  const startFrom = useCallback(async (recipe: RecipeSummary | null) => {
    setRecipeId(recipe?.id ?? null)
    if (!recipe) {
      setName('')
      setStyle('')
      setRows([])
      setRecipeSchedule([])
      return
    }
    setName(recipe.name)
    setBrewType(recipe.brew_type)
    setStyle(recipe.style ?? '')
    setBatchSize(recipe.batch_size != null ? String(recipe.batch_size) : '')
    setBatchSizeUnit(recipe.batch_size_unit ?? 'gal')
    setYeast(recipe.yeast ?? '')
    setVessel(recipe.vessel ?? '')
    setTemperature(recipe.temperature != null ? String(recipe.temperature) : '')
    setTemperatureUnit(recipe.temperature_unit ?? '°F')
    setTargetAbv(recipe.target_abv != null ? String(recipe.target_abv) : '')
    setProcessNotes(recipe.process_notes ?? '')
    const [ingredients, schedule] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: ['recipes', recipe.id, 'ingredients'],
        queryFn: () => api.get<RecipeIngredient[]>(`/recipes/${recipe.id}/ingredients`),
      }),
      queryClient.fetchQuery({
        queryKey: ['recipes', recipe.id, 'nutrient-schedule'],
        queryFn: () => api.get<RecipeNutrientAddition[]>(`/recipes/${recipe.id}/nutrient-schedule`),
      }),
    ])
    setRows(
      ingredients.map((ing) => ({
        key: nextKey++,
        name: ing.ingredient_name,
        amount: ing.amount != null ? String(ing.amount) : '',
        unit: ing.unit ?? '',
        category: ing.category ?? CATEGORY_FOR[pantryLook(ing.ingredient_name).container],
        stage: ing.stage ?? 'Primary',
      })),
    )
    setRecipeSchedule(schedule)
  }, [queryClient])

  // ?recipe=<id> from a recipe's "Brew this recipe" button.
  const wanted = Number(params.get('recipe'))
  useEffect(() => {
    if (initialRecipeHandled.current || !recipes || !wanted) return
    initialRecipeHandled.current = true
    const recipe = recipes.find((r) => r.id === wanted)
    if (recipe) void startFrom(recipe)
  }, [recipes, wanted, startFrom])

  const setRow = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const rowCost = (row: Row): number | null => {
    const cost = unitCostFor(row, prices)
    const amount = Number(row.amount)
    if (cost == null || !row.amount || Number.isNaN(amount)) return null
    return cost * amount
  }

  const names = rows.map((r) => r.name).filter((n) => n.trim())
  const colour = batchColour(names, prices)
  const total = rows.reduce((sum, r) => sum + (rowCost(r) ?? 0), 0)
  const anyCost = rows.some((r) => rowCost(r) != null)
  const bottles = estimateBottleCount(batchSize ? Number(batchSize) : null, batchSizeUnit)
  const target = Number(targetAbv)
  const ogForTarget = targetAbv && !Number.isNaN(target) ? (1 + target / 131.25).toFixed(3) : null
  const quickAdd = (prices ?? []).filter((p) => !rows.some((r) => r.name.trim().toLowerCase() === p.ingredient_name.trim().toLowerCase()))

  const addCustom = () => {
    if (!custom.trim()) return
    setRows((rs) => [...rs, rowFromName(custom.trim(), '')])
    setCustom('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Batch name is required.')
      return
    }
    setSaving(true)
    try {
      const brew = await createBrew.mutateAsync({
        name,
        brew_type: brewType,
        style: style || null,
        batch_size: batchSize ? Number(batchSize) : null,
        batch_size_unit: batchSizeUnit,
        start_date: startDate,
        status,
        original_gravity: originalGravity ? Number(originalGravity) : null,
        target_abv: targetAbv ? Number(targetAbv) : null,
        yeast: yeast || null,
        temperature: temperature ? Number(temperature) : null,
        temperature_unit: temperatureUnit,
        vessel: vessel || null,
        process_notes: processNotes || null,
        expected_ready_date: readyDate || null,
        recipe_id: recipeId,
      })
      for (const row of rows) {
        if (!row.name.trim()) continue
        await api.post(`/brews/${brew.id}/ingredients`, {
          ingredient_name: row.name.trim(),
          amount: row.amount ? Number(row.amount) : null,
          unit: row.unit || null,
          category: row.category || null,
          stage: row.stage || null,
          unit_cost: unitCostFor(row, prices),
        })
      }
      for (const dose of recipeSchedule) {
        await api.post(`/brews/${brew.id}/nutrient-schedule`, {
          day_offset: dose.day_offset,
          nutrient_type: dose.nutrient_type,
          amount: dose.amount,
          unit: dose.unit,
          notes: dose.notes,
        })
      }
      await queryClient.invalidateQueries({ queryKey: ['brews'] })
      toast.success(`Created brew #${brew.id}: ${brew.name}`)
      navigate(`/brews/${brew.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ShelfPage>
      <HoneyWall className="pb-9 pt-9">
        <p className={cn(eyebrowClass, 'mb-3')}>New batch · {todayLabel()}</p>
        <h1 className={h1Class}>Start a new batch</h1>
        <div role="group" aria-label="Start from" className="mt-6 flex flex-wrap gap-3">
          {[null, ...(recipes ?? [])].map((recipe) => {
            const on = recipeId === (recipe?.id ?? null)
            return (
              <button
                key={recipe?.id ?? 'blank'}
                type="button"
                aria-pressed={on}
                onClick={() => void startFrom(recipe)}
                className={cn(
                  'flex flex-[1_1_280px] items-center gap-3.5 rounded-2xl border-2 px-[18px] py-4 text-left text-ink transition-shadow duration-150 ease-out',
                  on ? 'border-ink bg-white' : 'border-[#E2CF95] bg-white/60 hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.05)]',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">{recipe ? recipe.name : 'Blank batch'}</span>
                  <span className="block text-sm text-[#6E6150]">
                    {recipe
                      ? ['Recipe', recipe.batch_size != null ? `${recipe.batch_size} ${recipe.batch_size_unit ?? ''}`.trim() : null, recipe.yeast, recipe.target_abv != null ? `target ${recipe.target_abv}%` : null]
                          .filter(Boolean)
                          .join(' · ')
                      : 'Every field empty, any brew type'}
                  </span>
                </span>
                {on ? (
                  <span aria-hidden="true" className="grid size-[26px] shrink-0 place-items-center rounded-full bg-honey">
                    <Check className="size-[15px]" strokeWidth={3} />
                  </span>
                ) : (
                  <span aria-hidden="true" className="size-[26px] shrink-0 rounded-full border-2 border-[#C9A25A]" />
                )}
              </button>
            )
          })}
        </div>
      </HoneyWall>

      <PageBody className="flex flex-wrap items-start gap-4">
        <form id="new-batch" onSubmit={handleSubmit} className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
          <section className={cardClass}>
            <h2 className={cn(h2Class, 'mb-4')}>Basics</h2>
            <div className="flex flex-wrap gap-4">
              <label htmlFor="name" className={cn(labelClass, 'w-full')}>
                Batch name *
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={cn(fieldClass, 'min-h-[46px] text-base font-medium')} />
              </label>
              <fieldset className="w-full">
                <legend className="mb-1.5 text-[13px] font-medium text-[#4A3E2A]">Brew type</legend>
                <div className="flex flex-wrap gap-1.5">
                  {(meta?.brew_types ?? ['Mead']).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={brewType === t}
                      onClick={() => setBrewType(t)}
                      className={cn(
                        'min-h-11 rounded-full border px-4 text-sm transition-shadow duration-150 ease-out',
                        brewType === t
                          ? 'border-ink bg-ink font-semibold text-cream'
                          : 'border-[#DCCFB3] bg-white text-ink hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.06)]',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="style" className={cn(labelClass, 'flex-[2_1_260px]')}>
                Style
                <input id="style" value={style} onChange={(e) => setStyle(e.target.value)} className={fieldClass} />
              </label>
              <div className={cn(labelClass, 'flex-[1_1_180px]')}>
                <label htmlFor="batch_size">Batch size</label>
                <div className="flex gap-2">
                  <input id="batch_size" type="number" step="0.25" min="0" value={batchSize} onChange={(e) => setBatchSize(e.target.value)} className={cn(fieldClass, 'font-mono')} />
                  <select aria-label="Batch size unit" value={batchSizeUnit} onChange={(e) => setBatchSizeUnit(e.target.value)} className={cn(fieldClass, 'w-24')}>
                    {(meta?.batch_size_units ?? ['gal']).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label htmlFor="start_date" className={cn(labelClass, 'flex-[1_1_170px]')}>
                Start date
                <input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
              </label>
              <label htmlFor="status" className={cn(labelClass, 'flex-[1_1_200px]')}>
                Status
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
                  {(meta?.status_options ?? ['Planning']).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className={cn(h2Class, 'mb-4')}>Fermentation</h2>
            <div className="flex flex-wrap gap-4">
              <label htmlFor="yeast" className={cn(labelClass, 'flex-[1_1_240px]')}>
                Yeast
                <input id="yeast" value={yeast} onChange={(e) => setYeast(e.target.value)} className={fieldClass} />
              </label>
              <label htmlFor="vessel" className={cn(labelClass, 'flex-[1_1_240px]')}>
                Vessel
                <input id="vessel" value={vessel} onChange={(e) => setVessel(e.target.value)} className={fieldClass} />
              </label>
              <label htmlFor="og" className={cn(labelClass, 'flex-[1_1_150px]')}>
                Original gravity
                <input id="og" type="number" step="0.001" min="0" max="2" value={originalGravity} onChange={(e) => setOriginalGravity(e.target.value)} className={cn(fieldClass, 'font-mono')} />
                <span className="text-xs font-normal text-[#6E6150]">After mixing the must</span>
              </label>
              <label htmlFor="target_abv" className={cn(labelClass, 'flex-[1_1_150px]')}>
                Target ABV (%)
                <input id="target_abv" type="number" step="0.1" min="0" max="30" value={targetAbv} onChange={(e) => setTargetAbv(e.target.value)} className={cn(fieldClass, 'font-mono')} />
              </label>
              <div className={cn(labelClass, 'flex-[1_1_170px]')}>
                <label htmlFor="temperature">Temperature</label>
                <div className="flex gap-2">
                  <input id="temperature" type="number" step="1" value={temperature} onChange={(e) => setTemperature(e.target.value)} className={cn(fieldClass, 'font-mono')} />
                  <select aria-label="Temperature unit" value={temperatureUnit} onChange={(e) => setTemperatureUnit(e.target.value)} className={cn(fieldClass, 'w-20')}>
                    {(meta?.temperature_units ?? ['°F']).map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h2 className={h2Class}>Ingredients</h2>
              {anyCost && <span className="font-mono text-[15px] font-semibold">${total.toFixed(2)}</span>}
            </div>
            {rows.length === 0 ? (
              <p className="mt-3.5 rounded-[14px] border-[1.5px] border-dashed border-[#D9CBAE] p-4 text-center text-sm text-[#6E6150]">
                No ingredients yet. Add a honey or fruit and the preview picks up its colour.
              </p>
            ) : (
              <ul className="mt-3">
                {rows.map((row) => {
                  const look = pantryLook(row.name, priceFor(row.name, prices))
                  const cost = rowCost(row)
                  const unitCost = unitCostFor(row, prices)
                  return (
                    <li key={row.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#EFE8DA] py-2.5">
                      <ColourDot color={look.fill} />
                      <span className="min-w-0 flex-[1_1_180px]">
                        <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                          {row.name}
                          {colour.decidedBy === row.name && (
                            <span className="rounded-full bg-honey-soft px-2 py-px text-[11px] font-bold text-[#6E4B00]">sets the colour</span>
                          )}
                        </span>
                        <span className="text-[13px] text-[#6E6150]">
                          {row.category} · {row.stage}
                          {unitCost != null && ` · $${unitCost.toFixed(2)}${row.unit ? `/${row.unit}` : ''}`}
                        </span>
                      </span>
                      <label className="sr-only" htmlFor={`amount-${row.key}`}>
                        Amount of {row.name}
                      </label>
                      <input
                        id={`amount-${row.key}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.amount}
                        onChange={(e) => setRow(row.key, { amount: e.target.value })}
                        className={cn(fieldClass, 'w-20 font-mono')}
                      />
                      <label className="sr-only" htmlFor={`unit-${row.key}`}>
                        Unit for {row.name}
                      </label>
                      <input
                        id={`unit-${row.key}`}
                        value={row.unit}
                        onChange={(e) => setRow(row.key, { unit: e.target.value })}
                        className={cn(fieldClass, 'w-20')}
                      />
                      <span className="min-w-[64px] text-right font-mono text-[15px] font-semibold">
                        {cost != null ? `$${cost.toFixed(2)}` : '—'}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${row.name}`}
                        onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                        className={btnIcon}
                      >
                        <X className="size-[18px]" strokeWidth={2} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {quickAdd.length > 0 && (
              <>
                <p className="mb-2.5 mt-[18px] text-[13px] font-medium text-[#4A3E2A]">Add from your price book</p>
                <div className="flex flex-wrap gap-2">
                  {quickAdd.map((p) => {
                    const look = pantryLook(p.ingredient_name, p)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setRows((rs) => [...rs, rowFromName(p.ingredient_name, p.unit)])}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#DCCFB3] bg-white px-3.5 text-sm font-medium text-ink transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.06)]"
                      >
                        <span aria-hidden="true" className="size-2.5 rounded-full shadow-[0_0_0_1px_rgba(33,25,12,0.4)]" style={{ background: look.fill }} />
                        {p.ingredient_name}
                        <span className="font-mono text-xs text-[#6E6150]">
                          ${p.unit_cost.toFixed(2)}/{p.unit}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label htmlFor="custom-ingredient" className={cn(labelClass, 'flex-[1_1_220px]')}>
                Something else
                <input
                  id="custom-ingredient"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustom()
                    }
                  }}
                  className={fieldClass}
                />
              </label>
              <button type="button" onClick={addCustom} className={btnQuiet}>
                <Plus className="size-4" strokeWidth={2.2} />
                Add
              </button>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className={h2Class}>Nutrient schedule</h2>
            {recipeSchedule.length > 0 ? (
              <>
                <p className="mb-2 mt-2 text-[15px] text-[#6E6150]">From the recipe. Each dose becomes a reminder on Home.</p>
                <ul>
                  {recipeSchedule.map((d) => (
                    <li key={d.id} className="flex justify-between gap-4 border-b border-[#EFE8DA] py-2 text-[15px] last:border-b-0">
                      <span className="font-semibold">
                        {d.nutrient_type}
                        {d.amount != null && ` · ${d.amount} ${d.unit ?? ''}`.trimEnd()}
                      </span>
                      <span className="font-mono text-sm text-[#6E6150]">Day {d.day_offset}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-[15px] text-[#6E6150]">
                Add doses on the batch page once it's created, or generate a standard schedule there. Each
                one becomes a reminder on Home.
              </p>
            )}
          </section>

          <section className={cardClass}>
            <label htmlFor="process_notes" className={cn(labelClass, 'text-[15px]')}>
              <span className={h2Class}>Process notes</span>
              <textarea
                id="process_notes"
                rows={4}
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                className={cn(fieldClass, 'py-2.5 leading-relaxed')}
              />
            </label>
          </section>
        </form>

        <aside aria-label="Preview" className="flex min-w-0 flex-[1_1_340px] flex-col overflow-hidden rounded-[22px] border border-honey-line">
          <div className="relative isolate overflow-hidden bg-honey-wall px-[22px] pt-[22px]">
            <HoneycombBackdrop />
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-[#6E4B00]">On your bench</p>
            <div className="flex h-[290px] items-end justify-center">
              {names.length ? (
                <Carboy color={colour.color} className="h-[273px] w-[124px]" />
              ) : (
                <PlannedCarboy label={false} className="h-[273px] w-[124px]" />
              )}
            </div>
            <div aria-hidden="true" className={cn('-mx-[22px] h-[18px]', plankBench)} />
            <p className="flex items-center justify-center gap-2 pb-[18px] pt-[22px] text-center text-sm text-[#4A3A12]">
              <ColourDot color={colour.color} className="size-3" />
              {colour.decidedBy
                ? `${swatchName(colour.color) ?? 'Colour'}, from ${colour.decidedBy}${colour.darkened ? ', a step darker for oak' : ''}`
                : 'No honey or fruit yet'}
            </p>
          </div>
          <div className="flex flex-col gap-4 bg-ink p-[22px] text-cream">
            <dl className="text-sm">
              {[
                ['Ingredient cost', anyCost ? `$${total.toFixed(2)}` : '—'],
                ['Per bottle, about', anyCost && bottles ? `$${(total / bottles).toFixed(2)}` : '—'],
                ['Target ABV', targetAbv ? `${targetAbv}%` : '—'],
                ['OG for target, dry', ogForTarget ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-[rgba(255,246,220,0.12)] py-2.5 last:border-b-0">
                  <dt className="text-[#B9AA88]">{label}</dt>
                  <dd className="font-mono font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <label htmlFor="ready_date" className="flex flex-col gap-1.5 text-[13px] font-medium text-[#E9DDBF]">
              Expected ready date
              <input
                id="ready_date"
                type="date"
                value={readyDate}
                onChange={(e) => setReadyDate(e.target.value)}
                className="min-h-[46px] rounded-[10px] border border-[rgba(255,246,220,0.25)] bg-[#2E2414] px-3 text-[15px] text-cream [color-scheme:dark] focus:border-honey focus:outline-none"
              />
              <span className="text-xs font-normal text-[#B9AA88]">Home reminds you a week before</span>
            </label>
            <button type="submit" form="new-batch" disabled={saving} className={cn(btnHoney, 'min-h-[52px] text-base')}>
              {saving ? 'Putting it on the bench…' : 'Put it on the bench'}
            </button>
            <Link to="/brews" className="-mt-2 flex min-h-11 items-center justify-center text-sm font-medium text-[#E9DDBF] hover:underline">
              Cancel
            </Link>
          </div>
        </aside>
      </PageBody>
    </ShelfPage>
  )
}
