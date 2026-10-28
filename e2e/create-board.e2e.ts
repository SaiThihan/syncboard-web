import { expect, test } from './helpers'

test('a new person creates a board and lands on it, connected', async ({
  person,
}) => {
  const ana = await person('Ana Park')

  await ana.getByRole('button', { name: 'Create board' }).click()

  await expect(ana).toHaveURL(/\/board\/[A-Za-z0-9_-]{8}$/)
  await expect(ana.getByText('Connected')).toBeVisible()
  await expect(ana.getByRole('button', { name: /Who is here/ })).toBeVisible()
})

test('the board page shows the board id and a Copy link button', async ({
  person,
}) => {
  const ana = await person('Ana Park')
  await ana.getByRole('button', { name: 'Create board' }).click()
  await ana.waitForURL(/\/board\//)
  const boardId = ana.url().split('/').pop() ?? ''

  await expect(ana.getByText(boardId, { exact: true })).toBeVisible()
  await expect(ana.getByRole('button', { name: 'Copy link' })).toBeVisible()
})
