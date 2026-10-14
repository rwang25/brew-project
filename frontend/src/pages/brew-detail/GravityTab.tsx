import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { useAddGravityReading, useDeleteGravityReading, useGravityReadings } from '@/api/hooks'
import type { Brew, GravityReading } from '@/api/types'
import { dayMonth, daysBetween, fullDate, parseDate, startOfToday, todayIso } from '@/lib/dates'
import { btnIcon, btnInk, cardClass, fieldClass, h2Class, labelClass, monoMuted } from '@/lib/shelfStyles'
import { IN_VESSEL } from '@/lib/status'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const READING_GAP_DAYS = 14
const W = 680
const H = 296
const LEFT = 52
const RIGHT = 664
const TOP = 16
const BOTTOM = 256

function niceTicks(min: number, max: number): number[] {
  const steps = [0.005, 0.01, 0.02, 0.04, 0.05, 0.1]
  const step = steps.find((s) => (max - min) / s <= 4) ?? 0.1
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(3)))
  return ticks
}

function GravityChart({ brew, readings }: { brew: Brew; readings: GravityReading[] }) {
  const today = startOfToday()
  const active = IN_VESSEL.includes(brew.status) || brew.status === 'Planning'
  const sorted = [...readings].sort((a, b) => a.reading_date.localeCompare(b.reading_date))
  const first = sorted[0].reading_date < brew.start_date ? sorted[0].reading_date : brew.start_date
  const last = sorted[sorted.length - 1]
  const endDate = active ? today : parseDate(brew.bottle_date ?? last.reading_date)
  const spanDays = Math.max(1, daysBetween(first, endDate))

  const values = sorted.map((r) => r.specific_gravity)
  const ticks = niceTicks(Math.min(1, ...values), Math.max(...values))
  const yMin = ticks[0]
  const yMax = ticks[ticks.length - 1]
  const x = (date: string) => LEFT + (daysBetween(first, parseDate(date)) / spanDays) * (RIGHT - LEFT)
  const y = (sg: number) => TOP + ((yMax - sg) / (yMax - yMin || 1)) * (BOTTOM - TOP)

  const lastX = x(last.reading_date)
  const lastY = y(last.specific_gravity)
  const gapDays = daysBetween(last.reading_date, today)
  const showGap = active && gapDays >= READING_GAP_DAYS
  const rackX = brew.rack_date ? x(brew.rack_date) : null

  const xLabels = [0, 1 / 3, 2 / 3, 1].map((t) => {
    const d = new Date(parseDate(first).getTime() + t * spanDays * 86_400_000)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { x: LEFT + t * (RIGHT - LEFT), label: dayMonth(iso) }
  })

  const description = `Gravity readings: ${sorted
    .map((r) => `${r.specific_gravity.toFixed(3)} on ${fullDate(r.reading_date)}`)
    .join(', ')}${showGap ? `. No reading for ${gapDays} days.` : '.'}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 block w-full" role="img" aria-label={description}>
      {showGap && (
        <rect x={lastX} y={TOP} width={RIGHT - lastX} height={BOTTOM - TOP} fill="#FFF1C7" fillOpacity={0.6} />
      )}
      {ticks.map((t, i) => (
        <g key={t}>
          <line x1={LEFT} x2={RIGHT} y1={y(t)} y2={y(t)} stroke={i === 0 ? '#CDBF9F' : '#EFE8DA'} />
          <text x={LEFT - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6E6150" className="font-mono">
            {t.toFixed(3)}
          </text>
        </g>
      ))}
      {rackX != null && rackX >= LEFT && rackX <= RIGHT && (
        <>
          <line x1={rackX} x2={rackX} y1={TOP} y2={BOTTOM} stroke="#21190C" strokeOpacity={0.45} strokeDasharray="3 4" />
          <text x={rackX + 7} y={TOP + 18} fontSize="12" fontWeight="600" fill="#4A3E2A" className="font-sans">
            Racked
          </text>
        </>
      )}
      {showGap && (
        <>
          <line x1={lastX} y1={lastY} x2={RIGHT} y2={lastY} stroke="#B07400" strokeWidth={2} strokeDasharray="5 6" />
          <text
            x={(lastX + RIGHT) / 2}
            y={lastY > (TOP + BOTTOM) / 2 ? lastY - 14 : lastY + 24}
            textAnchor="middle"
            fontSize="12"
            fill="#6E5A2A"
            className="font-sans"
          >
            {gapDays} days without a reading
          </text>
        </>
      )}
      {sorted.length > 1 && (
        <polyline
          points={sorted.map((r) => `${x(r.reading_date)},${y(r.specific_gravity)}`).join(' ')}
          fill="none"
          stroke="#21190C"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {sorted.map((r) => (
        <circle key={r.id} cx={x(r.reading_date)} cy={y(r.specific_gravity)} r={6} fill="#F4B400" stroke="#21190C" strokeWidth={2.5} />
      ))}
      {xLabels.map((l) => (
        <text key={l.x} x={l.x} y={H - 14} textAnchor="middle" fontSize="11" fill="#6E6150" className="font-mono">
          {l.label}
        </text>
      ))}
    </svg>
  )
}

export function GravityTab({ brew }: { brew: Brew }) {
  const brewId = brew.id
  const { data: readings } = useGravityReadings(brewId)
  const addReading = useAddGravityReading(brewId)
  const deleteReading = useDeleteGravityReading(brewId)

  const [readingDate, setReadingDate] = useState(todayIso())
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
      temperature_unit: brew.temperature_unit ?? '°F',
      notes: notes || null,
    })
    setSpecificGravity('')
    setTemperature('')
    setNotes('')
  }

  const sorted = [...(readings ?? [])].sort((a, b) => a.reading_date.localeCompare(b.reading_date))
  const og = brew.original_gravity
  const dropped =
    og != null && sorted.length > 0 ? Math.round((og - sorted[sorted.length - 1].specific_gravity) * 1000) : null
  const attenuation =
    og != null && og > 1 && sorted.length > 0
      ? Math.round(((og - sorted[sorted.length - 1].specific_gravity) / (og - 1)) * 100)
      : null

  return (
    <section id="gravity" className={cardClass}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className={h2Class}>Gravity</h2>
        <p className={monoMuted}>
          {sorted.length} {sorted.length === 1 ? 'reading' : 'readings'}
          {attenuation != null && sorted.length > 0 && ` · ${attenuation}% of the sugar gone`}
          {attenuation == null && dropped != null && ` · ${dropped} points dropped`}
        </p>
      </div>

      {readings === undefined ? (
        <Skeleton className="mt-4 h-64 w-full" />
      ) : sorted.length > 0 ? (
        <GravityChart brew={brew} readings={sorted} />
      ) : (
        <p className="mt-3 text-sm text-[#6E6150]">No gravity readings yet. Log the first one below.</p>
      )}

      {sorted.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.06em] text-[#6E6150]">
                <th scope="col" className="border-b border-[#EFE8DA] py-2.5 pr-3 font-medium">Date</th>
                <th scope="col" className="border-b border-[#EFE8DA] px-3 py-2.5 font-medium">Gravity</th>
                <th scope="col" className="border-b border-[#EFE8DA] px-3 py-2.5 font-medium">Change</th>
                <th scope="col" className="border-b border-[#EFE8DA] px-3 py-2.5 text-right font-medium">ABV to date</th>
                <th scope="col" className="border-b border-[#EFE8DA] px-3 py-2.5 font-medium">Notes</th>
                <th scope="col" className="w-12 border-b border-[#EFE8DA]">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => {
                const prev = sorted[i - 1]
                const change = prev ? r.specific_gravity - prev.specific_gravity : null
                return (
                  <tr key={r.id} className="transition-colors duration-150 ease-out hover:bg-[#FFFCF3]">
                    <td className="whitespace-nowrap border-b border-[#EFE8DA] py-2 pr-3">{fullDate(r.reading_date)}</td>
                    <td className="border-b border-[#EFE8DA] px-3 py-2 font-mono font-semibold">
                      {r.specific_gravity.toFixed(3)}
                    </td>
                    <td className="border-b border-[#EFE8DA] px-3 py-2 font-mono text-[#4A3E2A]">
                      {change == null ? (
                        <span className="font-sans text-[#6E6150]">First</span>
                      ) : (
                        `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change).toFixed(3)}`
                      )}
                    </td>
                    <td className="border-b border-[#EFE8DA] px-3 py-2 text-right font-mono">
                      {og != null ? `${Math.max(0, (og - r.specific_gravity) * 131.25).toFixed(1)}%` : '—'}
                    </td>
                    <td className="border-b border-[#EFE8DA] px-3 py-2 text-[#6E6150]">
                      {[r.temperature != null ? `${r.temperature}${r.temperature_unit ?? ''}` : null, r.notes]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    <td className="border-b border-[#EFE8DA] py-1 text-right">
                      <button
                        type="button"
                        aria-label={`Delete the ${fullDate(r.reading_date)} reading`}
                        onClick={() => deleteReading.mutate(r.id)}
                        className={btnIcon}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <form
        id="log"
        onSubmit={handleAdd}
        className="mt-5 flex scroll-mt-24 flex-wrap items-end gap-3 rounded-[14px] border border-honey-line bg-[#FFF6DA] p-4"
      >
        <p className="w-full text-sm font-semibold">Log a reading</p>
        <label className={cn(labelClass, 'min-w-[140px] flex-[1_1_150px]')}>
          Date
          <input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} className={fieldClass} />
        </label>
        <label className={cn(labelClass, 'min-w-[120px] flex-[1_1_130px]')}>
          Specific gravity
          <input
            type="number"
            step="0.001"
            min="0"
            max="2"
            inputMode="decimal"
            value={specificGravity}
            onChange={(e) => setSpecificGravity(e.target.value)}
            className={cn(fieldClass, 'font-mono')}
          />
        </label>
        <label className={cn(labelClass, 'min-w-[100px] flex-[1_1_110px]')}>
          Temp ({brew.temperature_unit ?? '°F'})
          <input
            type="number"
            step="1"
            inputMode="numeric"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className={cn(fieldClass, 'font-mono')}
          />
        </label>
        <label className={cn(labelClass, 'min-w-[160px] flex-[2_1_200px]')}>
          Notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} />
        </label>
        <button type="submit" disabled={addReading.isPending} className={cn(btnInk, 'min-h-11 rounded-[10px]')}>
          Save reading
        </button>
      </form>
    </section>
  )
}
