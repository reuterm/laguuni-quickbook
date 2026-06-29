import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export const storybookAlias = fileURLToPath(
  new URL('./.storybook', import.meta.url),
)
export const srcAlias = fileURLToPath(new URL('./src', import.meta.url))

export function createSharedVitePlugins() {
  return [react(), tailwindcss()]
}

export function createSharedViteAlias() {
  return {
    '@': srcAlias,
  }
}

export function createStorybookViteAlias() {
  return {
    ...createSharedViteAlias(),
    $storybook: storybookAlias,
  }
}
