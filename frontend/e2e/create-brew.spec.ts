import { test, expect } from '@playwright/test'

test('creates a new batch and lands on its detail page', async ({ page }) => {
  await page.goto('/brews/new')

  await page.getByLabel('Batch name *').fill('E2E Test Mead')
  await page.getByLabel('Batch size', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Put it on the bench' }).click()

  await expect(page.getByRole('heading', { name: 'E2E Test Mead' })).toBeVisible()
  await expect(page.getByText('Created brew #')).toBeVisible()

  await page.goto('/brews')
  await expect(page.getByRole('link', { name: /E2E Test Mead/ })).toBeVisible()

  // New batches start in Planning, so the home page shows them on the bench.
  await page.goto('/')
  await expect(page.getByRole('link', { name: /E2E Test Mead/ })).toBeVisible()
})
