import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCreateBrewFromRecipe, useDeleteRecipe, useRecipes } from '@/api/hooks'
import type { Recipe } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

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
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Recipes</h1>

      {isLoading && <p className="text-muted-foreground">Loading recipes…</p>}

      {!isLoading && recipes?.length === 0 && (
        <p className="text-muted-foreground">
          No saved recipes yet. Save a brew as a recipe from its detail page to reuse it later.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes?.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <CardTitle className="text-base">{recipe.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>{recipe.style || recipe.brew_type}</p>
              <div className="flex gap-4">
                {recipe.batch_size != null && (
                  <span>
                    {recipe.batch_size} {recipe.batch_size_unit}
                  </span>
                )}
                {recipe.target_abv != null && <span>{recipe.target_abv}% target ABV</span>}
              </div>
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
        ))}
      </div>
    </div>
  )
}
