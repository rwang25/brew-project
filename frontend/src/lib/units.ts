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
