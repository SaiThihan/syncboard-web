import {
  controlNetwork,
  createBoard,
  drawRectangle,
  expect,
  ink,
  joinBoard,
  test,
} from './helpers'

const WHOLE = { x: 80, y: 80, width: 260, height: 140 }

test.describe('when the connection is lost', () => {
  test('editing is paused with a banner, and it all comes back with the network', async ({
    person,
  }) => {
    const ana = await person('Ana Park')
    const network = await controlNetwork(ana)
    await createBoard(ana)
    const banner = ana.getByText(
      'Reconnecting. Changes are paused until you are back.',
    )
    await expect(banner).toBeHidden()

    await network.drop()

    await expect(banner).toBeVisible()
    const tools = ana
      .getByRole('toolbar', { name: 'Tools' })
      .getByRole('button')
    for (const tool of await tools.all()) await expect(tool).toBeDisabled()
    await ana.mouse.move(100, 100) // trying to draw does nothing
    await ana.mouse.down()
    await ana.mouse.move(300, 200, { steps: 5 })
    await ana.mouse.up()
    expect(await ink(ana, WHOLE)).toBe(0)

    network.restore()

    await expect(banner).toBeHidden({ timeout: 20_000 })
    await expect(ana.getByText('Connected')).toBeVisible()
    await drawRectangle(ana, { x: 100, y: 100 }, { x: 300, y: 200 })
    await expect.poll(() => ink(ana, WHOLE)).toBeGreaterThan(0)
  })

  test('what others did while you were away shows up after you reconnect', async ({
    person,
  }) => {
    const ana = await person('Ana Park')
    const network = await controlNetwork(ana)
    const boardId = await createBoard(ana)
    const ben = await person('Ben Okoye')
    await joinBoard(ben, boardId)
    await expect(ana.getByRole('button', { name: /2 people/ })).toBeVisible()
    await network.drop()
    await expect(
      ana.getByText('Reconnecting. Changes are paused until you are back.'),
    ).toBeVisible()

    await drawRectangle(ben, { x: 100, y: 100 }, { x: 300, y: 200 }) // while Ana is away
    expect(await ink(ana, WHOLE)).toBe(0) // she cannot know yet

    network.restore()

    await expect
      .poll(() => ink(ana, WHOLE), { timeout: 20_000 })
      .toBeGreaterThan(0)
  })
})
