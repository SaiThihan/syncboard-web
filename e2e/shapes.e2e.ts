import {
  around,
  chooseTool,
  createBoard,
  drag,
  drawRectangle,
  expect,
  ink,
  test,
} from './helpers'

// A rectangle from (100, 100) to (300, 200): its corners are the places to look at.
const FROM = { x: 100, y: 100 }
const TO = { x: 300, y: 200 }
const WHOLE = { x: 80, y: 80, width: 260, height: 140 }

test.describe('one person on a board', () => {
  test('drawing a rectangle puts it on the board', async ({ person }) => {
    const ana = await person('Ana Park')
    await createBoard(ana)
    expect(await ink(ana, WHOLE)).toBe(0)

    await drawRectangle(ana, FROM, TO)

    await expect.poll(() => ink(ana, WHOLE)).toBeGreaterThan(0)
  })

  test('a click without a drag draws nothing', async ({ person }) => {
    const ana = await person('Ana Park')
    await createBoard(ana)
    await chooseTool(ana, 'Rectangle')

    await ana.mouse.click(200, 200)

    expect(await ink(ana, WHOLE)).toBe(0)
  })

  test('Escape cancels a drawing that is in progress', async ({ person }) => {
    const ana = await person('Ana Park')
    await createBoard(ana)
    await chooseTool(ana, 'Rectangle')

    await ana.mouse.move(FROM.x, FROM.y)
    await ana.mouse.down()
    await ana.mouse.move(TO.x, TO.y, { steps: 5 })
    await ana.keyboard.press('Escape')
    await ana.mouse.up()

    expect(await ink(ana, WHOLE)).toBe(0)
  })

  test('dragging a shape moves it', async ({ person }) => {
    const ana = await person('Ana Park')
    await createBoard(ana)
    await drawRectangle(ana, FROM, TO)
    await chooseTool(ana, 'Select')

    await drag(ana, { x: 200, y: 150 }, { x: 500, y: 350 }) // 300 right, 200 down

    await expect.poll(() => ink(ana, around(FROM))).toBe(0) // the old corner is empty
    await expect
      .poll(() => ink(ana, around({ x: 400, y: 300 })))
      .toBeGreaterThan(0)
  })

  test('dragging a corner handle resizes it', async ({ person }) => {
    const ana = await person('Ana Park')
    await createBoard(ana)
    await drawRectangle(ana, FROM, TO)
    await chooseTool(ana, 'Select')
    await ana.mouse.click(200, 150) // select it, which shows the handles
    const newRightEdge = { x: 400, y: 150, width: 6, height: 20 }
    expect(await ink(ana, newRightEdge)).toBe(0)

    await drag(ana, TO, { x: 400, y: 260 }) // the bottom right corner

    await expect.poll(() => ink(ana, newRightEdge)).toBeGreaterThan(0)
  })

  test('double-clicking text changes its words', async ({ person }) => {
    const ana = await person('Ana Park')
    await createBoard(ana)
    await chooseTool(ana, 'Text')
    await ana.mouse.click(200, 300)
    await ana.getByRole('textbox', { name: 'Text' }).fill('Hello')
    await ana.getByRole('textbox', { name: 'Text' }).press('Enter')
    const whereTheLongerTextWillReach = {
      x: 330,
      y: 300,
      width: 120,
      height: 24,
    }
    await expect
      .poll(() => ink(ana, { x: 200, y: 300, width: 60, height: 24 }))
      .toBeGreaterThan(0)
    expect(await ink(ana, whereTheLongerTextWillReach)).toBe(0)
    await chooseTool(ana, 'Select')

    await ana.mouse.dblclick(215, 310)
    await ana
      .getByRole('textbox', { name: 'Text' })
      .fill('Hello there everyone')
    await ana.getByRole('textbox', { name: 'Text' }).press('Enter')

    await expect
      .poll(() => ink(ana, whereTheLongerTextWillReach))
      .toBeGreaterThan(0)
  })

  test('pressing Delete removes the selected shape', async ({ person }) => {
    const ana = await person('Ana Park')
    await createBoard(ana)
    await drawRectangle(ana, FROM, TO)
    await chooseTool(ana, 'Select')
    await ana.mouse.click(200, 150)
    await expect(
      ana.getByRole('button', { name: 'Delete selected object' }),
    ).toBeEnabled()

    await ana.keyboard.press('Delete')

    await expect.poll(() => ink(ana, WHOLE)).toBe(0)
    await expect(
      ana.getByRole('button', { name: 'Delete selected object' }),
    ).toBeDisabled()
  })

  test('dragging a box on empty space selects several shapes, and Delete removes them all', async ({
    person,
  }) => {
    const ana = await person('Ana Park')
    await createBoard(ana)
    await drawRectangle(ana, { x: 100, y: 100 }, { x: 180, y: 160 })
    await drawRectangle(ana, { x: 300, y: 100 }, { x: 380, y: 160 })
    await chooseTool(ana, 'Select')

    await drag(ana, { x: 60, y: 70 }, { x: 420, y: 200 })

    await expect(
      ana.getByRole('button', { name: 'Delete 2 selected objects' }),
    ).toBeEnabled()
    await ana.keyboard.press('Delete')
    await expect
      .poll(() => ink(ana, { x: 60, y: 70, width: 380, height: 150 }))
      .toBe(0)
  })
})
