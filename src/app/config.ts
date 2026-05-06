import {
  DEFAULT_LAGUUNI_API_BASE_URL,
  normalizeApiBaseUrl,
} from '../lib/api/client'

export type AppConfig = {
  apiBaseUrl: string
  appVersion: string
}

export type AppConfigEnv = {
  VITE_APP_VERSION?: string | undefined
  VITE_LAGUUNI_API_BASE_URL?: string | undefined
}

export function createAppConfig(env: AppConfigEnv): AppConfig {
  return {
    apiBaseUrl: normalizeApiBaseUrl(
      env.VITE_LAGUUNI_API_BASE_URL ?? DEFAULT_LAGUUNI_API_BASE_URL,
    ),
    appVersion: normalizeAppVersion(env.VITE_APP_VERSION ?? 'unknown'),
  }
}

function normalizeAppVersion(version: string): string {
  const normalizedVersion = version.trim()

  if (normalizedVersion.length === 0) {
    throw new Error('App version cannot be empty')
  }

  return normalizedVersion
}
