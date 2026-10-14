import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  useAddIngredient,
  useDeleteIngredient,
  useIngredientPrices,
  useIngredients,
  useMeta,
  useUpdateIngredient,
} from '@/api/hooks'
import type { Brew, Ingredient, IngredientUpdateInput, Meta } from '@/api/types'
import { ColourDot } from '@/components/shelf'
import { Skeleton } from '@/components/ui/skeleton'
import { fullDate } from '@/lib/dates'
import { batchColour, pantryLook, priceFor } from '@/lib/pantry'
import {
  btnIcon,
  btnInk,
  btnQuiet,
  cardClass,
  fieldClass,
  h2Class,
  labelClass,
} from '@/lib/shelfStyles'
import { convertUnitCost, costPerBottle, estimateBottleCount } from '@/lib/units'
import { cn } from '@/lib/utils'

interface EditState {
  name: string
  amount: string
  unit: string
  category: string
  stage: string
  additionDate: string
  unitCost: string
  notes: string
}

function toEditState(ingredient: Ingredient): EditState {
  return {
    name: ingredient.ingredient_name,
    amount: ingredient.amount != null ? String(ingredient.amount) : '',
    unit: ingredient.unit ?? '',
    category: ingredient.category ?? '',
    stage: ingredient.stage ?? '',
    additionDate: ingredient.addition_date ?? '',
    unitCost: ingredient.unit_cost != null ? String(ingredient.unit_cost) : '',
    notes: ingredient.notes ?? '',
  }
}

function toUpdateInput(state: EditState): IngredientUpdateInput | null {
  if (!state.name.trim()) {
    toast.error('Ingredient name is required.')
    return null
  }
  return {
    ingredient_name: state.name,
    amount: state.amount ? Number(state.amount) : null,
    unit: state.unit || null,
    category: state.category || null,
    stage: state.stage || null,
    addition_date: state.additionDate || null,
    unit_cost: state.unitCost ? Number(state.unitCost) : null,
    notes: state.notes || null,
  }
}

function SelectField({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string
  value: string
  options: string[] | undefined
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <label className={cn(labelClass, className)}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {!value && <option value="">—</option>}
        {options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

function IngredientEditor({
  ingredient,
  meta,
  onDone,
}: {
  ingredient: Ingredient
  meta: Meta | undefined
  onDone: () => void
}) {
  const [state, setState] = useState<EditState>(() => toEditState(ingredient))
  const updateIngredient = useUpdateIngredient(ingredient.brew_id)
  const set = <K extends keyof EditState>(key: K) => (value: EditState[K]) =>
    setState((s) => ({ ...s, [key]: value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const input = toUpdateInput(state)
    if (!input) return
    await updateIngredient.mutateAsync({ id: ingredient.id, input })
    onDone()
  }

  return (
    <form
      onSubmit={handleSave}
      aria-label={`Edit ${ingredient.ingredient_name}`}
      className="my-2 flex flex-wrap items-end gap-3 rounded-[14px] border border-honey-line bg-[#FFF6DA] p-4"
    >
      <label className={cn(labelClass, 'flex-[2_1_220px]')}>
        Ingredient
        <input value={state.name} onChange={(e) => set('name')(e.target.value)} className={fieldClass} />
      </label>
      <label className={cn(labelClass, 'flex-[1_1_90px]')}>
        Amount
        <input type="number" step="0.01" min="0" value={state.amount} onChange={(e) => set('amount')(e.target.value)} className={cn(fieldClass, 'font-mono')} />
      </label>
      <label className={cn(labelClass, 'flex-[1_1_80px]')}>
        Unit
        <input value={state.unit} onChange={(e) => set('unit')(e.target.value)} className={fieldClass} />
      </label>
      <label className={cn(labelClass, 'flex-[1_1_110px]')}>
        Cost per unit
        <input type="number" step="any" min="0" value={state.unitCost} onChange={(e) => set('unitCost')(e.target.value)} className={cn(fieldClass, 'font-mono')} />
      </label>
      <SelectField label="Category" value={state.category} options={meta?.ingredient_categories} onChange={set('category')} className="flex-[1_1_140px]" />
      <SelectField label="Stage" value={state.stage} options={meta?.ingredient_stages} onChange={set('stage')} className="flex-[1_1_120px]" />
      <label className={cn(labelClass, 'flex-[1_1_150px]')}>
        Added on
        <input type="date" value={state.additionDate} onChange={(e) => set('additionDate')(e.target.value)} className={fieldClass} />
      </label>
      <label className={cn(labelClass, 'flex-[2_1_200px]')}>
        Notes
        <input value={state.notes} onChange={(e) => set('notes')(e.target.value)} className={fieldClass} />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={updateIngredient.isPending} className={cn(btnInk, 'min-h-11 rounded-[10px]')}>
          Save
        </button>
        <button type="button" onClick={onDone} disabled={updateIngredient.isPending} className={btnQuiet}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export function IngredientsTab({ brew }: { brew: Brew }) {
  const brewId = brew.id
  const { data: ingredients } = useIngredients(brewId)
  const { data: meta } = useMeta()
  const { data: prices } = useIngredientPrices()
  const addIngredient = useAddIngredient(brewId)
  const deleteIngredient = useDeleteIngredient(brewId)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const [ingredientName, setIngredientName] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('')
  const [category, setCategory] = useState('Fermentable')
  const [stage, setStage] = useState('Primary')
  const [additionDate, setAdditionDate] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [unitCostTouched, setUnitCostTouched] = useState(false)
  const [notes, setNotes] = useState('')

  const list = ingredients ?? []
  const totalCost = list.reduce((sum, ing) => sum + (ing.total_cost ?? 0), 0)
  const hasAnyCost = list.some((ing) => ing.total_cost != null)
  const colour = batchColour(
    list.map((i) => i.ingredient_name),
    prices,
  )
  const perBottle = costPerBottle(hasAnyCost ? totalCost : null, brew.batch_size, brew.batch_size_unit)
  const bottles = estimateBottleCount(brew.batch_size, brew.batch_size_unit)
  const showForm = adding || (ingredients !== undefined && list.length === 0)

  // Re-derives cost-per-unit from the price book whenever the ingredient name
  // or the unit changes (never once the user has typed a cost themselves).
  // If this ingredient is priced in a different but convertible unit (e.g.
  // priced per lb, this addition logged in g), the cost converts along with
  // it instead of requiring an exact unit match.
  const deriveCostFromPricebook = (name: string, currentUnit: string) => {
    if (unitCostTouched) return
    const candidates = prices?.filter((p) => p.ingredient_name.toLowerCase() === name.toLowerCase())
    if (!candidates || candidates.length === 0) return

    if (!currentUnit) {
      setUnitCost(String(candidates[0].unit_cost))
      setUnit(candidates[0].unit)
      return
    }

    const exact = candidates.find((p) => p.unit.toLowerCase() === currentUnit.toLowerCase())
    if (exact) {
      setUnitCost(String(exact.unit_cost))
      return
    }

    for (const candidate of candidates) {
      const converted = convertUnitCost(candidate.unit_cost, candidate.unit, currentUnit)
      if (converted != null) {
        setUnitCost(String(Number(converted.toFixed(6))))
        return
      }
    }
  }

  const handleQuickFill = (priceId: string) => {
    const match = prices?.find((p) => String(p.id) === priceId)
    if (!match) return
    setIngredientName(match.ingredient_name)
    setUnit(match.unit)
    setUnitCost(String(match.unit_cost))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ingredientName.trim()) {
      toast.error('Ingredient name is required.')
      return
    }
    await addIngredient.mutateAsync({
      ingredient_name: ingredientName,
      amount: amount ? Number(amount) : null,
      unit: unit || null,
      category,
      stage,
      addition_date: additionDate || null,
      unit_cost: unitCost ? Number(unitCost) : null,
      notes: notes || null,
    })
    setIngredientName('')
    setAmount('')
    setUnit('')
    setAdditionDate('')
    setUnitCost('')
    setUnitCostTouched(false)
    setNotes('')
    setAdding(false)
  }

  return (
    <section id="ingredients" className={cn(cardClass, 'scroll-mt-24')}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className={h2Class}>Ingredients</h2>
        {!showForm && (
          <button type="button" onClick={() => setAdding(true)} className={btnQuiet}>
            <Plus className="size-4" strokeWidth={2.2} />
            Add ingredient
          </button>
        )}
      </div>

      {ingredients === undefined ? (
        <Skeleton className="mt-3 h-24 w-full" />
      ) : list.length > 0 ? (
        <ul className="mt-3">
          {list.map((ing) => {
            if (editingId === ing.id) {
              return (
                <li key={ing.id}>
                  <IngredientEditor ingredient={ing} meta={meta} onDone={() => setEditingId(null)} />
                </li>
              )
            }
            const look = pantryLook(ing.ingredient_name, priceFor(ing.ingredient_name, prices))
            const decides = colour.decidedBy === ing.ingredient_name
            const details = [
              ing.category,
              ing.stage,
              ing.addition_date ? `added ${fullDate(ing.addition_date)}` : null,
              ing.notes,
            ].filter(Boolean)
            return (
              <li
                key={ing.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#EFE8DA] py-3.5"
              >
                <ColourDot color={look.fill} />
                <span className="min-w-0 flex-[1_1_220px]">
                  <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                    {ing.ingredient_name}
                    {decides && (
                      <span className="rounded-full bg-honey-soft px-2 py-px text-[11px] font-bold text-[#6E4B00]">
                        sets the colour
                      </span>
                    )}
                    {look.darkens && (
                      <span className="rounded-full bg-[#F1E2C8] px-2 py-px text-[11px] font-bold text-[#5E4520]">
                        darkens a step
                      </span>
                    )}
                  </span>
                  {details.length > 0 && <span className="text-[13px] text-[#6E6150]">{details.join(' · ')}</span>}
                </span>
                <span className="font-mono text-sm">
                  {ing.amount != null ? `${ing.amount} ${ing.unit ?? ''}`.trim() : '—'}
                </span>
                {ing.unit_cost != null && (
                  <span className="font-mono text-[13px] text-[#6E6150]">
                    × ${ing.unit_cost.toFixed(2)}
                    {ing.unit ? `/${ing.unit}` : ''}
                  </span>
                )}
                <span className="min-w-[72px] text-right font-mono text-[15px] font-semibold">
                  {ing.total_cost != null ? `$${ing.total_cost.toFixed(2)}` : '—'}
                </span>
                <span className="flex">
                  <button
                    type="button"
                    aria-label={`Edit ${ing.ingredient_name}`}
                    onClick={() => setEditingId(ing.id)}
                    className={btnIcon}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${ing.ingredient_name}`}
                    onClick={() => deleteIngredient.mutate(ing.id)}
                    className={btnIcon}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#6E6150]">No ingredients yet.</p>
      )}

      {list.length > 0 && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 pt-3.5">
          <p className="text-[13px] text-[#6E6150]">
            Unit costs come from your{' '}
            <Link to="/prices" className="font-semibold text-[#8A5300] hover:underline">
              price book
            </Link>
            {perBottle != null && bottles != null && ` · about $${perBottle.toFixed(2)} a bottle across ${bottles} bottles`}
          </p>
          {hasAnyCost && (
            <p className="flex items-baseline gap-2.5" data-testid="ingredient-total">
              <span className="text-sm font-semibold">Total ingredient cost</span>
              <span className="font-mono text-lg font-bold">${totalCost.toFixed(2)}</span>
            </p>
          )}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          aria-label="Add ingredient"
          className="mt-5 flex flex-wrap items-end gap-3 rounded-[14px] border border-honey-line bg-[#FFF6DA] p-4"
        >
          <div className="flex w-full flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">Add ingredient</p>
            {prices && prices.length > 0 && (
              <label className="flex items-center gap-2 text-[13px] text-[#4A3E2A]">
                From the price book
                <select
                  value=""
                  onChange={(e) => handleQuickFill(e.target.value)}
                  className={cn(fieldClass, 'min-h-9 w-auto text-[13px]')}
                >
                  <option value="">Pick one…</option>
                  {prices.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.ingredient_name} ({p.unit})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label htmlFor="new-ingredient-name" className={cn(labelClass, 'flex-[2_1_220px]')}>
            Ingredient
            <input
              id="new-ingredient-name"
              value={ingredientName}
              onChange={(e) => setIngredientName(e.target.value)}
              onBlur={(e) => deriveCostFromPricebook(e.target.value, unit)}
              className={fieldClass}
            />
          </label>
          <label htmlFor="new-ingredient-amount" className={cn(labelClass, 'flex-[1_1_90px]')}>
            Amount
            <input
              id="new-ingredient-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(fieldClass, 'font-mono')}
            />
          </label>
          <label htmlFor="new-ingredient-unit" className={cn(labelClass, 'flex-[1_1_80px]')}>
            Unit
            <input
              id="new-ingredient-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              onBlur={(e) => deriveCostFromPricebook(ingredientName, e.target.value)}
              className={fieldClass}
            />
          </label>
          <label htmlFor="new-ingredient-cost" className={cn(labelClass, 'flex-[1_1_110px]')}>
            Cost per unit
            <input
              id="new-ingredient-cost"
              type="number"
              step="any"
              min="0"
              value={unitCost}
              onChange={(e) => {
                setUnitCostTouched(true)
                setUnitCost(e.target.value)
              }}
              className={cn(fieldClass, 'font-mono')}
            />
          </label>
          <SelectField label="Category" value={category} options={meta?.ingredient_categories} onChange={setCategory} className="flex-[1_1_140px]" />
          <SelectField label="Stage" value={stage} options={meta?.ingredient_stages} onChange={setStage} className="flex-[1_1_120px]" />
          <label htmlFor="new-ingredient-date" className={cn(labelClass, 'flex-[1_1_150px]')}>
            Added on
            <input
              id="new-ingredient-date"
              type="date"
              value={additionDate}
              onChange={(e) => setAdditionDate(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label htmlFor="new-ingredient-notes" className={cn(labelClass, 'flex-[2_1_200px]')}>
            Notes
            <input
              id="new-ingredient-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={fieldClass}
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={addIngredient.isPending} className={cn(btnInk, 'min-h-11 rounded-[10px]')}>
              Add ingredient
            </button>
            {list.length > 0 && (
              <button type="button" onClick={() => setAdding(false)} className={btnQuiet}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
