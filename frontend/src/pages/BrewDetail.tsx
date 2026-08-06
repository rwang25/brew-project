import { useParams } from 'react-router-dom'
import { useBrew, useIngredients } from '@/api/hooks'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IngredientsTab } from '@/pages/brew-detail/IngredientsTab'
import { GravityTab } from '@/pages/brew-detail/GravityTab'
import { NutrientScheduleTab } from '@/pages/brew-detail/NutrientScheduleTab'
import { EditBrewTab } from '@/pages/brew-detail/EditBrewTab'
import { Timeline } from '@/pages/brew-detail/Timeline'
import { SaveAsRecipeDialog } from '@/pages/brew-detail/SaveAsRecipeDialog'
import { STATUS_BADGE_CLASS } from '@/lib/status'
import { costPerBottle } from '@/lib/units'

export function BrewDetail() {
  const { id } = useParams()
  const brewId = Number(id)
  const { data: brew, isLoading } = useBrew(brewId)
  const { data: ingredients } = useIngredients(brewId)

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!brew) return <p className="text-muted-foreground">Brew not found.</p>

  const totalCost = ingredients?.reduce((sum, ing) => sum + (ing.total_cost ?? 0), 0) ?? 0
  const hasCost = ingredients?.some((ing) => ing.total_cost != null)
  const perBottle = costPerBottle(hasCost ? totalCost : null, brew.batch_size, brew.batch_size_unit)

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">{brew.name}</h1>
          <p className="text-muted-foreground">{brew.style || brew.brew_type}</p>
        </div>
        <div className="flex items-center gap-2">
          <SaveAsRecipeDialog brewId={brew.id} brewName={brew.name} />
          <Badge variant="secondary" className={STATUS_BADGE_CLASS[brew.status] ?? ''}>
            {brew.status}
          </Badge>
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-sm font-mono">
        <div>
          <dt className="text-muted-foreground font-sans">Started</dt>
          <dd>{brew.start_date}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-sans">Batch size</dt>
          <dd>
            {brew.batch_size != null ? `${brew.batch_size} ${brew.batch_size_unit}` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-sans">OG / FG</dt>
          <dd>
            {brew.original_gravity ?? '—'} / {brew.final_gravity ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-sans">ABV</dt>
          <dd>{brew.calculated_abv != null ? `${brew.calculated_abv.toFixed(1)}%` : '—'}</dd>
        </div>
        {hasCost && (
          <div>
            <dt className="text-muted-foreground font-sans">Est. cost</dt>
            <dd>
              ${totalCost.toFixed(2)}
              {perBottle != null && ` (${perBottle.toFixed(2)}/bottle)`}
            </dd>
          </div>
        )}
      </dl>

      <Timeline brew={brew} />

      <Tabs defaultValue="ingredients">
        <TabsList>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="gravity">Gravity readings</TabsTrigger>
          <TabsTrigger value="nutrients">Nutrient schedule</TabsTrigger>
          <TabsTrigger value="edit">Edit brew</TabsTrigger>
        </TabsList>
        <TabsContent value="ingredients" className="pt-4">
          <IngredientsTab brewId={brew.id} />
        </TabsContent>
        <TabsContent value="gravity" className="pt-4">
          <GravityTab brewId={brew.id} />
        </TabsContent>
        <TabsContent value="nutrients" className="pt-4">
          <NutrientScheduleTab brew={brew} />
        </TabsContent>
        <TabsContent value="edit" className="pt-4">
          <EditBrewTab brew={brew} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
