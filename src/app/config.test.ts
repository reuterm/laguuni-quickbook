import { describe, expect, it } from 'vitest'

import { createAppConfig } from './config'

describe('createAppConfig', () => {
  it('defaults to the production storefront base url', () => {
    expect(createAppConfig({}).apiBaseUrl).toBe('https://shop.laguuniin.fi')
  })

  it('normalizes an explicit browser api base url', () => {
    expect(
      createAppConfig({
        VITE_LAGUUNI_API_BASE_URL: 'https://vite.example.test///',
      }).apiBaseUrl,
    ).toBe('https://vite.example.test')
  })
})
