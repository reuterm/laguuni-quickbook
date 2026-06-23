import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-mcp',
  ],
  core: {
    builder: {
      name: '@storybook/builder-vite',
      options: {
        viteConfigPath: '.storybook/vite.config.ts',
      },
    },
  },
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../.storybook/public'],
  stories: ['../src/**/*.stories.@(ts|tsx)'],
}

export default config
