import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useBrews, useMeta } from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { costPerBottle } from '@/lib/units'
import { fermentationProgress, isDiscarded } from '@/lib/status'
import { RemindersPanel } from '@/pages/RemindersPanel'
import { MeadDropIcon } from '@/components/MeadDropIcon'
import { StatusTag } from '@/components/StatusTag'
import { GravityGauge } from '@/components/GravityGauge'

function batchNumber(id: number): string {
  return `No. ${String(id).padStart(3, '0')}`
}

function BrewCardSkeleton() {
  return (
    <div className="rounded-sm border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-3 w-28" />
    </div>
  )
}

export function BrewList() {
  const { data: brews, isLoading } = useBrews()
  const { data: meta } = useMeta()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered =
    statusFilter === 'all' ? brews : brews?.filter((b) => b.status === statusFilter)

  return (
    <div className="max-w-5xl">
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap border-b pb-4">
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

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <BrewCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && filtered?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed py-16 text-center">
          <MeadDropIcon className="size-8 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nothing here yet.</p>
          <Button asChild size="sm">
            <Link to="/brews/new">Start your first batch</Link>
          </Button>
        </div>
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

          const specParts = [
            brew.batch_size != null ? `${brew.batch_size} ${brew.batch_size_unit}` : null,
            brew.calculated_abv != null ? `${brew.calculated_abv.toFixed(1)}% ABV` : null,
            perBottle != null ? `$${perBottle.toFixed(2)}/btl` : null,
          ].filter(Boolean)

          return (
            <Link key={brew.id} to={`/brews/${brew.id}`} className="group">
              <div className="h-full rounded-sm border bg-card p-5 transition-[box-shadow,transform,border-color] duration-200 ease-out group-hover:shadow-warm-md group-hover:-translate-y-0.5 group-hover:border-ring/40">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground/70 tracking-wide pt-1">
                    {batchNumber(brew.id)}
                  </span>
                  <StatusTag status={brew.status} />
                </div>

                <h3 className="font-serif text-lg font-medium mt-2 leading-snug">{brew.name}</h3>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mt-0.5">
                  {brew.style || brew.brew_type}
                </p>

                <div className="h-px bg-border my-3" />

                <div className="flex items-center justify-between gap-3">
                  <GravityGauge progress={discarded ? 100 : progress} muted={discarded} />
                  <span className="font-mono text-[11px] text-muted-foreground text-right">
                    {specParts.join(' · ') || '—'}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
