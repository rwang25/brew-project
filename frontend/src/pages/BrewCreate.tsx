import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCreateBrew, useMeta } from '@/api/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const today = () => new Date().toISOString().slice(0, 10)

export function BrewCreate() {
  const { data: meta } = useMeta()
  const createBrew = useCreateBrew()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [brewType, setBrewType] = useState('Mead')
  const [style, setStyle] = useState('')
  const [startDate, setStartDate] = useState(today())
  const [status, setStatus] = useState('Planning')
  const [batchSize, setBatchSize] = useState('')
  const [batchSizeUnit, setBatchSizeUnit] = useState('gal')
  const [originalGravity, setOriginalGravity] = useState('')
  const [targetAbv, setTargetAbv] = useState('')
  const [yeast, setYeast] = useState('')
  const [vessel, setVessel] = useState('')
  const [temperature, setTemperature] = useState('')
  const [temperatureUnit, setTemperatureUnit] = useState('°F')
  const [processNotes, setProcessNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Brew name is required.')
      return
    }
    const brew = await createBrew.mutateAsync({
      name,
      brew_type: brewType,
      style: style || null,
      batch_size: batchSize ? Number(batchSize) : null,
      batch_size_unit: batchSizeUnit,
      start_date: startDate,
      status,
      original_gravity: originalGravity ? Number(originalGravity) : null,
      target_abv: targetAbv ? Number(targetAbv) : null,
      yeast: yeast || null,
      temperature: temperature ? Number(temperature) : null,
      temperature_unit: temperatureUnit,
      vessel: vessel || null,
      process_notes: processNotes || null,
    })
    toast.success(`Created brew #${brew.id}: ${brew.name}`)
    navigate(`/brews/${brew.id}`)
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Add a brew</h1>
      <Card>
        <CardHeader>
          <CardTitle>Batch details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Brew name *</Label>
                <Input
                  id="name"
                  placeholder="Orange Blossom Mead #1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Brew type</Label>
                <Select value={brewType} onValueChange={setBrewType}>
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
                <Label htmlFor="style">Style or recipe</Label>
                <Input
                  id="style"
                  placeholder="Traditional dry mead"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
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
                <Label htmlFor="start_date">Start date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="batch_size">Batch size</Label>
                <div className="flex gap-2">
                  <Input
                    id="batch_size"
                    type="number"
                    step="0.25"
                    min="0"
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                  />
                  <Select value={batchSizeUnit} onValueChange={setBatchSizeUnit}>
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
                <Label htmlFor="og">Original gravity</Label>
                <Input
                  id="og"
                  type="number"
                  step="0.001"
                  min="0"
                  max="2"
                  placeholder="1.000"
                  value={originalGravity}
                  onChange={(e) => setOriginalGravity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="target_abv">Target ABV (%)</Label>
                <Input
                  id="target_abv"
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={targetAbv}
                  onChange={(e) => setTargetAbv(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="yeast">Yeast</Label>
                <Input
                  id="yeast"
                  placeholder="Lalvin 71B"
                  value={yeast}
                  onChange={(e) => setYeast(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vessel">Fermentation vessel</Label>
                <Input
                  id="vessel"
                  placeholder="1-gallon glass carboy"
                  value={vessel}
                  onChange={(e) => setVessel(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="temperature">Fermentation temperature</Label>
                <div className="flex gap-2">
                  <Input
                    id="temperature"
                    type="number"
                    step="1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                  <Select value={temperatureUnit} onValueChange={setTemperatureUnit}>
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
              <Label htmlFor="process_notes">Process notes</Label>
              <Textarea
                id="process_notes"
                placeholder="Nutrient schedule, sanitation notes, planned additions, etc."
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                rows={4}
              />
            </div>
            <Button type="submit" disabled={createBrew.isPending}>
              {createBrew.isPending ? 'Creating…' : 'Create brew'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
