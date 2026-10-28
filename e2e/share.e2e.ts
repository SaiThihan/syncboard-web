import { createBoard, expect, test } from './helpers'

test.describe('copying the board link', () => {
  test('puts the full link in the clipboard and says so', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write'],
    })
    const ana = await context.newPage()
    await ana.goto('/')
    await ana.getByLabel('Display name').fill('Ana Park')
    const boardId = await createBoard(ana)

    await ana.getByRole('button', { name: 'Copy link' }).click()

    await expect(ana.getByText('Link copied')).toBeVisible()
    const copied = await ana.evaluate(() => navigator.clipboard.readText())
    expect(copied).toBe(`http://localhost:5173/board/${boardId}`)
    await context.close()
  })

  test('says so when the browser refuses clipboard access', async ({
    person,
  }) => {
    const ana = await person('Ana Park')
    await ana.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: () => Promise.reject(new Error('blocked')) },
      })
    })
    await ana.reload() // so the page loads with the blocked clipboard
    await ana.getByLabel('Display name').fill('Ana Park')
    await createBoard(ana)

    await ana.getByRole('button', { name: 'Copy link' }).click()

    await expect(ana.getByText('Could not copy the link')).toBeVisible()
  })
})
