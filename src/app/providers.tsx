import type { PropsWithChildren } from 'react'

export function AppProviders({ children }: PropsWithChildren) {
  // This keeps one stable place for future app-wide contexts as the skeleton grows.
  return <>{children}</>
}
