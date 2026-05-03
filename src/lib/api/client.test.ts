import { afterEach, describe, expect, it, vi } from 'vitest'

import { FetchHttpClient, normalizeApiBaseUrl } from './client'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('normalizeApiBaseUrl', () => {
  it('normalizes trailing slashes from explicit base urls', () => {
    expect(normalizeApiBaseUrl('https://shop.example.test///')).toBe(
      'https://shop.example.test',
    )
  })

  it('rejects empty base urls', () => {
    expect(() => normalizeApiBaseUrl('   ')).toThrow(
      'Laguuni API base URL cannot be empty',
    )
  })
})

describe('FetchHttpClient', () => {
  it('prefers the global fetch implementation when both global and window fetch exist', async () => {
    const globalFetch = vi.fn(async (input: string | URL) => {
      return new Response(
        JSON.stringify({ source: 'global', url: String(input) }),
        {
          status: 200,
        },
      )
    })
    const windowFetch = vi.fn(async (input: string | URL) => {
      return new Response(
        JSON.stringify({ source: 'window', url: String(input) }),
        {
          status: 200,
        },
      )
    })

    vi.stubGlobal('window', { fetch: windowFetch })
    vi.stubGlobal('fetch', globalFetch)

    const client = new FetchHttpClient({
      baseUrl: 'https://shop.example.test',
    })

    await expect(
      client.request({
        decoder(value) {
          return value as { source: string; url: string }
        },
        path: '/api/test.json',
      }),
    ).resolves.toEqual({
      data: {
        source: 'global',
        url: 'https://shop.example.test/api/test.json',
      },
      status: 200,
    })

    expect(globalFetch).toHaveBeenCalledOnce()
    expect(windowFetch).not.toHaveBeenCalled()
  })
})
