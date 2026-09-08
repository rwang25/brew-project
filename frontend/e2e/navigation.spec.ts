import { test, expect } from '@playwright/test'

test('visits every nav destination', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'New batch' }).click()
  await expect(page.getByRole('heading', { name: 'Start a new batch' })).toBeVisible()

  await page.getByRole('link', { name: 'Recipes' }).click()
  await expect(page).toHaveURL(/\/recipes$/)

  await page.getByRole('link', { name: 'Prices' }).click()
  await expect(page.getByRole('heading', { name: 'Ingredient prices' })).toBeVisible()

  await page.getByRole('link', { name: 'Batches' }).click()
  await expect(page.getByRole('heading', { name: 'Your batches' })).toBeVisible()
})
