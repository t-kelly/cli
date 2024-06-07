import {pollAppLogs} from './poll-app-logs.js'
import {writeAppLogsToFile} from './write-app-logs.js'
import {partnersFqdn} from '@shopify/cli-kit/node/context/fqdn'
import {describe, expect, test, vi, beforeEach, afterEach} from 'vitest'
import {fetch} from '@shopify/cli-kit/node/http'
import * as components from '@shopify/cli-kit/node/ui/components'

const JWT_TOKEN = 'jwtToken'
const API_KEY = 'apiKey'

vi.mock('./write-app-logs.js')
vi.mock('@shopify/cli-kit/node/http')

const FQDN = await partnersFqdn()
const LOGS = '1\\n2\\n3\\n4\\n'
const INPUT = {
  cart: {
    lines: [
      {
        quantity: 3,
        merchandise: {
          __typename: 'ProductVariant',
          id: 'gid:\\/\\/shopify\\/ProductVariant\\/2',
        },
      },
    ],
  },
}
const OUTPUT = {
  discountApplicationStrategy: 'FIRST',
  discounts: [
    {
      message: '10% off',
      value: {
        percentage: {
          value: 10,
        },
      },
      targets: [
        {
          productVariant: {
            id: 'gid://shopify/ProductVariant/2',
          },
        },
      ],
    },
  ],
}
const SOURCE = 'my-function'
const PAYLOAD = {
  input: JSON.stringify(INPUT),
  input_bytes: 123,
  output: JSON.stringify(OUTPUT),
  output_bytes: 182,
  function_id: 'e57b4d31-2038-49ff-a0a1-1eea532414f7',
  logs: LOGS,
  fuel_consumed: 512436,
}
const RETURNED_CURSOR = '2024-05-23T19:17:02.321773Z'
const RESPONSE_DATA = {
  app_logs: [
    {
      shop_id: 1,
      api_client_id: 1830457,
      payload: JSON.stringify(PAYLOAD),
      event_type: 'function_run',
      cursor: '2024-05-23T19:17:02.321773Z',
      status: 'success',
      source: SOURCE,
      source_namespace: 'extensions',
      log_timestamp: '2024-05-23T19:17:00.240053Z',
    },
  ],
  cursor: RETURNED_CURSOR,
}
const MOCKED_RESUBSCRIBE_CALLBACK = vi.fn()

describe('pollAppLogs', () => {
  let stdout: any

  beforeEach(() => {
    stdout = {write: vi.fn()}
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
  })

  test('polls and re-polls the endpoint', async () => {
    const firstUrl = `https://${FQDN}/app_logs/poll`
    const secondUrl = `${firstUrl}?cursor=${RETURNED_CURSOR}`

    // Given
    vi.mocked(writeAppLogsToFile)

    vi.spyOn(components, 'useConcurrentOutputContext')

    const mockedFetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(RESPONSE_DATA))
      .mockResolvedValueOnce(Response.json(RESPONSE_DATA))
    vi.mocked(fetch).mockImplementation(mockedFetch)

    // When
    await pollAppLogs({
      stdout,
      appLogsFetchInput: {jwtToken: JWT_TOKEN},
      apiKey: API_KEY,
      resubscribeCallback: MOCKED_RESUBSCRIBE_CALLBACK,
    })
    await vi.advanceTimersToNextTimerAsync()

    // Then
    expect(fetch).toHaveBeenCalledWith(firstUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    })

    expect(fetch).toHaveBeenCalledWith(secondUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    })

    expect(writeAppLogsToFile).toHaveBeenCalledWith({
      appLog: RESPONSE_DATA.app_logs[0],
      apiKey: API_KEY,
      stdout,
    })

    expect(stdout.write).toHaveBeenCalledWith('Function executed successfully using 0.5124M instructions.')
    expect(stdout.write).toHaveBeenCalledWith(LOGS)

    expect(components.useConcurrentOutputContext).toHaveBeenCalledWith({outputPrefix: SOURCE}, expect.any(Function))

    expect(vi.getTimerCount()).toEqual(1)
  })

  test('calls resubscribe callback if a 401 is received', async () => {
    // Given
    const url = `https://${FQDN}/app_logs/poll`

    const response = new Response('errorMessage', {status: 401})
    const mockedFetch = vi.fn().mockResolvedValueOnce(response)
    vi.mocked(fetch).mockImplementation(mockedFetch)

    // When/Then
    await pollAppLogs({
      stdout,
      appLogsFetchInput: {jwtToken: JWT_TOKEN},
      apiKey: API_KEY,
      resubscribeCallback: MOCKED_RESUBSCRIBE_CALLBACK,
    })

    expect(MOCKED_RESUBSCRIBE_CALLBACK).toHaveBeenCalled()
  })

  test('throws error if response is not ok', async () => {
    // Given
    const url = `https://${FQDN}/app_logs/poll`

    const response = new Response('errorMessage', {status: 500})
    const mockedFetch = vi.fn().mockResolvedValueOnce(response)
    vi.mocked(fetch).mockImplementation(mockedFetch)

    // When/Then
    await expect(() =>
      pollAppLogs({
        stdout,
        appLogsFetchInput: {jwtToken: JWT_TOKEN},
        apiKey: API_KEY,
        resubscribeCallback: MOCKED_RESUBSCRIBE_CALLBACK,
      }),
    ).rejects.toThrowError('Error while fetching: errorMessage')

    expect(fetch).toHaveBeenCalledWith(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    })
  })
})