import { test, expect } from '@playwright/test'

async function createBrew(page: import('@playwright/test').Page, name: string) {
  await page.goto('/brews/new')
  await page.getByLabel('Batch name *').fill(name)
  await page.getByRole('button', { name: 'Put it on the bench' }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

test('adds an ingredient with a cost and sees the batch total update', async ({ page }) => {
  await createBrew(page, 'Cost Tracking Mead')

  const form = page.getByRole('form', { name: 'Add ingredient' })
  await form.getByLabel('Ingredient', { exact: true }).fill('Wildflower Honey')
  await form.getByLabel('Amount').fill('3')
  await form.getByLabel('Unit', { exact: true }).fill('lb')
  await form.getByLabel('Cost per unit').fill('8.50')
  await form.getByRole('button', { name: 'Add ingredient' }).click()

  await expect(page.getByRole('button', { name: 'Edit Wildflower Honey' })).toBeVisible()
  await expect(page.getByTestId('ingredient-total')).toContainText('$25.50')
})

test('editing an ingredient cost recalculates the total', async ({ page }) => {
  await createBrew(page, 'Cost Editing Mead')

  const form = page.getByRole('form', { name: 'Add ingredient' })
  await form.getByLabel('Ingredient', { exact: true }).fill('Orange Blossom Honey')
  await form.getByLabel('Amount').fill('2')
  await form.getByLabel('Unit', { exact: true }).fill('lb')
  await form.getByLabel('Cost per unit').fill('10.00')
  await form.getByRole('button', { name: 'Add ingredient' }).click()
  const total = page.getByTestId('ingredient-total')
  await expect(total).toContainText('$20.00')

  await page.getByRole('button', { name: 'Edit Orange Blossom Honey' }).click()
  const editor = page.getByRole('form', { name: 'Edit Orange Blossom Honey' })
  await editor.getByLabel('Cost per unit').fill('12.00')
  await editor.getByRole('button', { name: 'Save' }).click()

  await expect(total).toContainText('$24.00')
})

test('setting a price book entry auto-fills cost on new ingredients', async ({ page }) => {
  await page.goto('/prices')
  await page.getByRole('button', { name: 'Add a price' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Ingredient', { exact: true }).fill('Blackberries')
  await dialog.getByLabel('Per', { exact: true }).fill('lb')
  await dialog.getByLabel('Cost ($)').fill('4.25')
  await dialog.getByRole('button', { name: 'Put it on the shelf' }).click()

  await expect(page.getByRole('cell', { name: 'Blackberries', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: '$4.25' })).toBeVisible()

  await createBrew(page, 'Blackberry Melomel')

  const form = page.getByRole('form', { name: 'Add ingredient' })
  const ingredientInput = form.getByLabel('Ingredient', { exact: true })
  await ingredientInput.fill('Blackberries')
  await ingredientInput.blur()

  await expect(form.getByLabel('Cost per unit')).toHaveValue('4.25')
})
