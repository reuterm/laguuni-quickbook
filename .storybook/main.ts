import type { StorybookConfig } from '@storybook/react-vite'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-mcp'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../public'],
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  viteFinal: async (config) => {
    process.env.STORYBOOK = 'true'

    config.resolve ??= {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    }

    config.define = {
      ...config.define,
      'import.meta.env.VITE_APP_VERSION': JSON.stringify('storybook'),
      'import.meta.env.VITE_LAGUUNI_API_BASE_URL': JSON.stringify(
        'https://shop.laguuniin.fi',
      ),
    }

    return config
  },
}

export default config
