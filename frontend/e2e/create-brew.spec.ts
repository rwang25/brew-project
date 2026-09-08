import { test, expect } from '@playwright/test'

test('creates a new batch and lands on its detail page', async ({ page }) => {
  await page.goto('/brews/new')

  await page.getByLabel('Brew name *').fill('E2E Test Mead')
  await page.getByLabel('Batch size').fill('1')
  await page.getByRole('button', { name: 'Create brew' }).click()

  await expect(page.getByRole('heading', { name: 'E2E Test Mead' })).toBeVisible()
  await expect(page.getByText('Created brew #')).toBeVisible()

  await page.goto('/')
  await expect(page.getByRole('link', { name: /E2E Test Mead/ })).toBeVisible()
})
