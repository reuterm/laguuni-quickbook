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
  it('uses the injected fetch implementation', async () => {
    const fetchImplementation: typeof fetch = vi.fn(
      async (input: string | URL | Request) => {
        return new Response(
          JSON.stringify({ source: 'injected', url: String(input) }),
          {
            status: 200,
          },
        )
      },
    )

    const client = new FetchHttpClient({
      baseUrl: 'https://shop.example.test',
      fetchImplementation,
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
        source: 'injected',
        url: 'https://shop.example.test/api/test.json',
      },
      status: 200,
    })

    expect(fetchImplementation).toHaveBeenCalledOnce()
  })

  it('resolves absolute-style paths from the api origin root', async () => {
    const fetchImplementation: typeof fetch = vi.fn(
      async (input: string | URL | Request) => {
        return new Response(JSON.stringify({ url: String(input) }), {
          status: 200,
        })
      },
    )

    const client = new FetchHttpClient({
      baseUrl: 'https://host/prefix',
      fetchImplementation,
    })

    await expect(
      client.request({
        decoder(value) {
          return value as { url: string }
        },
        path: '/api/test.json',
      }),
    ).resolves.toEqual({
      data: {
        url: 'https://host/api/test.json',
      },
      status: 200,
    })
  })
})
