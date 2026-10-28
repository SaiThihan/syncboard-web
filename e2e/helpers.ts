import { test as base, type BrowserContext, type Page } from '@playwright/test'

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000'

export type ToolName =
  'Select' | 'Pen' | 'Rectangle' | 'Circle' | 'Arrow' | 'Text'

interface Point {
  x: number
  y: number
}
interface Area extends Point {
  width: number
  height: number
}

// `person('Ana')` opens a new browser window of its own (its own sessionStorage, so its own
// identity) on the home page with the name filled in. Everything is closed after the test.
export const test = base.extend<{ person: (name: string) => Promise<Page> }>({
  person: async ({ browser }, provide) => {
    const contexts: BrowserContext[] = []
    await provide(async (name) => {
      const context = await browser.newContext()
      contexts.push(context)
      const page = await context.newPage()
      await page.goto('/')
      await page.getByLabel('Display name').fill(name)
      return page
    })
    await Promise.all(contexts.map((context) => context.close()))
  },
})
export { expect } from '@playwright/test'

// Creates a board from the home page and returns its id.
export async function createBoard(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Create board' }).click()
  await page.waitForURL(/\/board\/[A-Za-z0-9_-]{8}$/)
  await page.getByText('Connected').waitFor()
  return page.url().split('/').pop() ?? ''
}

// Joins an existing board from the home page, with the id typed into the join box.
export async function joinBoard(page: Page, boardId: string) {
  await page.getByLabel('Join with a link or board ID').fill(boardId)
  await page.getByRole('button', { name: 'Join board' }).click()
  await page.waitForURL(`**/board/${boardId}`)
  await page.getByText('Connected').waitFor()
}

export async function chooseTool(page: Page, tool: ToolName) {
  await page
    .getByRole('toolbar', { name: 'Tools' })
    .getByRole('button', { name: tool, exact: true })
    .click()
}

// Press at `from`, move to `to` in a few steps, and let go. Page and board positions are the
// same here, because the board starts at the top left of the window.
export async function drag(page: Page, from: Point, to: Point) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 5 })
  await page.mouse.up()
}

export async function drawRectangle(page: Page, from: Point, to: Point) {
  await chooseTool(page, 'Rectangle')
  await drag(page, from, to)
}

// How many canvas pixels in this area are painted. The dot grid is not on the canvas, so
// only shapes (and the selection outline and handles) count.
export function ink(page: Page, area: Area): Promise<number> {
  return page.evaluate(({ x, y, width, height }) => {
    const canvas = document.querySelector('canvas')
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return 0
    const scale = window.devicePixelRatio
    const { data } = context.getImageData(
      x * scale,
      y * scale,
      width * scale,
      height * scale,
    )
    let painted = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted++
    return painted
  }, area)
}

// A small box around a point, for checking "is there a shape edge here".
export const around = (point: Point, reach = 8): Area => ({
  x: point.x - reach,
  y: point.y - reach,
  width: reach * 2,
  height: reach * 2,
})

// A switch for this page's connection to the API. `drop()` closes every open WebSocket and
// refuses the fallback HTTP requests, so the app sees a dead network, until `restore()`.
// Call it right after `person(...)`: it reloads the page (to install a tiny script that
// remembers the WebSockets) and types the name in again.
export async function controlNetwork(page: Page) {
  const name = await page.getByLabel('Display name').inputValue()
  await page.addInitScript(() => {
    const sockets: WebSocket[] = []
    const Original = window.WebSocket
    window.WebSocket = class extends Original {
      constructor(...args: ConstructorParameters<typeof WebSocket>) {
        super(...args)
        sockets.push(this)
      }
    }
    ;(window as unknown as { __sockets: WebSocket[] }).__sockets = sockets
  })
  await page.reload()
  await page.getByLabel('Display name').fill(name)

  let down = false
  await page.route('**/socket.io/**', (route) =>
    down ? route.abort() : route.continue(),
  )
  return {
    drop: async () => {
      down = true
      await page.evaluate(() =>
        (window as unknown as { __sockets: WebSocket[] }).__sockets.forEach(
          (socket) => socket.close(),
        ),
      )
    },
    restore: () => {
      down = false
    },
  }
}
