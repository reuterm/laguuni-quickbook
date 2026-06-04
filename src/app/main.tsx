import { registerSW } from 'virtual:pwa-register'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import './App.css'
import { createAppConfig } from './config'
import { AppProviders } from './providers'

registerSW({
  immediate: true,
})

const rootElement = document.getElementById('root')
const appConfig = createAppConfig({
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  VITE_LAGUUNI_API_BASE_URL: import.meta.env.VITE_LAGUUNI_API_BASE_URL,
})

if (!rootElement) {
  throw new Error('Root element "#root" was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders
      apiBaseUrl={appConfig.apiBaseUrl}
      appVersion={appConfig.appVersion}
    >
      <App />
    </AppProviders>
  </StrictMode>,
)
