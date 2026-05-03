import {
  DEFAULT_LAGUUNI_API_BASE_URL,
  normalizeApiBaseUrl,
} from '../lib/api/client'

export type AppConfig = {
  apiBaseUrl: string
}

export type AppConfigEnv = {
  VITE_LAGUUNI_API_BASE_URL?: string | undefined
}

export function createAppConfig(env: AppConfigEnv): AppConfig {
  return {
    apiBaseUrl: normalizeApiBaseUrl(
      env.VITE_LAGUUNI_API_BASE_URL ?? DEFAULT_LAGUUNI_API_BASE_URL,
    ),
  }
}
