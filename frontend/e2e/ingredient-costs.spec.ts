import { test, expect } from '@playwright/test'

async function createBrew(page: import('@playwright/test').Page, name: string) {
  await page.goto('/brews/new')
  await page.getByLabel('Brew name *').fill(name)
  await page.getByRole('button', { name: 'Create brew' }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

test('adds an ingredient with a cost and sees the batch total update', async ({ page }) => {
  await createBrew(page, 'Cost Tracking Mead')

  await page.getByRole('tab', { name: 'Ingredients' }).click()

  const form = page.locator('form').filter({ hasText: 'Add ingredient' })
  await form.getByLabel('Ingredient').fill('Wildflower Honey')
  await form.getByLabel('Amount').fill('3')
  await form.getByLabel('Unit', { exact: true }).fill('lb')
  await form.getByLabel('Cost per unit').fill('8.50')
  await form.getByRole('button', { name: 'Add ingredient' }).click()

  await expect(page.getByRole('cell', { name: 'Wildflower Honey' })).toBeVisible()
  const totalRow = page.locator('tfoot').getByRole('row')
  await expect(totalRow).toContainText('Total ingredient cost')
  await expect(totalRow).toContainText('$25.50')
})

test('editing an ingredient cost recalculates the total', async ({ page }) => {
  await createBrew(page, 'Cost Editing Mead')
  await page.getByRole('tab', { name: 'Ingredients' }).click()

  const form = page.locator('form').filter({ hasText: 'Add ingredient' })
  await form.getByLabel('Ingredient').fill('Orange Blossom Honey')
  await form.getByLabel('Amount').fill('2')
  await form.getByLabel('Unit', { exact: true }).fill('lb')
  await form.getByLabel('Cost per unit').fill('10.00')
  await form.getByRole('button', { name: 'Add ingredient' }).click()
  const totalRow = page.locator('tfoot').getByRole('row')
  await expect(totalRow).toContainText('$20.00')

  const row = page.getByRole('row', { name: /Orange Blossom Honey/ })
  await row.getByRole('button').first().click()

  const editingRow = page.getByRole('row').filter({ has: page.locator('input[value="Orange Blossom Honey"]') })
  await editingRow.locator('input[type="number"]').nth(1).fill('12.00')
  await editingRow.getByRole('button').first().click()

  await expect(totalRow).toContainText('$24.00')
})

test('setting a price book entry auto-fills cost on new ingredients', async ({ page }) => {
  await page.goto('/prices')
  await page.getByLabel('Ingredient').fill('Blackberries')
  await page.getByLabel('Unit', { exact: true }).fill('lb')
  await page.getByLabel('Cost per unit').fill('4.25')
  await page.getByRole('button', { name: 'Save price' }).click()

  await expect(page.getByRole('cell', { name: 'Blackberries' })).toBeVisible()
  await expect(page.getByText('$4.25')).toBeVisible()

  await createBrew(page, 'Blackberry Melomel')
  await page.getByRole('tab', { name: 'Ingredients' }).click()

  const form = page.locator('form').filter({ hasText: 'Add ingredient' })
  const ingredientInput = form.getByLabel('Ingredient')
  await ingredientInput.fill('Blackberries')
  await ingredientInput.blur()

  await expect(form.getByLabel('Cost per unit')).toHaveValue('4.25')
})
