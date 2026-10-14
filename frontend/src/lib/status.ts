// Where each status sits on the shelf: in a fermenter on the bench, in
// bottles on the shelf, or off the shelf entirely.
export const IN_VESSEL = [
  'Primary fermentation',
  'Secondary fermentation',
  'Stabilizing',
  'Backsweetened',
  'Conditioning',
]
export const FERMENTING = ['Primary fermentation', 'Secondary fermentation']
export const OFF_SHELF = ['Completed', 'Discarded']

// The stage rail and stage track, in order. Discarded sits outside the flow.
export const STAGES = [
  { status: 'Planning', label: 'Planning' },
  { status: 'Primary fermentation', label: 'Primary' },
  { status: 'Secondary fermentation', label: 'Secondary' },
  { status: 'Stabilizing', label: 'Stabilizing' },
  { status: 'Backsweetened', label: 'Backsweetened' },
  { status: 'Conditioning', label: 'Conditioning' },
  { status: 'Bottled', label: 'Bottled' },
  { status: 'Completed', label: 'Completed' },
]

const PILLS: Record<string, { label: string; className: string }> = {
  Planning: { label: 'Planned', className: 'bg-[#EFE9DE] text-[#574A36]' },
  'Primary fermentation': { label: 'Primary', className: 'bg-[#FFE9A8] text-[#6A4700]' },
  'Secondary fermentation': { label: 'Secondary', className: 'bg-[#FFDDB3] text-[#7A3D00]' },
  Stabilizing: { label: 'Stabilizing', className: 'bg-[#F1E2C8] text-[#5E4520]' },
  Backsweetened: { label: 'Backsweetened', className: 'bg-[#F1E2C8] text-[#5E4520]' },
  Conditioning: { label: 'Conditioning', className: 'bg-[#F1E2C8] text-[#5E4520]' },
  Bottled: { label: 'Bottled', className: 'bg-[#E4E9DA] text-[#3B4A28]' },
  Completed: { label: 'Completed', className: 'bg-[#E4E9DA] text-[#3B4A28]' },
  Discarded: { label: 'Discarded', className: 'bg-[#F3DEDA] text-[#7A2E22]' },
}

export function stagePill(status: string): { label: string; className: string } {
  return PILLS[status] ?? { label: status, className: 'bg-[#EFE9DE] text-[#574A36]' }
}

/** Which vessel a batch is drawn as. */
export function vesselFor(status: string): 'planned' | 'carboy' | 'bottle' {
  if (status === 'Planning') return 'planned'
  if (IN_VESSEL.includes(status)) return 'carboy'
  return 'bottle'
}
