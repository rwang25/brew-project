import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Plus, Trash2 } from 'lucide-react'
import {
  useAddNutrientAddition,
  useDeleteNutrientAddition,
  useGenerateTosnaSchedule,
  useMeta,
  useNutrientSchedule,
  useToggleNutrientAddition,
} from '@/api/hooks'
import type { Brew } from '@/api/types'
import { dayMonth, todayIso } from '@/lib/dates'
import { btnIcon, btnInk, btnQuiet, cardClass, fieldClass, labelClass } from '@/lib/shelfStyles'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr.slice(0, 10) + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function NutrientScheduleTab({ brew }: { brew: Brew }) {
  const brewId = brew.id
  const { data: schedule } = useNutrientSchedule(brewId)
  const { data: meta } = useMeta()
  const addAddition = useAddNutrientAddition(brewId)
  const generateTosna = useGenerateTosnaSchedule(brewId)
  const toggleAddition = useToggleNutrientAddition(brewId)
  const deleteAddition = useDeleteNutrientAddition(brewId)

  const [adding, setAdding] = useState(false)
  const [dayOffset, setDayOffset] = useState('0')
  const [nutrientType, setNutrientType] = useState('Fermaid-O')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('g')

  const today = todayIso()
  const list = [...(schedule ?? [])].sort((a, b) => a.day_offset - b.day_offset)
  const done = list.filter((n) => n.completed).length

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await addAddition.mutateAsync({
      day_offset: Number(dayOffset),
      nutrient_type: nutrientType,
      amount: amount ? Number(amount) : null,
      unit: unit || null,
    })
    setAmount('')
    setAdding(false)
  }

  const handleGenerate = async () => {
    await generateTosna.mutateAsync()
    toast.success('Generated a standard staggered-nutrient schedule.')
  }

  return (
    <section id="nutrients" className={cn(cardClass, 'scroll-mt-24')}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Nutrients</h2>
        {list.length > 0 && (
          <span
            className={cn(
              'font-mono text-[13px] font-semibold',
              done === list.length ? 'text-[#3B4A28]' : 'text-[#8A5300]',
            )}
          >
            {done} of {list.length} done
          </span>
        )}
      </div>

      {schedule === undefined ? (
        <Skeleton className="mt-3 h-20 w-full" />
      ) : list.length > 0 ? (
        <ul className="mt-3">
          {list.map((n) => {
            const scheduled = addDays(brew.start_date, n.day_offset)
            const overdue = !n.completed && scheduled < today
            return (
              <li key={n.id} className="flex items-center gap-3 border-b border-[#EFE8DA] py-2 last:border-b-0">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={n.completed}
                  aria-label={`${n.nutrient_type} on day ${n.day_offset} done`}
                  onClick={() => toggleAddition.mutate({ id: n.id, completed: !n.completed })}
                  className={cn(
                    'grid size-11 shrink-0 place-items-center rounded-[10px] transition-shadow duration-150 ease-out hover:shadow-[inset_0_0_0_999px_rgba(33,25,12,0.06)]',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-[26px] place-items-center rounded-lg',
                      n.completed ? 'bg-[#E4E9DA] text-[#3B4A28]' : 'border-2 border-[#D9CBAE] bg-white',
                    )}
                  >
                    {n.completed && <Check className="size-[15px]" strokeWidth={3} />}
                  </span>
                </button>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-[15px] font-semibold', n.completed && 'text-[#4A3E2A]')}>
                    {n.nutrient_type}
                    {n.amount != null && ` · ${n.amount} ${n.unit ?? ''}`.trimEnd()}
                  </span>
                  <span className={cn('font-mono text-xs', overdue ? 'font-semibold text-destructive' : 'text-[#6E6150]')}>
                    Day {n.day_offset} · {dayMonth(scheduled)}
                    {overdue && ' · overdue'}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Delete ${n.nutrient_type} on day ${n.day_offset}`}
                  onClick={() => deleteAddition.mutate(n.id)}
                  className={btnIcon}
                >
                  <Trash2 className="size-4 text-destructive" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-2.5 space-y-3">
          <p className="text-sm text-[#6E6150]">No schedule yet. Each dose shows up on Home when it's due.</p>
          <button type="button" onClick={handleGenerate} disabled={generateTosna.isPending} className={btnQuiet}>
            Generate a standard schedule
          </button>
        </div>
      )}

      {adding ? (
        <form
          onSubmit={handleAdd}
          aria-label="Add a dose"
          className="mt-4 flex flex-wrap items-end gap-3 rounded-[14px] border border-honey-line bg-[#FFF6DA] p-4"
        >
          <label className={cn(labelClass, 'flex-[1_1_70px]')}>
            Day
            <input type="number" step="1" min="0" value={dayOffset} onChange={(e) => setDayOffset(e.target.value)} className={cn(fieldClass, 'font-mono')} />
          </label>
          <label className={cn(labelClass, 'flex-[2_1_130px]')}>
            Nutrient
            <select value={nutrientType} onChange={(e) => setNutrientType(e.target.value)} className={fieldClass}>
              {meta?.nutrient_types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={cn(labelClass, 'flex-[1_1_80px]')}>
            Amount
            <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(fieldClass, 'font-mono')} />
          </label>
          <label className={cn(labelClass, 'flex-[1_1_60px]')}>
            Unit
            <input value={unit} onChange={(e) => setUnit(e.target.value)} className={fieldClass} />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={addAddition.isPending} className={cn(btnInk, 'min-h-11 rounded-[10px]')}>
              Add dose
            </button>
            <button type="button" onClick={() => setAdding(false)} className={btnQuiet}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={cn(btnQuiet, 'mt-3')}>
          <Plus className="size-4" strokeWidth={2.2} />
          Add a dose
        </button>
      )}
    </section>
  )
}
