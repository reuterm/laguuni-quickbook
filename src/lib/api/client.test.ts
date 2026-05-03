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
  it('binds the default browser fetch implementation to its receiver', async () => {
    type Receiver = {
      fetch(this: Receiver, input: string | URL): Promise<Response>
    }

    const requiredReceiver: Receiver = {
      async fetch(this: Receiver, input: string | URL) {
        if (this !== requiredReceiver) {
          throw new TypeError(
            "'fetch' called on an object that does not implement interface Window.",
          )
        }

        return new Response(JSON.stringify({ ok: true, url: String(input) }), {
          status: 200,
        })
      },
    }

    vi.stubGlobal('window', requiredReceiver)
    vi.stubGlobal('fetch', requiredReceiver.fetch)

    const client = new FetchHttpClient({
      baseUrl: 'https://shop.example.test',
    })

    await expect(
      client.request({
        decoder(value) {
          return value as { ok: boolean; url: string }
        },
        path: '/api/test.json',
      }),
    ).resolves.toEqual({
      data: {
        ok: true,
        url: 'https://shop.example.test/api/test.json',
      },
      status: 200,
    })
  })
})
