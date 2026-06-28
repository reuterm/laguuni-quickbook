import type { Decorator } from '@storybook/react'
import { useState } from 'react'

import { AppProviders } from '../src/app/providers'
import { AvailabilityScopeProvider } from '../src/features/availability/use-availability-scope'
import { UserSettingsProvider } from '../src/features/settings/use-user-settings'
import { getStorybookLaguuniApiBaseUrl } from './laguuni-handlers'
import {
  createInMemoryBrowserStorage,
  createStorybookPersistedStateIdentity,
  type StorybookPersistedStateSeed,
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
  const storybookScenario =
    parameters.laguuni?.checkoutScenario ?? 'booking-enabled'

  return (
    <SeededStateBoundary
      key={seededStateIdentity}
      apiScopeId={context.id}
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
  parameters,
  storybookScenario,
}: {
  children: () => React.ReactNode
  apiScopeId: string
  parameters: StorybookParameters
  storybookScenario: 'booking-enabled' | 'failed-booking' | 'payment-required'
}) {
  const [storage] = useState(() => {
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
  })

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
