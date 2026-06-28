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

  it('preserves scoped base-url path prefixes for app api requests', async () => {
    const fetchImplementation: typeof fetch = vi.fn(
      async (input: string | URL | Request) => {
        return new Response(JSON.stringify({ url: String(input) }), {
          status: 200,
        })
      },
    )

    const client = new FetchHttpClient({
      baseUrl:
        'http://localhost:6006/__storybook/laguuni/availability-screen--read-only/booking-enabled',
      fetchImplementation,
    })

    await expect(
      client.request({
        decoder(value) {
          return value as { url: string }
        },
        path: '/api/laguuni/products/6/availabledates/2026-05-01.json',
        query: {
          count: 1,
          field: 'hourlyfrom',
          mode: 'hours',
          required_resources: true,
          resource_count: 1,
        },
      }),
    ).resolves.toEqual({
      data: {
        url: 'http://localhost:6006/__storybook/laguuni/availability-screen--read-only/booking-enabled/api/laguuni/products/6/availabledates/2026-05-01.json?count=1&field=hourlyfrom&mode=hours&required_resources=true&resource_count=1',
      },
      status: 200,
    })
  })
})
