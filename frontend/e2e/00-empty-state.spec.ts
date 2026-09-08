import { test, expect } from '@playwright/test'

// Named to sort first: the suite shares one backend/DB for the whole run
// (no per-test reset), so this is the only file that can assert "no brews yet".
test('shows an empty state before any batch exists', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your batches' })).toBeVisible()
  await expect(page.getByText('Nothing here yet.')).toBeVisible()
})
