import { createBoard, expect, joinBoard, test } from './helpers'

test.describe('presence', () => {
  test('a person who joins is announced and counted', async ({ person }) => {
    const ana = await person('Ana Park')
    const boardId = await createBoard(ana)
    await expect(ana.getByRole('button', { name: /1 person/ })).toBeVisible()
    const ben = await person('Ben Okoye')

    await joinBoard(ben, boardId)

    await expect(ana.getByText('Ben Okoye joined the board')).toBeVisible()
    await expect(ana.getByRole('button', { name: /2 people/ })).toBeVisible()
    await expect(ben.getByRole('button', { name: /2 people/ })).toBeVisible()
  })

  test('a person who leaves is announced and no longer counted', async ({
    person,
  }) => {
    const ana = await person('Ana Park')
    const boardId = await createBoard(ana)
    const ben = await person('Ben Okoye')
    await joinBoard(ben, boardId)
    await expect(ana.getByRole('button', { name: /2 people/ })).toBeVisible()

    await ben.getByRole('button', { name: 'Leave board' }).click()

    await expect(ben).toHaveURL('/')
    await expect(ana.getByText('Ben Okoye left the board')).toBeVisible()
    await expect(ana.getByRole('button', { name: /1 person/ })).toBeVisible()
  })

  test('closing the window counts as leaving', async ({ person }) => {
    const ana = await person('Ana Park')
    const boardId = await createBoard(ana)
    const ben = await person('Ben Okoye')
    await joinBoard(ben, boardId)
    await expect(ana.getByRole('button', { name: /2 people/ })).toBeVisible()

    await ben.close()

    await expect(ana.getByText('Ben Okoye left the board')).toBeVisible()
    await expect(ana.getByRole('button', { name: /1 person/ })).toBeVisible()
  })

  test('the list shows everyone, with "You" next to your own name', async ({
    person,
  }) => {
    const ana = await person('Ana Park')
    const boardId = await createBoard(ana)
    const ben = await person('Ben Okoye')
    await joinBoard(ben, boardId)
    await expect(ana.getByRole('button', { name: /2 people/ })).toBeVisible()

    await ana.getByRole('button', { name: /Who is here/ }).click()

    const list = ana.getByRole('dialog', { name: 'Who is here' })
    await expect(list.getByText('Ana Park')).toBeVisible()
    await expect(list.getByText('Ben Okoye')).toBeVisible()
    await expect(list.getByText('You')).toHaveCount(1)
  })
})
