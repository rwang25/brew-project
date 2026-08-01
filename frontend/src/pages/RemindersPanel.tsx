import { Link } from 'react-router-dom'
import { useReminders } from '@/api/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AlertTriangle, Clock } from 'lucide-react'

export function RemindersPanel() {
  const { data: reminders } = useReminders()

  const nutrientItems = reminders?.nutrient_reminders ?? []
  const readyItems = reminders?.ready_reminders ?? []

  if (nutrientItems.length === 0 && readyItems.length === 0) return null

  return (
    <Card className="mb-6 border-primary/40">
      <CardHeader>
        <CardTitle className="font-serif text-lg font-medium">Needs attention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {nutrientItems.map((r, i) => (
          <Link
            key={`n-${i}`}
            to={`/brews/${r.brew_id}`}
            className="flex items-center gap-2 text-sm hover:underline"
          >
            {r.status === 'overdue' ? (
              <AlertTriangle className="size-4 text-destructive shrink-0" />
            ) : (
              <Clock className="size-4 text-primary shrink-0" />
            )}
            <span className={cn(r.status === 'overdue' && 'text-destructive font-medium')}>
              {r.nutrient_type} for {r.brew_name} — <span className="font-mono">{r.scheduled_date}</span>
              {r.status === 'overdue' ? ' (overdue)' : ' (due soon)'}
            </span>
          </Link>
        ))}
        {readyItems.map((r, i) => (
          <Link
            key={`r-${i}`}
            to={`/brews/${r.brew_id}`}
            className="flex items-center gap-2 text-sm hover:underline"
          >
            {r.status === 'overdue' ? (
              <AlertTriangle className="size-4 text-destructive shrink-0" />
            ) : (
              <Clock className="size-4 text-primary shrink-0" />
            )}
            <span className={cn(r.status === 'overdue' && 'text-destructive font-medium')}>
              {r.brew_name} expected ready <span className="font-mono">{r.expected_ready_date}</span>
              {r.status === 'overdue' ? ' (overdue)' : ' (due soon)'}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
