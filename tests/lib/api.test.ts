import {
  AxiosError,
  CanceledError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import { api, ApiError, createBoard, getBoard } from '@/lib/api'

const original = api.defaults.adapter

// A server that answers with this status and body. Axios rejects 4xx and 5xx replies.
const answersWith =
  (status: number, data: unknown): AxiosAdapter =>
  (config) =>
    Promise.reject(
      new AxiosError('failed', 'ERR_BAD_RESPONSE', config, null, {
        status,
        statusText: '',
        data,
        headers: {},
        config,
      }),
    )

// No answer at all, like a dead connection or a server that is down.
const noAnswer: AxiosAdapter = (config) =>
  Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config))

const succeeds =
  (data: unknown): AxiosAdapter =>
  (config: InternalAxiosRequestConfig) =>
    Promise.resolve({ status: 200, statusText: '', data, headers: {}, config })

// The error a call rejects with, so a test can look at it.
async function failureOf(call: () => Promise<unknown>) {
  try {
    await call()
  } catch (error) {
    return error
  }
  throw new Error('the call did not fail')
}

describe('API client errors', () => {
  afterEach(() => {
    api.defaults.adapter = original
  })

  it('returns the data when the request works', async () => {
    api.defaults.adapter = succeeds({ id: 'k7x2qm9a' })

    expect(await createBoard()).toBe('k7x2qm9a')
  })

  it('turns "no answer" into NETWORK_ERROR', async () => {
    api.defaults.adapter = noAnswer

    const error = await failureOf(() => getBoard('k7x2qm9a'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it.each([
    [404, 'BOARD_NOT_FOUND'],
    [404, 'NOT_FOUND'],
    [503, 'BOARD_LIMIT'],
    [400, 'VALIDATION_FAILED'],
    [500, 'INTERNAL'],
  ])('keeps the code our API sends (%i %s)', async (status, code) => {
    api.defaults.adapter = answersWith(status, {
      statusCode: status,
      code,
      message: code,
    })

    const error = await failureOf(() => getBoard('k7x2qm9a'))

    expect(error).toMatchObject({ code })
  })

  it('reads a 400 without one of our codes as bad input', async () => {
    api.defaults.adapter = answersWith(400, 'Bad Request') // for example from a proxy

    expect(await failureOf(() => getBoard('k7x2qm9a'))).toMatchObject({
      code: 'VALIDATION_FAILED',
    })
  })

  it.each([
    ['an HTML error page', 502, '<html>Bad Gateway</html>'],
    ['an empty reply', 500, null],
    ['a code we do not know', 500, { code: 'SOMETHING_NEW' }],
    ['a code that is not text', 500, { code: 42 }],
  ])('calls %s UNKNOWN', async (_name, status, body) => {
    api.defaults.adapter = answersWith(status, body)

    expect(await failureOf(() => getBoard('k7x2qm9a'))).toMatchObject({
      code: 'UNKNOWN',
    })
  })

  it('leaves a cancelled request as it is, not as a network failure', async () => {
    api.defaults.adapter = () => Promise.reject(new CanceledError('cancelled'))

    const error = await failureOf(() => getBoard('k7x2qm9a'))

    expect(error).not.toBeInstanceOf(ApiError)
    expect(error).toBeInstanceOf(CanceledError)
  })
})
