import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

function readBuildSha(): string {
  const buildSha = process.env.BUILD_SHA?.trim()

  if (buildSha && buildSha.length > 0) {
    return buildSha
  }

  return 'local-dev'
}

function normalizeBasePath(basePath: string | undefined): string {
  const normalizedBasePath = basePath?.trim()

  if (!normalizedBasePath) {
    return '/'
  }

  return `/${normalizedBasePath.replace(/^\/+|\/+$/g, '')}/`
}

export default defineConfig({
  base: normalizeBasePath(process.env.BASE_PATH),
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(readBuildSha()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
      ],
      manifest: {
        background_color: '#101018',
        description:
          'Browse Laguuni cable availability and book one-hour slots when connected.',
        display: 'standalone',
        icons: [
          {
            sizes: '192x192',
            src: 'pwa-192x192.png',
            type: 'image/png',
          },
          {
            sizes: '512x512',
            src: 'pwa-512x512.png',
            type: 'image/png',
          },
          {
            purpose: 'maskable',
            sizes: '512x512',
            src: 'pwa-maskable-512x512.png',
            type: 'image/png',
          },
        ],
        id: normalizeBasePath(process.env.BASE_PATH),
        name: 'Laguuni Quickbook',
        scope: normalizeBasePath(process.env.BASE_PATH),
        short_name: 'Quickbook',
        start_url: normalizeBasePath(process.env.BASE_PATH),
        theme_color: '#101018',
      },
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{css,html,ico,js,png,svg,webmanifest}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
