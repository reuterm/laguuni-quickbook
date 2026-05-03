import { describe, expect, it } from 'vitest'

import { normalizeApiBaseUrl } from './client'

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
