import { useState } from 'react'
import { toast } from 'sonner'
import {
  useDeleteIngredientPrice,
  useIngredientPrices,
  useUpsertIngredientPrice,
} from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2 } from 'lucide-react'

export function PriceBook() {
  const { data: prices } = useIngredientPrices()
  const upsertPrice = useUpsertIngredientPrice()
  const deletePrice = useDeleteIngredientPrice()

  const [ingredientName, setIngredientName] = useState('')
  const [unit, setUnit] = useState('')
  const [unitCost, setUnitCost] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ingredientName.trim() || !unit.trim() || !unitCost) {
      toast.error('Ingredient, unit, and cost are all required.')
      return
    }
    await upsertPrice.mutateAsync({
      ingredient_name: ingredientName,
      unit,
      unit_cost: Number(unitCost),
    })
    setIngredientName('')
    setUnit('')
    setUnitCost('')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Ingredient prices</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Set a cost per unit once — matching ingredient names on a batch auto-fill from here,
        even when you bought it in bulk across multiple batches.
      </p>

      {prices && prices.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingredient</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Cost per unit</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.ingredient_name}</TableCell>
                <TableCell>{p.unit}</TableCell>
                <TableCell>${p.unit_cost.toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deletePrice.mutate(p.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground text-sm mb-6">No prices set yet.</p>
      )}

      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-4 items-end mt-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ingredient</label>
          <Input value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Unit</label>
          <Input placeholder="lb, g, oz" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Cost per unit</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={upsertPrice.isPending}>
          Save price
        </Button>
      </form>
    </div>
  )
}
