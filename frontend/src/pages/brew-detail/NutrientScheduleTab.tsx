import { useState } from 'react'
import { toast } from 'sonner'
import {
  useAddNutrientAddition,
  useDeleteNutrientAddition,
  useGenerateTosnaSchedule,
  useMeta,
  useNutrientSchedule,
  useToggleNutrientAddition,
} from '@/api/hooks'
import type { Brew } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2 } from 'lucide-react'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function NutrientScheduleTab({ brew }: { brew: Brew }) {
  const brewId = brew.id
  const { data: schedule } = useNutrientSchedule(brewId)
  const { data: meta } = useMeta()
  const addAddition = useAddNutrientAddition(brewId)
  const generateTosna = useGenerateTosnaSchedule(brewId)
  const toggleAddition = useToggleNutrientAddition(brewId)
  const deleteAddition = useDeleteNutrientAddition(brewId)

  const [dayOffset, setDayOffset] = useState('0')
  const [nutrientType, setNutrientType] = useState('Fermaid-O')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('g')

  const today = new Date().toISOString().slice(0, 10)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await addAddition.mutateAsync({
      day_offset: Number(dayOffset),
      nutrient_type: nutrientType,
      amount: amount ? Number(amount) : null,
      unit: unit || null,
    })
    setAmount('')
  }

  const handleGenerate = async () => {
    await generateTosna.mutateAsync()
    toast.success('Generated a standard staggered-nutrient schedule.')
  }

  return (
    <div className="space-y-6">
      {schedule && schedule.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Day</TableHead>
              <TableHead>Scheduled date</TableHead>
              <TableHead>Nutrient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((n) => {
              const scheduledDate = addDays(brew.start_date, n.day_offset)
              const isOverdue = !n.completed && scheduledDate < today
              return (
                <TableRow key={n.id} className={n.completed ? 'opacity-60' : ''}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={n.completed}
                      onChange={(e) =>
                        toggleAddition.mutate({ id: n.id, completed: e.target.checked })
                      }
                      className="size-4"
                    />
                  </TableCell>
                  <TableCell>Day {n.day_offset}</TableCell>
                  <TableCell className={isOverdue ? 'text-destructive font-medium' : ''}>
                    {scheduledDate}
                    {isOverdue && ' (overdue)'}
                  </TableCell>
                  <TableCell className="font-medium">{n.nutrient_type}</TableCell>
                  <TableCell>
                    {n.amount != null ? `${n.amount} ${n.unit ?? ''}` : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAddition.mutate(n.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">No nutrient schedule yet.</p>
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerate}
            disabled={generateTosna.isPending}
          >
            Generate standard schedule (Go-Ferm + staggered Fermaid-O)
          </Button>
        </div>
      )}

      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-5 items-end">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Day offset</label>
          <Input
            type="number"
            step="1"
            min="0"
            value={dayOffset}
            onChange={(e) => setDayOffset(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nutrient</label>
          <Select value={nutrientType} onValueChange={setNutrientType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meta?.nutrient_types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Unit</label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <Button type="submit" disabled={addAddition.isPending}>
          Add dose
        </Button>
      </form>
    </div>
  )
}
