import type { Decorator } from '@storybook/react'
import { useMemo } from 'react'

import { AppProviders } from '../src/app/providers'
import type { BrowserStorage } from '../src/lib/storage/local-storage'
import { AvailabilityScopeProvider } from '../src/features/availability/use-availability-scope'
import { UserSettingsProvider } from '../src/features/settings/use-user-settings'
import { getStorybookLaguuniApiBaseUrl } from './laguuni-handlers'
import {
  createStorybookPersistedStateIdentity,
  type StorybookPersistedStateSeed,
  createInMemoryBrowserStorage,
  seedStorybookPersistedState,
} from './storybook-persisted-state'

type StorybookParameters = {
  appVersion?: string
  availabilityReferenceDate?: Date
  developerMode?: boolean
  laguuni?: {
    checkoutScenario?: 'failed-booking' | 'payment-required'
  }
  seedCorruptedSettings?: boolean
  settings?: StorybookPersistedStateSeed['settings']
}

type SeededStateIdentity = string

const DEFAULT_APP_VERSION = 'storybook'
const DEFAULT_AVAILABILITY_REFERENCE_DATE = new Date('2026-05-14T12:00:00')

export const StorybookAppProviders: Decorator = (Story, context) => {
  const parameters = context.parameters as StorybookParameters
  const seededStateIdentity = createSeededStateIdentity(context.id, parameters)
  const storybookScenario = parameters.laguuni?.checkoutScenario ?? 'booking-enabled'

  return (
    <SeededStateBoundary
      key={seededStateIdentity}
      apiScopeId={context.id}
      identity={seededStateIdentity}
      parameters={parameters}
      storybookScenario={storybookScenario}
    >
      {() => <Story />}
    </SeededStateBoundary>
  )
}

function SeededStateBoundary({
  children,
  apiScopeId,
  identity,
  parameters,
  storybookScenario,
}: {
  children: () => React.ReactNode
  apiScopeId: string
  identity: SeededStateIdentity
  parameters: StorybookParameters
  storybookScenario: 'booking-enabled' | 'failed-booking' | 'payment-required'
}) {
  const storage = useMemo(() => {
    const nextStorage = createInMemoryBrowserStorage()

    seedStorybookPersistedState(
      {
        developerMode: parameters.developerMode,
        seedCorruptedSettings: parameters.seedCorruptedSettings,
        settings: parameters.settings,
      },
      nextStorage,
    )

    return nextStorage
  }, [identity])

  return (
    <AppProviders
      apiBaseUrl={getStorybookLaguuniApiBaseUrl(apiScopeId, storybookScenario)}
      appVersion={parameters.appVersion ?? DEFAULT_APP_VERSION}
      availabilityReferenceDate={
        parameters.availabilityReferenceDate ??
        DEFAULT_AVAILABILITY_REFERENCE_DATE
      }
      storage={storage}
    >
      <UserSettingsProvider>
        <AvailabilityScopeProvider>
          <div className="min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6">
            {children()}
          </div>
        </AvailabilityScopeProvider>
      </UserSettingsProvider>
    </AppProviders>
  )
}

function createSeededStateIdentity(
  storyId: string,
  parameters: StorybookParameters,
): SeededStateIdentity {
  return createStorybookPersistedStateIdentity(storyId, {
    developerMode: parameters.developerMode,
    seedCorruptedSettings: parameters.seedCorruptedSettings,
    settings: parameters.settings,
  })
}
