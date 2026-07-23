import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useDeleteBrew, useMeta, useUpdateBrew } from '@/api/hooks'
import type { Brew } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function EditBrewTab({ brew }: { brew: Brew }) {
  const { data: meta } = useMeta()
  const updateBrew = useUpdateBrew(brew.id)
  const deleteBrew = useDeleteBrew()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: brew.name,
    brew_type: brew.brew_type,
    style: brew.style ?? '',
    batch_size: brew.batch_size?.toString() ?? '',
    batch_size_unit: brew.batch_size_unit ?? 'gal',
    start_date: brew.start_date,
    rack_date: brew.rack_date ?? '',
    bottle_date: brew.bottle_date ?? '',
    expected_ready_date: brew.expected_ready_date ?? '',
    status: brew.status,
    original_gravity: brew.original_gravity?.toString() ?? '',
    final_gravity: brew.final_gravity?.toString() ?? '',
    target_abv: brew.target_abv?.toString() ?? '',
    yeast: brew.yeast ?? '',
    temperature: brew.temperature?.toString() ?? '',
    temperature_unit: brew.temperature_unit ?? '°F',
    vessel: brew.vessel ?? '',
    tasting_notes: brew.tasting_notes ?? '',
    process_notes: brew.process_notes ?? '',
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Brew name is required.')
      return
    }
    await updateBrew.mutateAsync({
      name: form.name,
      brew_type: form.brew_type,
      style: form.style || null,
      batch_size: form.batch_size ? Number(form.batch_size) : null,
      batch_size_unit: form.batch_size_unit,
      start_date: form.start_date,
      rack_date: form.rack_date || null,
      bottle_date: form.bottle_date || null,
      expected_ready_date: form.expected_ready_date || null,
      status: form.status,
      original_gravity: form.original_gravity ? Number(form.original_gravity) : null,
      final_gravity: form.final_gravity ? Number(form.final_gravity) : null,
      target_abv: form.target_abv ? Number(form.target_abv) : null,
      yeast: form.yeast || null,
      temperature: form.temperature ? Number(form.temperature) : null,
      temperature_unit: form.temperature_unit,
      vessel: form.vessel || null,
      tasting_notes: form.tasting_notes || null,
      process_notes: form.process_notes || null,
    })
    toast.success('Brew updated.')
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${brew.name}"? This cannot be undone.`)) return
    await deleteBrew.mutateAsync(brew.id)
    toast.success('Brew deleted.')
    navigate('/')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Brew name *</Label>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Brew type</Label>
          <Select value={form.brew_type} onValueChange={(v: string) => set('brew_type', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meta?.brew_types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Style or recipe</Label>
          <Input value={form.style} onChange={(e) => set('style', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v: string) => set('status', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meta?.status_options.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Start date</Label>
          <Input
            type="date"
            value={form.start_date}
            onChange={(e) => set('start_date', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Rack date</Label>
          <Input
            type="date"
            value={form.rack_date}
            onChange={(e) => set('rack_date', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Bottle date</Label>
          <Input
            type="date"
            value={form.bottle_date}
            onChange={(e) => set('bottle_date', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Expected ready date</Label>
          <Input
            type="date"
            value={form.expected_ready_date}
            onChange={(e) => set('expected_ready_date', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Batch size</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.25"
              value={form.batch_size}
              onChange={(e) => set('batch_size', e.target.value)}
            />
            <Select value={form.batch_size_unit} onValueChange={(v: string) => set('batch_size_unit', v)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meta?.batch_size_units.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Original gravity</Label>
          <Input
            type="number"
            step="0.001"
            value={form.original_gravity}
            onChange={(e) => set('original_gravity', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Final gravity</Label>
          <Input
            type="number"
            step="0.001"
            value={form.final_gravity}
            onChange={(e) => set('final_gravity', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Target ABV (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.target_abv}
            onChange={(e) => set('target_abv', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Yeast</Label>
          <Input value={form.yeast} onChange={(e) => set('yeast', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Fermentation vessel</Label>
          <Input value={form.vessel} onChange={(e) => set('vessel', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Fermentation temperature</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="1"
              value={form.temperature}
              onChange={(e) => set('temperature', e.target.value)}
            />
            <Select
              value={form.temperature_unit}
              onValueChange={(v: string) => set('temperature_unit', v)}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meta?.temperature_units.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Process notes</Label>
        <Textarea
          rows={4}
          value={form.process_notes}
          onChange={(e) => set('process_notes', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Tasting notes</Label>
        <Textarea
          rows={3}
          value={form.tasting_notes}
          onChange={(e) => set('tasting_notes', e.target.value)}
        />
      </div>
      <Button type="submit" disabled={updateBrew.isPending}>
        {updateBrew.isPending ? 'Saving…' : 'Save changes'}
      </Button>

      <Separator />

      <div className="rounded-md border border-destructive/30 p-4">
        <p className="font-medium text-destructive">Danger zone</p>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          Permanently delete this brew and all its ingredients and gravity readings.
        </p>
        <Button type="button" variant="destructive" onClick={handleDelete}>
          Delete brew
        </Button>
      </div>
    </form>
  )
}
