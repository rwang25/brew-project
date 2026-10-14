import type { IngredientPrice } from '@/api/types'

// One lookup drives both the pantry (which container an ingredient sits in and
// what it's filled with) and the shelf (what colour a batch's vessel is).
// Keys are matched as lowercase substrings, so "Blueberries" and "Red Jacket
// Apple Cider" both hit.

export type ContainerKind =
  | 'honey'
  | 'fruit'
  | 'jug'
  | 'spice'
  | 'wood'
  | 'sachet'
  | 'packaging'
  | 'other'

export interface ContainerInfo {
  id: ContainerKind
  label: string
  defaultUnit: string
  // Fill shown when the name doesn't match anything in COLOURS.
  baseColor: string
}

export const CONTAINERS: ContainerInfo[] = [
  { id: 'honey', label: 'Honey jar', defaultUnit: 'lb', baseColor: '#E8B030' },
  { id: 'fruit', label: 'Fruit', defaultUnit: 'lb', baseColor: '#A3445A' },
  { id: 'jug', label: 'Juice or cider', defaultUnit: 'gal', baseColor: '#E0A040' },
  { id: 'spice', label: 'Spice or botanical', defaultUnit: 'each', baseColor: '#6E4B2A' },
  { id: 'wood', label: 'Oak or wood', defaultUnit: 'lb', baseColor: '#9C6A35' },
  { id: 'sachet', label: 'Yeast or nutrient', defaultUnit: 'each', baseColor: '#F6EFDD' },
  { id: 'packaging', label: 'Packaging', defaultUnit: 'each', baseColor: '#FFFFFF' },
  { id: 'other', label: 'Something else', defaultUnit: 'lb', baseColor: '#D9BE8A' },
]

const CONTAINER_RULES: [ContainerKind, string[]][] = [
  ['packaging', ['bottle', 'cork', 'capsule', 'label', 'swing top']],
  ['sachet', ['yeast', 'lalvin', '71b', 'ec-1118', 'd47', 'go-ferm', 'fermaid', 'dap', 'nutrient', 'energizer']],
  ['wood', ['oak', 'spiral', 'wood', 'chips']],
  ['jug', ['juice', 'cider', 'must', 'concentrate']],
  ['honey', ['honey']],
  ['spice', ['vanilla', 'cinnamon', 'clove', 'nutmeg', 'ginger', 'hibiscus', 'lavender', 'chamomile', 'cardamom', 'anise', 'pepper', 'spice', 'tea', 'coffee', 'cacao', 'cocoa', 'rose']],
  ['fruit', ['berr', 'cherr', 'apple', 'pear', 'peach', 'plum', 'mango', 'apricot', 'grape', 'currant', 'orange', 'lemon', 'lime', 'pineapple', 'fig', 'raisin', 'pomegranate', 'rhubarb', 'pumpkin', 'fruit']],
]

// [key, colour it gives a batch, word shown to the user]
const COLOURS: [string, string, string][] = [
  ['orange blossom', '#F3CF5E', 'orange blossom'],
  ['clover', '#F6DC7E', 'clover'],
  ['acacia', '#F6E39A', 'acacia'],
  ['wildflower', '#E8AA22', 'wildflower'],
  ['tupelo', '#EEC04A', 'tupelo'],
  ['meadowfoam', '#E6B04A', 'meadowfoam'],
  ['avocado', '#7A3F12', 'avocado'],
  ['buckwheat', '#8A4A16', 'buckwheat'],
  ['blueberr', '#7B2D48', 'blueberry'],
  ['blackberr', '#5A2140', 'blackberry'],
  ['raspberr', '#B8344F', 'raspberry'],
  ['strawberr', '#C8414F', 'strawberry'],
  ['cherr', '#9E1F2E', 'cherry'],
  ['plum', '#6E2A44', 'plum'],
  ['currant', '#4A1F33', 'currant'],
  ['hibiscus', '#A3203F', 'hibiscus'],
  ['grape', '#6E2A44', 'grape'],
  ['apple', '#D98E2B', 'apple'],
  ['cider', '#D98E2B', 'cider'],
  ['pear', '#E8C25A', 'pear'],
  ['peach', '#F0A040', 'peach'],
  ['apricot', '#F0A040', 'apricot'],
  ['mango', '#F2A72E', 'mango'],
  ['pumpkin', '#D97A1E', 'pumpkin'],
  ['lemon', '#F4DD7A', 'lemon'],
]

export const SWATCHES: { name: string; hex: string; light: boolean }[] = [
  { name: 'Pale straw', hex: '#F6E39A', light: true },
  { name: 'Light gold', hex: '#F3CF5E', light: true },
  { name: 'Gold', hex: '#E8AA22', light: true },
  { name: 'Deep gold', hex: '#D9921A', light: true },
  { name: 'Amber', hex: '#C27D25', light: false },
  { name: 'Copper', hex: '#A55A1E', light: false },
  { name: 'Brown', hex: '#7A3F12', light: false },
  { name: 'Bochet', hex: '#4E260C', light: false },
  { name: 'Rosé', hex: '#E58A8F', light: true },
  { name: 'Cherry', hex: '#9E1F2E', light: false },
  { name: 'Berry', hex: '#7B2D48', light: false },
  { name: 'Black currant', hex: '#4A1F33', light: false },
]

export const DEFAULT_MEAD = '#EAB64A'

export function containerInfo(kind: ContainerKind): ContainerInfo {
  return CONTAINERS.find((c) => c.id === kind) ?? CONTAINERS[CONTAINERS.length - 1]
}

export function isContainerKind(value: string | null | undefined): value is ContainerKind {
  return CONTAINERS.some((c) => c.id === value)
}

export function guessContainer(name: string): ContainerKind {
  const text = name.toLowerCase()
  const rule = CONTAINER_RULES.find(([, keys]) => keys.some((k) => text.includes(k)))
  return rule ? rule[0] : 'other'
}

export function lookupColour(name: string): { color: string; match: string } | null {
  const text = name.toLowerCase()
  const hit = COLOURS.find(([key]) => text.includes(key))
  return hit ? { color: hit[1], match: hit[2] } : null
}

export function swatchName(hex: string): string | null {
  return SWATCHES.find((s) => s.hex.toLowerCase() === hex.toLowerCase())?.name ?? null
}

export function mixColour(from: string, to: string, amount: number): string {
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const a = channels(from)
  const b = channels(to)
  return (
    '#' +
    a.map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, '0')).join('')
  )
}

export interface PantryLook {
  container: ContainerKind
  containerSource: 'set' | 'guessed'
  // Colour this ingredient gives a batch, or null when it doesn't tint one.
  tint: string | null
  colourSource: 'set' | 'matched' | 'default' | null
  match: string | null
  // What the pantry drawing is filled with (tint, or the container's own look).
  fill: string
  darkens: boolean
}

/** How an ingredient looks in the pantry and what it does to a batch's colour,
 * honouring any container/colour override saved on its price-book entry. */
export function pantryLook(
  name: string,
  override?: { container?: string | null; color?: string | null } | null,
): PantryLook {
  const container = isContainerKind(override?.container) ? override.container : guessContainer(name)
  const hit = lookupColour(name)
  const tints =
    container === 'honey' || container === 'fruit' || container === 'jug' || (container === 'spice' && !!hit)
  let tint: string | null = null
  let colourSource: PantryLook['colourSource'] = null
  if (tints) {
    if (override?.color) {
      tint = override.color
      colourSource = 'set'
    } else if (hit) {
      tint = hit.color
      colourSource = 'matched'
    } else {
      tint = containerInfo(container).baseColor
      colourSource = 'default'
    }
  }
  return {
    container,
    containerSource: isContainerKind(override?.container) ? 'set' : 'guessed',
    tint,
    colourSource,
    match: hit?.match ?? null,
    fill: tint ?? containerInfo(container).baseColor,
    darkens: container === 'wood',
  }
}

/** Finds the price-book entry for an ingredient name (any unit). */
export function priceFor(name: string, prices: IngredientPrice[] | undefined): IngredientPrice | undefined {
  const key = name.trim().toLowerCase()
  return prices?.find((p) => p.ingredient_name.trim().toLowerCase() === key)
}

export interface BatchColour {
  color: string
  // The ingredient whose colour won, if any.
  decidedBy: string | null
  darkened: boolean
}

/** A batch's colour: fruit, juice or a tinting botanical beats honey; oak
 * darkens the result one step; a bochet (caramelised honey) darkens a lot. */
export function batchColour(ingredientNames: string[], prices?: IngredientPrice[]): BatchColour {
  const looks = ingredientNames.map((name) => ({ name, look: pantryLook(name, priceFor(name, prices)) }))
  const tinting = looks.filter((l) => l.look.tint)
  const winner =
    tinting.find((l) => l.look.container !== 'honey') ?? tinting.find((l) => l.look.container === 'honey')
  let color = winner?.look.tint ?? DEFAULT_MEAD
  const allText = ingredientNames.join(' ').toLowerCase()
  if (allText.includes('bochet')) color = mixColour(color, '#3A1A06', 0.45)
  const darkened = looks.some((l) => l.look.darkens)
  if (darkened) color = mixColour(color, '#5A2E08', 0.18)
  return { color, decidedBy: winner?.name ?? null, darkened }
}
