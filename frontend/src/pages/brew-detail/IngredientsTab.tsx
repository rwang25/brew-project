import { useState } from 'react'
import { toast } from 'sonner'
import {
  useAddIngredient,
  useDeleteIngredient,
  useIngredientPrices,
  useIngredients,
  useMeta,
  useUpdateIngredient,
} from '@/api/hooks'
import type { Ingredient, IngredientUpdateInput, Meta } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { convertUnitCost } from '@/lib/units'

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

function EditableIngredientRow({
  ingredient,
  meta,
  onSave,
  onCancel,
  isSaving,
}: {
  ingredient: Ingredient
  meta: Meta | undefined
  onSave: (input: IngredientUpdateInput) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [state, setState] = useState<EditState>(() => toEditState(ingredient))
  const set = <K extends keyof EditState>(key: K) => (value: EditState[K]) =>
    setState((s) => ({ ...s, [key]: value }))

  const handleSave = () => {
    const input = toUpdateInput(state)
    if (input) onSave(input)
  }

  return (
    <TableRow>
      <TableCell>
        <Input value={state.name} onChange={(e) => set('name')(e.target.value)} className="h-8" />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={state.amount}
          onChange={(e) => set('amount')(e.target.value)}
          className="h-8 w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          value={state.unit}
          onChange={(e) => set('unit')(e.target.value)}
          className="h-8 w-16"
          placeholder="lb, g"
        />
      </TableCell>
      <TableCell>
        <Select value={state.category} onValueChange={set('category')}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {meta?.ingredient_categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select value={state.stage} onValueChange={set('stage')}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {meta?.ingredient_stages.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="date"
          value={state.additionDate}
          onChange={(e) => set('additionDate')(e.target.value)}
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={state.unitCost}
          onChange={(e) => set('unitCost')(e.target.value)}
          className="h-8 w-20"
          placeholder="cost/unit"
        />
      </TableCell>
      <TableCell>
        <Input value={state.notes} onChange={(e) => set('notes')(e.target.value)} className="h-8" />
      </TableCell>
      <TableCell className="sticky right-0 bg-background border-l">
        <div className="flex">
          <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving}>
            <Check className="size-4 text-accent-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isSaving}>
            <X className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function IngredientCard({
  ingredient,
  meta,
  onDelete,
}: {
  ingredient: Ingredient
  meta: Meta | undefined
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [state, setState] = useState<EditState>(() => toEditState(ingredient))
  const updateIngredient = useUpdateIngredient(ingredient.brew_id)
  const set = <K extends keyof EditState>(key: K) => (value: EditState[K]) =>
    setState((s) => ({ ...s, [key]: value }))

  const handleSave = async () => {
    const input = toUpdateInput(state)
    if (!input) return
    await updateIngredient.mutateAsync({ id: ingredient.id, input })
    setEditing(false)
  }

  const handleCancel = () => {
    setState(toEditState(ingredient))
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <Input
          value={state.name}
          onChange={(e) => set('name')(e.target.value)}
          placeholder="Ingredient"
          aria-label="Ingredient name"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={state.amount}
            onChange={(e) => set('amount')(e.target.value)}
            placeholder="Amount"
            aria-label="Amount"
          />
          <Input
            value={state.unit}
            onChange={(e) => set('unit')(e.target.value)}
            placeholder="Unit"
            aria-label="Unit"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select value={state.category} onValueChange={set('category')}>
            <SelectTrigger aria-label="Category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {meta?.ingredient_categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={state.stage} onValueChange={set('stage')}>
            <SelectTrigger aria-label="Stage">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              {meta?.ingredient_stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            value={state.additionDate}
            onChange={(e) => set('additionDate')(e.target.value)}
            aria-label="Addition date"
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            value={state.unitCost}
            onChange={(e) => set('unitCost')(e.target.value)}
            placeholder="Cost per unit"
            aria-label="Cost per unit"
          />
        </div>
        <Input
          value={state.notes}
          onChange={(e) => set('notes')(e.target.value)}
          placeholder="Notes"
          aria-label="Notes"
        />
        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={updateIngredient.isPending} className="flex-1">
            Save
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateIngredient.isPending}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">{ingredient.ingredient_name}</span>
        <div className="flex -mr-2 -mt-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground font-mono">
        {ingredient.amount != null && (
          <span>
            {ingredient.amount} {ingredient.unit}
          </span>
        )}
        {ingredient.category && <span>{ingredient.category}</span>}
        {ingredient.stage && <span>{ingredient.stage}</span>}
        {ingredient.addition_date && <span>{ingredient.addition_date}</span>}
        {ingredient.total_cost != null && (
          <span className="text-foreground font-medium">
            ${ingredient.total_cost.toFixed(2)}
          </span>
        )}
      </div>
      {ingredient.notes && (
        <p className="text-sm text-muted-foreground mt-1.5">{ingredient.notes}</p>
      )}
    </div>
  )
}

export function IngredientsTab({ brewId }: { brewId: number }) {
  const { data: ingredients } = useIngredients(brewId)
  const { data: meta } = useMeta()
  const { data: prices } = useIngredientPrices()
  const addIngredient = useAddIngredient(brewId)
  const updateIngredient = useUpdateIngredient(brewId)
  const deleteIngredient = useDeleteIngredient(brewId)

  const [editingId, setEditingId] = useState<number | null>(null)

  const [ingredientName, setIngredientName] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('')
  const [category, setCategory] = useState('Fermentable')
  const [stage, setStage] = useState('Primary')
  const [additionDate, setAdditionDate] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [unitCostTouched, setUnitCostTouched] = useState(false)
  const [notes, setNotes] = useState('')

  const totalCost = ingredients?.reduce((sum, ing) => sum + (ing.total_cost ?? 0), 0) ?? 0
  const hasAnyCost = ingredients?.some((ing) => ing.total_cost != null)

  // Re-derives cost-per-unit from the pricebook whenever the ingredient name
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
        setUnitCost(converted.toPrecision(4).replace(/\.?0+$/, ''))
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
  }

  const handleSaveEdit = async (input: IngredientUpdateInput) => {
    if (editingId == null) return
    await updateIngredient.mutateAsync({ id: editingId, input })
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {ingredients && ingredients.length > 0 ? (
        <>
          {/* Desktop / tablet: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-20 sticky right-0 bg-background border-l" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ing) =>
                  editingId === ing.id ? (
                    <EditableIngredientRow
                      key={ing.id}
                      ingredient={ing}
                      meta={meta}
                      onSave={handleSaveEdit}
                      onCancel={() => setEditingId(null)}
                      isSaving={updateIngredient.isPending}
                    />
                  ) : (
                    <TableRow key={ing.id}>
                      <TableCell className="font-medium">{ing.ingredient_name}</TableCell>
                      <TableCell>{ing.amount ?? '—'}</TableCell>
                      <TableCell>{ing.unit ?? '—'}</TableCell>
                      <TableCell>{ing.category ?? '—'}</TableCell>
                      <TableCell>{ing.stage ?? '—'}</TableCell>
                      <TableCell>{ing.addition_date ?? '—'}</TableCell>
                      <TableCell>
                        {ing.total_cost != null ? `$${ing.total_cost.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ing.notes || '—'}</TableCell>
                      <TableCell className="sticky right-0 bg-background border-l">
                        <div className="flex">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingId(ing.id)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteIngredient.mutate(ing.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
              {hasAnyCost && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6} className="text-right font-medium">
                      Total ingredient cost
                    </TableCell>
                    <TableCell className="font-medium">${totalCost.toFixed(2)}</TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="md:hidden space-y-3">
            {ingredients.map((ing) => (
              <IngredientCard
                key={ing.id}
                ingredient={ing}
                meta={meta}
                onDelete={() => deleteIngredient.mutate(ing.id)}
              />
            ))}
            {hasAnyCost && (
              <div className="flex justify-between rounded-lg border border-dashed px-4 py-3 text-sm font-medium">
                <span>Total ingredient cost</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">No ingredients recorded.</p>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 sm:grid-cols-6 items-end">
        <div className="col-span-2 space-y-1.5">
          <label htmlFor="new-ingredient-name" className="text-sm font-medium">
            Ingredient
          </label>
          <Input
            id="new-ingredient-name"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            onBlur={(e) => deriveCostFromPricebook(e.target.value, unit)}
          />
          {prices && prices.length > 0 && (
            <Select onValueChange={handleQuickFill}>
              <SelectTrigger className="h-8 text-xs text-muted-foreground" aria-label="Quick-fill from priced ingredients">
                <SelectValue placeholder="Or pick a priced ingredient…" />
              </SelectTrigger>
              <SelectContent>
                {prices.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.ingredient_name} ({p.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-ingredient-amount" className="text-sm font-medium">
            Amount
          </label>
          <Input
            id="new-ingredient-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-ingredient-unit" className="text-sm font-medium">
            Unit
          </label>
          <Input
            id="new-ingredient-unit"
            placeholder="lb, g, oz"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            onBlur={(e) => deriveCostFromPricebook(ingredientName, e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-ingredient-category" className="text-sm font-medium">
            Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="new-ingredient-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meta?.ingredient_categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-ingredient-stage" className="text-sm font-medium">
            Stage
          </label>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger id="new-ingredient-stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meta?.ingredient_stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-ingredient-date" className="text-sm font-medium">
            Addition date
          </label>
          <Input
            id="new-ingredient-date"
            type="date"
            value={additionDate}
            onChange={(e) => setAdditionDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-ingredient-cost" className="text-sm font-medium">
            Cost per unit
          </label>
          <Input
            id="new-ingredient-cost"
            type="number"
            step="0.01"
            min="0"
            value={unitCost}
            onChange={(e) => {
              setUnitCostTouched(true)
              setUnitCost(e.target.value)
            }}
          />
        </div>
        <div className="col-span-2 sm:col-span-4 space-y-1.5">
          <label htmlFor="new-ingredient-notes" className="text-sm font-medium">
            Notes
          </label>
          <Input
            id="new-ingredient-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={addIngredient.isPending} className="col-span-2 sm:col-span-1">
          Add ingredient
        </Button>
      </form>
    </div>
  )
}
