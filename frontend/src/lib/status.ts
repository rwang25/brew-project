export const STATUS_BADGE_CLASS: Record<string, string> = {
  Planning: 'bg-[#DFCEA6]/40 text-[#5B4A32] dark:text-[#D8C7A4]',
  'Primary fermentation': 'bg-[#E8A33D]/20 text-[#8A5A16] dark:text-[#F4C868]',
  'Secondary fermentation': 'bg-[#B36B2E]/20 text-[#7A4014] dark:text-[#E2A46E]',
  Stabilizing: 'bg-[#8A7A4A]/20 text-[#5F5230] dark:text-[#C9BB8E]',
  Backsweetened: 'bg-[#B3564A]/15 text-[#8A3B30] dark:text-[#E29C90]',
  Conditioning: 'bg-[#6B4A2E]/20 text-[#4A331E] dark:text-[#C9A97E]',
  Bottled: 'bg-[#4A7A4A]/15 text-[#2E5A2E] dark:text-[#9CC99C]',
  Completed: 'bg-[#3B6B3B]/20 text-[#254A25] dark:text-[#A6D6A6]',
  Discarded: 'bg-[#8A3B30]/15 text-[#5F2A22] dark:text-[#C99188]',
}

const PROGRESS_BY_STATUS: Record<string, number> = {
  Planning: 4,
  'Primary fermentation': 30,
  'Secondary fermentation': 55,
  Stabilizing: 70,
  Backsweetened: 80,
  Conditioning: 90,
  Bottled: 100,
  Completed: 100,
}

export function fermentationProgress(status: string): number {
  return PROGRESS_BY_STATUS[status] ?? 4
}

export function isDiscarded(status: string): boolean {
  return status === 'Discarded'
}
