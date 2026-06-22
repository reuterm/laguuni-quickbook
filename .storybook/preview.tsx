import type { Preview } from '@storybook/react-vite'
import { initialize, mswLoader } from 'msw-storybook-addon'

import '../src/app/App.css'
import { resetStorybookLaguuniHandlerState } from './laguuni-handlers'
import { StorybookAppProviders } from './storybook-app-providers'

initialize({
  serviceWorker: {
    url: '/mockServiceWorker.js',
  },
})

const preview: Preview = {
  async beforeEach() {
    resetStorybookLaguuniHandlerState()
  },
  decorators: [StorybookAppProviders],
  loaders: [mswLoader],
  parameters: {
    a11y: {
      test: 'todo',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
    options: {
      storySort: {
        order: [
          'App',
          'UI',
          'Availability',
          'Booking',
          'Diagnostics',
          'Settings',
        ],
      },
    },
  },
}

export default preview
