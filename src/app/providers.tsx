import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react'

import {
  type BookingService,
  DefaultBookingService,
} from '../features/booking/booking-service'
import {
  type Diagnostics,
  LocalDiagnosticsStore,
} from '../features/diagnostics/logs'
import { FetchHttpClient } from '../lib/api/client'
import { type LaguuniApi, LaguuniApiClient } from '../lib/api/laguuni-api'
import {
  createBrowserStorage,
  LocalSettingsStore,
  type UserSettingsStore,
} from '../lib/storage/local-storage'

type AppDependencies = {
  api: LaguuniApi
  appVersion: string
  availabilityReferenceDate?: Date | undefined
  bookingService: BookingService
  diagnostics: Diagnostics
  settingsStore: UserSettingsStore
}

const AppDependenciesContext = createContext<AppDependencies | null>(null)

type AppProvidersProps = PropsWithChildren<{
  apiBaseUrl: string
  appVersion: string
  availabilityReferenceDate?: Date | undefined
}>

export function AppProviders({
  apiBaseUrl,
  appVersion,
  availabilityReferenceDate,
  children,
}: AppProvidersProps) {
  const dependencies = useMemo<AppDependencies>(() => {
    const browserStorage = createBrowserStorage()
    const api = new LaguuniApiClient({
      client: new FetchHttpClient({
        baseUrl: apiBaseUrl,
        fetchImplementation: globalThis.fetch.bind(globalThis),
      }),
    })
    const settingsStore = new LocalSettingsStore({
      storage: browserStorage,
    })
    const diagnostics = new LocalDiagnosticsStore({
      appVersion,
      storage: browserStorage,
    })

    return {
      api,
      appVersion,
      availabilityReferenceDate,
      bookingService: new DefaultBookingService({
        api,
      }),
      diagnostics,
      settingsStore,
    }
  }, [apiBaseUrl, appVersion, availabilityReferenceDate])

  return (
    <AppDependenciesContext.Provider value={dependencies}>
      {children}
    </AppDependenciesContext.Provider>
  )
}

function useAppDependencies(): AppDependencies {
  const dependencies = useContext(AppDependenciesContext)

  if (dependencies === null) {
    throw new Error('App dependencies must be used within AppProviders')
  }

  return dependencies
}

export function useLaguuniApi(): LaguuniApi {
  return useAppDependencies().api
}

export function useAppVersion(): string {
  return useAppDependencies().appVersion
}

export function useAvailabilityReferenceDate(): Date | undefined {
  return useAppDependencies().availabilityReferenceDate
}

export function useBookingService(): BookingService {
  return useAppDependencies().bookingService
}

export function useUserSettingsStore(): UserSettingsStore {
  return useAppDependencies().settingsStore
}

export function useDiagnostics(): Diagnostics {
  return useAppDependencies().diagnostics
}
