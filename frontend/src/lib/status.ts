// Accent color per status — used as text + border + dot color on the small
// stamp-style status tag (an outlined tag with a dot, not a filled pill).
export const STATUS_ACCENT_CLASS: Record<string, string> = {
  Planning: 'text-[#5B4A32] border-[#5B4A32]/35 dark:text-[#D8C7A4] dark:border-[#D8C7A4]/35',
  'Primary fermentation':
    'text-[#8A5A16] border-[#8A5A16]/40 dark:text-[#F4C868] dark:border-[#F4C868]/40',
  'Secondary fermentation':
    'text-[#7A4014] border-[#7A4014]/40 dark:text-[#E2A46E] dark:border-[#E2A46E]/40',
  Stabilizing: 'text-[#5F5230] border-[#5F5230]/35 dark:text-[#C9BB8E] dark:border-[#C9BB8E]/35',
  Backsweetened:
    'text-[#8A3B30] border-[#8A3B30]/35 dark:text-[#E29C90] dark:border-[#E29C90]/35',
  Conditioning:
    'text-[#4A331E] border-[#4A331E]/35 dark:text-[#C9A97E] dark:border-[#C9A97E]/35',
  Bottled: 'text-[#2E5A2E] border-[#2E5A2E]/35 dark:text-[#9CC99C] dark:border-[#9CC99C]/35',
  Completed: 'text-[#254A25] border-[#254A25]/35 dark:text-[#A6D6A6] dark:border-[#A6D6A6]/35',
  Discarded: 'text-[#5F2A22] border-[#5F2A22]/35 dark:text-[#C99188] dark:border-[#C99188]/35',
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
