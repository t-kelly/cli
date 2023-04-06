import {getCurrentStatus, hookStart} from './tunnel.js'
import {describe, vi, expect, test} from 'vitest'
import {exec} from '@shopify/cli-kit/node/system'
import {Writable} from 'stream'

const port = 1234
vi.mock('@shopify/cli-kit/node/system')

describe('hookStart', () => {
  test('returns a url if cloudflare prints a URL and a connection is established', async () => {
    vi.mocked(exec).mockImplementationOnce(async (command, args, options) => {
      const writable = options?.stdout as Writable
      writable.write(Buffer.from(`2023-01-30T15:37:11Z INF |  https://example.trycloudflare.com`))
      writable.write(Buffer.from(`2023-01-30T15:37:11Z INF Connection registered`))
    })

    // When
    await hookStart(port)
    const result = await getCurrentStatus()

    // Then
    expect(result).toEqual({url: 'https://example.trycloudflare.com', port: 1234, status: 'connected'})
  })

  test('throws if a connection is stablished but we didnt find a URL', async () => {
    vi.mocked(exec).mockImplementationOnce(async (command, args, options) => {
      const writable = options?.stdout as Writable
      writable.write(Buffer.from(`2023-01-30T15:37:11Z INF |  https://bad_url.com`))
      writable.write(Buffer.from(`2023-01-30T15:37:11Z INF Connection registered`))
    })

    // When
    await hookStart(port)
    const result = await getCurrentStatus()

    // Then
    expect(result).toEqual({status: 'error', message: 'Could not find tunnel url'})
  })

  test('returns starting status if a URL is detected but there is no connection yet', async () => {
    vi.mocked(exec).mockImplementationOnce(async (command, args, options) => {
      const writable = options?.stdout as Writable
      writable.write(Buffer.from(`2023-01-30T15:37:11Z INF |  https://example.trycloudflare.com`))
    })

    // When
    await hookStart(port)
    const result = await getCurrentStatus()

    // Then
    expect(result).toEqual({status: 'starting'})
  })
})
