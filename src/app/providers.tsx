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
import { FetchHttpClient } from '../lib/api/client'
import { type LaguuniApi, LaguuniApiClient } from '../lib/api/laguuni-api'
import {
  createBrowserStorage,
  LocalSettingsStore,
  type UserSettingsStore,
} from '../lib/storage/local-storage'

type AppServices = {
  api: LaguuniApi
  apiBaseUrl: string
  bookingService: BookingService
  settingsStore: UserSettingsStore
}

const AppServicesContext = createContext<AppServices | null>(null)

type AppProvidersProps = PropsWithChildren<{
  apiBaseUrl: string
}>

export function AppProviders({ apiBaseUrl, children }: AppProvidersProps) {
  const services = useMemo<AppServices>(() => {
    const api = new LaguuniApiClient({
      client: new FetchHttpClient({
        baseUrl: apiBaseUrl,
        fetchImplementation: globalThis.fetch.bind(globalThis),
      }),
    })
    const settingsStore = new LocalSettingsStore({
      storage: createBrowserStorage(),
    })

    return {
      api,
      apiBaseUrl,
      bookingService: new DefaultBookingService({ api }),
      settingsStore,
    }
  }, [apiBaseUrl])

  return (
    <AppServicesContext.Provider value={services}>
      {children}
    </AppServicesContext.Provider>
  )
}

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext)

  if (services === null) {
    throw new Error('App services must be used within AppProviders')
  }

  return services
}
