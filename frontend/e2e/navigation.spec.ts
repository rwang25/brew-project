import { test, expect } from '@playwright/test'

test('visits every nav destination', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Primary' })

  await page.getByRole('banner').getByRole('link', { name: 'New batch' }).click()
  await expect(page.getByRole('heading', { name: 'Start a new batch' })).toBeVisible()

  await nav.getByRole('link', { name: 'Recipes' }).click()
  await expect(page.getByRole('heading', { name: 'Brew it again.' })).toBeVisible()

  await nav.getByRole('link', { name: 'Price book' }).click()
  await expect(page.getByRole('heading', { name: /in the pantry\.|The pantry is empty\./ })).toBeVisible()

  await nav.getByRole('link', { name: 'Batches' }).click()
  await expect(page.getByRole('heading', { name: /from must to bottle\./ })).toBeVisible()

  await nav.getByRole('link', { name: 'Home' }).click()
  await expect(page.getByRole('heading', { name: 'On the bench', exact: true })).toBeVisible()
})
