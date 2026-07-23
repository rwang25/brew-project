import { useState } from 'react'
import { toast } from 'sonner'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useAddGravityReading, useDeleteGravityReading, useGravityReadings } from '@/api/hooks'
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

const today = () => new Date().toISOString().slice(0, 10)

export function GravityTab({ brewId }: { brewId: number }) {
  const { data: readings } = useGravityReadings(brewId)
  const addReading = useAddGravityReading(brewId)
  const deleteReading = useDeleteGravityReading(brewId)

  const [readingDate, setReadingDate] = useState(today())
  const [specificGravity, setSpecificGravity] = useState('')
  const [temperature, setTemperature] = useState('')
  const [notes, setNotes] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!specificGravity) {
      toast.error('Specific gravity is required.')
      return
    }
    await addReading.mutateAsync({
      reading_date: readingDate,
      specific_gravity: Number(specificGravity),
      temperature: temperature ? Number(temperature) : null,
      temperature_unit: '°F',
      notes: notes || null,
    })
    setSpecificGravity('')
    setTemperature('')
    setNotes('')
  }

  const chartData = readings?.map((r) => ({
    date: r.reading_date,
    gravity: r.specific_gravity,
  }))

  return (
    <div className="space-y-6">
      {chartData && chartData.length > 1 && (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={['dataMin - 0.005', 'dataMax + 0.005']} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="gravity" stroke="var(--primary)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {readings && readings.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Specific gravity</TableHead>
              <TableHead>Temperature</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.reading_date}</TableCell>
                <TableCell className="font-medium">{r.specific_gravity.toFixed(3)}</TableCell>
                <TableCell>
                  {r.temperature != null ? `${r.temperature}${r.temperature_unit}` : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">{r.notes || '—'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteReading.mutate(r.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground text-sm">No gravity readings recorded.</p>
      )}

      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-5 items-end">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Date</label>
          <Input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Specific gravity</label>
          <Input
            type="number"
            step="0.001"
            min="0"
            max="2"
            placeholder="1.000"
            value={specificGravity}
            onChange={(e) => setSpecificGravity(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Temperature</label>
          <Input
            type="number"
            step="1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Notes</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button type="submit" disabled={addReading.isPending} className="sm:col-span-5 sm:w-fit">
          Add reading
        </Button>
      </form>
    </div>
  )
}
