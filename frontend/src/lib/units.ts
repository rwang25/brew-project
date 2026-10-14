const LITERS_PER_UNIT: Record<string, number> = {
  gal: 3.78541,
  L: 1,
  qt: 0.946353,
  mL: 0.001,
}

const STANDARD_BOTTLE_LITERS = 0.75

export function estimateBottleCount(
  batchSize: number | null,
  batchSizeUnit: string | null,
): number | null {
  if (batchSize == null || !batchSizeUnit) return null
  const perUnit = LITERS_PER_UNIT[batchSizeUnit]
  if (!perUnit) return null
  const liters = batchSize * perUnit
  return Math.floor(liters / STANDARD_BOTTLE_LITERS)
}

export function costPerBottle(
  totalCost: number | null,
  batchSize: number | null,
  batchSizeUnit: string | null,
): number | null {
  const bottles = estimateBottleCount(batchSize, batchSizeUnit)
  if (totalCost == null || !bottles) return null
  return totalCost / bottles
}

// Recognized weight/volume units, normalized to a common base (grams / mL)
// so a price recorded in one unit (e.g. $/lb) can be converted to another
// (e.g. $/g) automatically. Units outside these two tables (e.g. "bean",
// "glass") are treated as non-convertible — only an exact match applies.
const WEIGHT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
}

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  litre: 1000,
  litres: 1000,
  qt: 946.353,
  quart: 946.353,
  quarts: 946.353,
  gal: 3785.41,
  gallon: 3785.41,
  gallons: 3785.41,
}

function unitToBase(unit: string): { dimension: 'weight' | 'volume'; factor: number } | null {
  const key = unit.trim().toLowerCase()
  if (key in WEIGHT_TO_GRAMS) return { dimension: 'weight', factor: WEIGHT_TO_GRAMS[key] }
  if (key in VOLUME_TO_ML) return { dimension: 'volume', factor: VOLUME_TO_ML[key] }
  return null
}

export function unitsAreConvertible(a: string, b: string): boolean {
  const ua = unitToBase(a)
  const ub = unitToBase(b)
  return !!ua && !!ub && ua.dimension === ub.dimension
}

/** Converts a per-unit cost from `fromUnit` to `toUnit` (e.g. $/lb -> $/g).
 * Returns null when either unit is unrecognized or they're not the same
 * kind of measurement (can't convert $/lb to $/gal). */
export function convertUnitCost(cost: number, fromUnit: string, toUnit: string): number | null {
  if (fromUnit.trim().toLowerCase() === toUnit.trim().toLowerCase()) return cost
  const from = unitToBase(fromUnit)
  const to = unitToBase(toUnit)
  if (!from || !to || from.dimension !== to.dimension) return null
  const costPerBaseUnit = cost / from.factor
  return costPerBaseUnit * to.factor
}
