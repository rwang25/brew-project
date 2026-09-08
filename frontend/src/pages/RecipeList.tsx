import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCreateBrewFromRecipe, useDeleteRecipe, useRecipes } from '@/api/hooks'
import type { Recipe } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { costPerBottle } from '@/lib/units'
import { NotebookText, Trash2 } from 'lucide-react'

const today = () => new Date().toISOString().slice(0, 10)

function StartBrewDialog({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(today())
  const createBrew = useCreateBrewFromRecipe(recipe.id)
  const navigate = useNavigate()

  const handleCreate = async () => {
    const brew = await createBrew.mutateAsync(startDate)
    toast.success(`Started "${brew.name}" from recipe.`)
    setOpen(false)
    navigate(`/brews/${brew.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Start brew</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a brew from "{recipe.name}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={createBrew.isPending}>
            {createBrew.isPending ? 'Creating…' : 'Create brew'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RecipeList() {
  const { data: recipes, isLoading } = useRecipes()
  const deleteRecipe = useDeleteRecipe()

  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-3xl font-medium tracking-tight mb-8">Recipes</h1>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && recipes?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <NotebookText className="size-8 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            No saved recipes yet. Save a batch as a recipe from its detail page to reuse it later.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes?.map((recipe) => {
          const perBottle = costPerBottle(
            recipe.estimated_cost,
            recipe.batch_size,
            recipe.batch_size_unit,
          )
          return (
            <Card key={recipe.id}>
              <CardHeader>
                <CardTitle className="font-serif text-lg font-medium">{recipe.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>{recipe.style || recipe.brew_type}</p>
                <div className="flex gap-4 font-mono text-xs">
                  {recipe.batch_size != null && (
                    <span>
                      {recipe.batch_size} {recipe.batch_size_unit}
                    </span>
                  )}
                  {recipe.target_abv != null && <span>{recipe.target_abv}% target ABV</span>}
                </div>
                {recipe.estimated_cost != null && (
                  <div className="font-mono text-xs">
                    <span className="font-medium text-foreground">
                      ${recipe.estimated_cost.toFixed(2)} estimated
                    </span>
                    {perBottle != null && <span> · ${perBottle.toFixed(2)}/bottle</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <StartBrewDialog recipe={recipe} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRecipe.mutate(recipe.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
