import { createBoard, expect, joinBoard, test } from './helpers'

test('a second person joins a board with its id, and both see two people', async ({
  person,
}) => {
  const ana = await person('Ana Park')
  const boardId = await createBoard(ana)
  const ben = await person('Ben Okoye')

  await joinBoard(ben, boardId)

  await expect(ben.getByRole('button', { name: /2 people/ })).toBeVisible()
  await expect(ana.getByRole('button', { name: /2 people/ })).toBeVisible()
})

test('a whole pasted link works as well as the bare id', async ({ person }) => {
  const ana = await person('Ana Park')
  const boardId = await createBoard(ana)
  const ben = await person('Ben Okoye')

  await ben
    .getByLabel('Join with a link or board ID')
    .fill(`http://localhost:5173/board/${boardId}`)
  await ben.getByRole('button', { name: 'Join board' }).click()

  await expect(ben).toHaveURL(new RegExp(`/board/${boardId}$`))
  await expect(ben.getByText('Connected')).toBeVisible()
})

test('pressing Enter in the name field joins when a board id is typed', async ({
  person,
}) => {
  const ana = await person('Ana Park')
  const boardId = await createBoard(ana)
  const ben = await person('Ben Okoye')

  await ben.getByLabel('Join with a link or board ID').fill(boardId)
  await ben.getByLabel('Display name').press('Enter')

  await expect(ben).toHaveURL(new RegExp(`/board/${boardId}$`))
})

test('someone who opens a board link directly is asked for a name first', async ({
  person,
  browser,
}) => {
  const ana = await person('Ana Park')
  const boardId = await createBoard(ana)
  const context = await browser.newContext()
  const ben = await context.newPage()

  await ben.goto(`/board/${boardId}`)
  await expect(ben.getByText('What should we call you?')).toBeVisible()
  await ben.getByLabel('Display name').fill('Ben Okoye')
  await ben.getByRole('button', { name: 'Join board' }).click()

  await expect(ben.getByText('Connected')).toBeVisible()
  await expect(ana.getByRole('button', { name: /2 people/ })).toBeVisible()
  await context.close()
})
