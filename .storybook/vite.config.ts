import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify('storybook'),
    'import.meta.env.VITE_LAGUUNI_API_BASE_URL': JSON.stringify(
      'https://storybook.laguuni.invalid',
    ),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      $storybook: fileURLToPath(new URL('.', import.meta.url)),
      '@': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
})
