import { expect, test } from '@playwright/test'

test('a new person creates a board and lands on it, connected', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByLabel('Display name').fill('Ana')
  await page.getByRole('button', { name: 'Create board' }).click()

  await expect(page).toHaveURL(/\/board\/[A-Za-z0-9_-]{8}$/)
  await expect(page.getByText('Connected')).toBeVisible()
  await expect(page.getByRole('button', { name: /Who is here/ })).toBeVisible()
})
