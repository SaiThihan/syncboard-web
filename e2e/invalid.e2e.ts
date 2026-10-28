import { io } from 'socket.io-client'
import { API_URL, chooseTool, drag, expect, ink, test } from './helpers'

test.describe('things that are not allowed', () => {
  test('a link that is not a board link says so', async ({ page }) => {
    await page.goto('/board/abc')

    await expect(page.getByText('That is not a board link')).toBeVisible()
    await page.getByRole('button', { name: 'Back to home' }).click()
    await expect(page).toHaveURL('/')
  })

  test('a well-formed id that does not exist says the board is not there', async ({
    page,
  }) => {
    await page.goto('/board/AAAAAAAA')

    await expect(page.getByText('This board is not here')).toBeVisible()
  })

  test('creating a board without a name is refused with a reason', async ({
    page,
  }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Create board' }).click()

    await expect(
      page.getByText('Enter a name so teammates know who is drawing.'),
    ).toBeVisible()
    await expect(page).toHaveURL('/')
  })

  test('joining with something that is not a board id is refused with a reason', async ({
    person,
  }) => {
    const ana = await person('Ana Park')

    await ana.getByLabel('Join with a link or board ID').fill('abc')
    await ana.getByRole('button', { name: 'Join board' }).click()

    await expect(
      ana.getByText('That is not a board link or an 8 character board id.'),
    ).toBeVisible()
    await expect(ana).toHaveURL('/')
  })

  test('creating a board is switched off while a board id is typed', async ({
    person,
  }) => {
    const ana = await person('Ana Park')

    await ana.getByLabel('Join with a link or board ID').fill('k7x2qm9a')

    await expect(
      ana.getByRole('button', { name: 'Create board' }),
    ).toBeDisabled()
    await expect(ana.getByText(/You typed a board ID/)).toBeVisible()
  })

  test('a board with the maximum number of shapes refuses one more', async ({
    person,
  }) => {
    // fill a board to 4999 shapes from outside the browser
    const created = await fetch(`${API_URL}/api/boards`, { method: 'POST' })
    const { id: boardId } = (await created.json()) as { id: string }
    const filler = io(API_URL, { transports: ['websocket'] })
    await new Promise<void>((resolve) => filler.on('connect', () => resolve()))
    await new Promise((resolve) =>
      filler.emit(
        'board:join',
        {
          boardId,
          user: { id: crypto.randomUUID(), name: 'Filler' },
        },
        resolve,
      ),
    )
    for (let batch = 0; batch < 50; batch++) {
      await Promise.all(
        Array.from(
          { length: Math.min(100, 4999 - batch * 100) },
          () =>
            new Promise((resolve) =>
              filler.emit(
                'object:add',
                {
                  object: {
                    id: crypto.randomUUID(),
                    type: 'rect',
                    x: 1500 + Math.floor(Math.random() * 1400),
                    y: 1000 + Math.floor(Math.random() * 900),
                    width: 20,
                    height: 20,
                    stroke: '#111827',
                    strokeWidth: 2,
                  },
                },
                resolve,
              ),
            ),
        ),
      )
    }
    filler.close()

    const ana = await person('Ana Park')
    await ana.getByLabel('Join with a link or board ID').fill(boardId)
    await ana.getByRole('button', { name: 'Join board' }).click()
    await ana.getByText('Connected').waitFor()
    await chooseTool(ana, 'Rectangle')

    await drag(ana, { x: 100, y: 100 }, { x: 180, y: 160 }) // the 5000th: accepted
    await expect
      .poll(() => ink(ana, { x: 90, y: 90, width: 100, height: 80 }))
      .toBeGreaterThan(0)
    await drag(ana, { x: 400, y: 100 }, { x: 480, y: 160 }) // the 5001st: refused

    await expect(
      ana.getByText('This board is full. Delete something to draw more.'),
    ).toBeVisible()
    await expect
      .poll(() => ink(ana, { x: 390, y: 90, width: 100, height: 80 }))
      .toBe(0)
  })
})
