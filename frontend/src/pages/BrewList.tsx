import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useBrews, useMeta } from '@/api/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { costPerBottle } from '@/lib/units'
import { STATUS_BADGE_CLASS, fermentationProgress, isDiscarded } from '@/lib/status'
import { RemindersPanel } from '@/pages/RemindersPanel'

export function BrewList() {
  const { data: brews, isLoading } = useBrews()
  const { data: meta } = useMeta()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered =
    statusFilter === 'all' ? brews : brews?.filter((b) => b.status === statusFilter)

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight">Your batches</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Everything fermenting, aging, or waiting to begin.
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {meta?.status_options.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <RemindersPanel />

      {isLoading && <p className="text-muted-foreground">Loading your batches…</p>}

      {!isLoading && filtered?.length === 0 && (
        <p className="text-muted-foreground">
          Nothing here yet.{' '}
          <Link to="/brews/new" className="underline">
            Start your first batch
          </Link>
          .
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered?.map((brew) => {
          const perBottle = costPerBottle(
            brew.total_ingredient_cost,
            brew.batch_size,
            brew.batch_size_unit,
          )
          const progress = fermentationProgress(brew.status)
          const discarded = isDiscarded(brew.status)

          return (
            <Link key={brew.id} to={`/brews/${brew.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow overflow-hidden py-0 flex-row gap-0">
                <div
                  className="w-1.5 shrink-0 relative"
                  style={{ background: 'var(--ferment-empty)' }}
                  aria-hidden="true"
                >
                  <div
                    className={cnFill(discarded)}
                    style={{ height: `${discarded ? 100 : progress}%` }}
                  />
                </div>
                <div className="flex-1 min-w-0 py-6">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <CardTitle className="font-serif text-base font-medium min-w-0">
                        {brew.name}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={cn('shrink-0', STATUS_BADGE_CLASS[brew.status] ?? '')}
                      >
                        {brew.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>{brew.style || brew.brew_type}</p>
                    <p className="font-mono text-xs">Started {brew.start_date}</p>
                    <div className="flex gap-4 pt-1 font-mono text-xs">
                      {brew.calculated_abv != null && (
                        <span>{brew.calculated_abv.toFixed(1)}% ABV</span>
                      )}
                      {brew.batch_size != null && (
                        <span>
                          {brew.batch_size} {brew.batch_size_unit}
                        </span>
                      )}
                      {perBottle != null && <span>${perBottle.toFixed(2)}/bottle</span>}
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function cnFill(discarded: boolean): string {
  const base = 'absolute bottom-0 left-0 w-full transition-[height]'
  return discarded ? `${base} bg-muted-foreground/40` : `${base} bg-primary`
}
