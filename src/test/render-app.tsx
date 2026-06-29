import { render } from '@testing-library/react'

import App from '../app/App'
import { AppProviders } from '../app/providers'
import type { BrowserStorage } from '../lib/storage/local-storage'

type RenderAppOptions = {
  apiBaseUrl?: string
  appVersion?: string
  availabilityReferenceDate?: Date
  fetchImplementation?: typeof fetch
  storage: BrowserStorage
}

const DEFAULT_API_BASE_URL = 'https://shop.laguuniin.fi'
const DEFAULT_APP_VERSION = 'test-version'

export function renderApp({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  appVersion = DEFAULT_APP_VERSION,
  availabilityReferenceDate,
  fetchImplementation = globalThis.fetch.bind(globalThis),
  storage,
}: RenderAppOptions) {
  return render(
    <AppProviders
      apiBaseUrl={apiBaseUrl}
      appVersion={appVersion}
      availabilityReferenceDate={availabilityReferenceDate}
      fetchImplementation={fetchImplementation}
      storage={storage}
    >
      <App />
    </AppProviders>,
  )
}
