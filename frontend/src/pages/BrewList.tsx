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
import { costPerBottle } from '@/lib/units'
import { RemindersPanel } from '@/pages/RemindersPanel'

const STATUS_VARIANT: Record<string, string> = {
  Planning: 'bg-muted text-muted-foreground',
  'Primary fermentation': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'Secondary fermentation': 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  Conditioning: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  Bottled: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  Completed: 'bg-green-600/15 text-green-700 dark:text-green-400',
  Discarded: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

export function BrewList() {
  const { data: brews, isLoading } = useBrews()
  const { data: meta } = useMeta()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered =
    statusFilter === 'all' ? brews : brews?.filter((b) => b.status === statusFilter)

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight">Brews</h1>
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

      {isLoading && <p className="text-muted-foreground">Loading brews…</p>}

      {!isLoading && filtered?.length === 0 && (
        <p className="text-muted-foreground">
          No brews yet.{' '}
          <Link to="/brews/new" className="underline">
            Start your first one
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
          return (
            <Link key={brew.id} to={`/brews/${brew.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{brew.name}</CardTitle>
                    <Badge
                      variant="secondary"
                      className={STATUS_VARIANT[brew.status] ?? ''}
                    >
                      {brew.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <p>{brew.style || brew.brew_type}</p>
                  <p>Started {brew.start_date}</p>
                  <div className="flex gap-4 pt-1">
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
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
