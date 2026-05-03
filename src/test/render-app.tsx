import { render } from '@testing-library/react'

import App from '../app/App'
import { AppProviders } from '../app/providers'

type RenderAppOptions = {
  apiBaseUrl?: string
  appVersion?: string
}

const DEFAULT_API_BASE_URL = 'https://shop.laguuniin.fi'
const DEFAULT_APP_VERSION = 'test-version'

export function renderApp({
  apiBaseUrl = DEFAULT_API_BASE_URL,
  appVersion = DEFAULT_APP_VERSION,
}: RenderAppOptions = {}) {
  return render(
    <AppProviders apiBaseUrl={apiBaseUrl} appVersion={appVersion}>
      <App />
    </AppProviders>,
  )
}
