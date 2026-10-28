import type { Page } from '@playwright/test'
import {
  around,
  chooseTool,
  createBoard,
  drag,
  drawRectangle,
  expect,
  ink,
  joinBoard,
  test,
} from './helpers'

const FROM = { x: 100, y: 100 }
const TO = { x: 300, y: 200 }
const WHOLE = { x: 80, y: 80, width: 260, height: 140 }

// Ana makes a board and Ben joins it, each in a window of their own.
async function twoPeople(person: (name: string) => Promise<Page>) {
  const ana = await person('Ana Park')
  const boardId = await createBoard(ana)
  const ben = await person('Ben Okoye')
  await joinBoard(ben, boardId)
  return { ana, ben }
}

test.describe('two people on one board', () => {
  test('a shape one person draws appears for the other', async ({ person }) => {
    const { ana, ben } = await twoPeople(person)
    expect(await ink(ben, WHOLE)).toBe(0)

    await drawRectangle(ana, FROM, TO)

    await expect.poll(() => ink(ben, WHOLE)).toBeGreaterThan(0)
  })

  test('a shape that is already there shows for someone who joins later', async ({
    person,
  }) => {
    const ana = await person('Ana Park')
    const boardId = await createBoard(ana)
    await drawRectangle(ana, FROM, TO)
    const ben = await person('Ben Okoye')

    await joinBoard(ben, boardId)

    await expect.poll(() => ink(ben, WHOLE)).toBeGreaterThan(0)
  })

  test('moving a shape moves it for the other person too', async ({
    person,
  }) => {
    const { ana, ben } = await twoPeople(person)
    await drawRectangle(ana, FROM, TO)
    await expect.poll(() => ink(ben, WHOLE)).toBeGreaterThan(0)
    await chooseTool(ana, 'Select')

    await drag(ana, { x: 200, y: 150 }, { x: 500, y: 350 })

    await expect.poll(() => ink(ben, around(FROM))).toBe(0)
    await expect
      .poll(() => ink(ben, around({ x: 400, y: 300 })))
      .toBeGreaterThan(0)
  })

  test('resizing a shape resizes it for the other person too', async ({
    person,
  }) => {
    const { ana, ben } = await twoPeople(person)
    await drawRectangle(ana, FROM, TO)
    await chooseTool(ana, 'Select')
    await ana.mouse.click(200, 150)
    const newRightEdge = { x: 400, y: 150, width: 6, height: 20 }
    expect(await ink(ben, newRightEdge)).toBe(0)

    await drag(ana, TO, { x: 400, y: 260 })

    await expect.poll(() => ink(ben, newRightEdge)).toBeGreaterThan(0)
  })

  test('deleting a shape removes it for the other person too', async ({
    person,
  }) => {
    const { ana, ben } = await twoPeople(person)
    await drawRectangle(ana, FROM, TO)
    await expect.poll(() => ink(ben, WHOLE)).toBeGreaterThan(0)
    await chooseTool(ana, 'Select')
    await ana.mouse.click(200, 150)

    await ana.keyboard.press('Delete')

    await expect.poll(() => ink(ben, WHOLE)).toBe(0)
  })

  test('both can draw at the same time and each sees both shapes', async ({
    person,
  }) => {
    const { ana, ben } = await twoPeople(person)
    const left = { x: 100, y: 100, width: 80, height: 60 }
    const right = { x: 500, y: 100, width: 80, height: 60 }

    await Promise.all([
      drawRectangle(ana, { x: 100, y: 100 }, { x: 180, y: 160 }),
      drawRectangle(ben, { x: 500, y: 100 }, { x: 580, y: 160 }),
    ])

    for (const page of [ana, ben]) {
      await expect
        .poll(() => ink(page, { ...left, x: 90, width: 100 }))
        .toBeGreaterThan(0)
      await expect
        .poll(() => ink(page, { ...right, x: 490, width: 100 }))
        .toBeGreaterThan(0)
    }
  })

  test("one person's mouse shows up as a name label for the other", async ({
    person,
  }) => {
    const { ana, ben } = await twoPeople(person)

    await ana.mouse.move(300, 300)
    await ana.mouse.move(400, 350, { steps: 5 })

    await expect(ben.getByText('Ana Park', { exact: true })).toBeVisible()
  })
})
