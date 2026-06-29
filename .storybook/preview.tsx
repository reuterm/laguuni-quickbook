import type { Preview } from '@storybook/react-vite'
import { initialize, mswLoader } from 'msw-storybook-addon'

import '../src/app/App.css'
import {
  createStorybookLaguuniHandlers,
  pruneStorybookLaguuniScope,
} from './laguuni-handlers'
import { StorybookAppProviders } from './storybook-app-providers'

initialize({
  serviceWorker: {
    url: '/mockServiceWorker.js',
  },
})

const preview: Preview = {
  async beforeEach(context) {
    return () => {
      pruneStorybookLaguuniScope(context.id)
    }
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
    msw: {
      handlers: createStorybookLaguuniHandlers(),
    },
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
