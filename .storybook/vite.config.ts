import { mergeConfig } from 'vite'

import { createAppViteConfig } from '../vite.config'
import { createStorybookViteAlias } from '../vite.shared'

export default mergeConfig(createAppViteConfig({ includePwa: false }), {
  base: '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify('storybook'),
    'import.meta.env.VITE_LAGUUNI_API_BASE_URL': JSON.stringify(
      'https://storybook.laguuni.invalid',
    ),
  },
  resolve: {
    alias: createStorybookViteAlias(),
  },
  test: undefined,
})
