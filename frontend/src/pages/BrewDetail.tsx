import { useParams } from 'react-router-dom'
import { useBrew, useIngredients } from '@/api/hooks'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IngredientsTab } from '@/pages/brew-detail/IngredientsTab'
import { GravityTab } from '@/pages/brew-detail/GravityTab'
import { NutrientScheduleTab } from '@/pages/brew-detail/NutrientScheduleTab'
import { EditBrewTab } from '@/pages/brew-detail/EditBrewTab'
import { Timeline } from '@/pages/brew-detail/Timeline'
import { SaveAsRecipeDialog } from '@/pages/brew-detail/SaveAsRecipeDialog'
import { StatusTag } from '@/components/StatusTag'
import { costPerBottle } from '@/lib/units'

function BrewDetailSkeleton() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  )
}

export function BrewDetail() {
  const { id } = useParams()
  const brewId = Number(id)
  const { data: brew, isLoading } = useBrew(brewId)
  const { data: ingredients } = useIngredients(brewId)

  if (isLoading) return <BrewDetailSkeleton />
  if (!brew) return <p className="text-muted-foreground">Brew not found.</p>

  const totalCost = ingredients?.reduce((sum, ing) => sum + (ing.total_cost ?? 0), 0) ?? 0
  const hasCost = ingredients?.some((ing) => ing.total_cost != null)
  const perBottle = costPerBottle(hasCost ? totalCost : null, brew.batch_size, brew.batch_size_unit)

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <span className="font-mono text-xs text-muted-foreground/70 tracking-wide">
          No. {String(brew.id).padStart(3, '0')}
        </span>
        <StatusTag status={brew.status} />
      </div>
      <div className="flex items-end justify-between gap-4 flex-wrap mt-1 mb-2">
        <h1 className="font-serif text-3xl font-medium tracking-tight">{brew.name}</h1>
        <SaveAsRecipeDialog brewId={brew.id} brewName={brew.name} />
      </div>
      <p className="text-muted-foreground text-sm uppercase tracking-wide">
        {brew.style || brew.brew_type}
      </p>

      <div className="h-px bg-border my-5" />

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5 mb-8 text-sm font-mono">
        <div>
          <dt className="text-muted-foreground font-sans text-xs uppercase tracking-wide mb-1">
            Started
          </dt>
          <dd>{brew.start_date}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-sans text-xs uppercase tracking-wide mb-1">
            Batch size
          </dt>
          <dd>
            {brew.batch_size != null ? `${brew.batch_size} ${brew.batch_size_unit}` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-sans text-xs uppercase tracking-wide mb-1">
            OG / FG
          </dt>
          <dd>
            {brew.original_gravity ?? '—'} / {brew.final_gravity ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground font-sans text-xs uppercase tracking-wide mb-1">
            ABV
          </dt>
          <dd>{brew.calculated_abv != null ? `${brew.calculated_abv.toFixed(1)}%` : '—'}</dd>
        </div>
        {hasCost && (
          <div>
            <dt className="text-muted-foreground font-sans text-xs uppercase tracking-wide mb-1">
              Est. cost
            </dt>
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
