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
  const [name, setName] = useState(ingredient.ingredient_name)
  const [amount, setAmount] = useState(ingredient.amount != null ? String(ingredient.amount) : '')
  const [unit, setUnit] = useState(ingredient.unit ?? '')
  const [category, setCategory] = useState(ingredient.category ?? '')
  const [stage, setStage] = useState(ingredient.stage ?? '')
  const [additionDate, setAdditionDate] = useState(ingredient.addition_date ?? '')
  const [unitCost, setUnitCost] = useState(
    ingredient.unit_cost != null ? String(ingredient.unit_cost) : '',
  )
  const [notes, setNotes] = useState(ingredient.notes ?? '')

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Ingredient name is required.')
      return
    }
    onSave({
      ingredient_name: name,
      amount: amount ? Number(amount) : null,
      unit: unit || null,
      category: category || null,
      stage: stage || null,
      addition_date: additionDate || null,
      unit_cost: unitCost ? Number(unitCost) : null,
      notes: notes || null,
    })
  }

  return (
    <TableRow>
      <TableCell>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.1"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-8 w-20"
        />
      </TableCell>
      <TableCell>
        <Input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="h-8 w-16"
          placeholder="lb, g"
        />
      </TableCell>
      <TableCell>
        <Select value={category} onValueChange={setCategory}>
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
        <Select value={stage} onValueChange={setStage}>
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
          value={additionDate}
          onChange={(e) => setAdditionDate(e.target.value)}
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value)}
          className="h-8 w-20"
          placeholder="cost/unit"
        />
      </TableCell>
      <TableCell>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-8" />
      </TableCell>
      <TableCell>
        <div className="flex">
          <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving}>
            <Check className="size-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={isSaving}>
            <X className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
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

  const applyPriceLookup = (name: string) => {
    if (unitCostTouched) return
    const match = prices?.find((p) => p.ingredient_name.toLowerCase() === name.toLowerCase())
    if (match) {
      setUnitCost(String(match.unit_cost))
      if (!unit) setUnit(match.unit)
    }
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
              <TableHead className="w-20" />
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
                  <TableCell>
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
      ) : (
        <p className="text-muted-foreground text-sm">No ingredients recorded.</p>
      )}

      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-6 items-end">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Ingredient</label>
          <Input
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            onBlur={(e) => applyPriceLookup(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Unit</label>
          <Input placeholder="lb, g, oz" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
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
          <label className="text-sm font-medium">Stage</label>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger>
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
          <label className="text-sm font-medium">Addition date</label>
          <Input
            type="date"
            value={additionDate}
            onChange={(e) => setAdditionDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Cost per unit</label>
          <Input
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
        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-sm font-medium">Notes</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button type="submit" disabled={addIngredient.isPending}>
          Add ingredient
        </Button>
      </form>
    </div>
  )
}
