import type { Decorator } from '@storybook/react'
import { useEffect, useState } from 'react'

import { AppProviders } from '../src/app/providers'
import { AvailabilityScopeProvider } from '../src/features/availability/use-availability-scope'
import { UserSettingsProvider } from '../src/features/settings/use-user-settings'
import { getStorybookLaguuniApiBaseUrl } from './laguuni-handlers'
import {
  clearPersistedStorybookState,
  enableStorybookDeveloperMode,
  saveStorybookUserSettings,
  writeStorybookCorruptedSettings,
} from './storybook-persisted-state'

type StorybookParameters = {
  appVersion?: string
  availabilityReferenceDate?: Date
  developerMode?: boolean
  seedCorruptedSettings?: boolean
  settings?: Parameters<typeof saveStorybookUserSettings>[0]
}

const DEFAULT_APP_VERSION = 'storybook'
const DEFAULT_AVAILABILITY_REFERENCE_DATE = new Date('2026-05-14T12:00:00')

export const StorybookAppProviders: Decorator = (Story, context) => {
  const parameters = context.parameters as StorybookParameters
  const stateKey = JSON.stringify({
    appVersion: parameters.appVersion,
    availabilityReferenceDate:
      parameters.availabilityReferenceDate?.toISOString() ?? null,
    developerMode: parameters.developerMode ?? false,
    seedCorruptedSettings: parameters.seedCorruptedSettings ?? false,
    settings: parameters.settings ?? null,
  })

  return (
    <SeededStateBoundary key={stateKey} parameters={parameters}>
      <AppProviders
        apiBaseUrl={getStorybookLaguuniApiBaseUrl()}
        appVersion={parameters.appVersion ?? DEFAULT_APP_VERSION}
        availabilityReferenceDate={
          parameters.availabilityReferenceDate ??
          DEFAULT_AVAILABILITY_REFERENCE_DATE
        }
      >
        <UserSettingsProvider>
          <AvailabilityScopeProvider>
            <div className="min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6">
              <Story />
            </div>
          </AvailabilityScopeProvider>
        </UserSettingsProvider>
      </AppProviders>
    </SeededStateBoundary>
  )
}

function SeededStateBoundary({
  children,
  parameters,
}: {
  children: React.ReactNode
  parameters: StorybookParameters
}) {
  const [isReady, setIsReady] = useState(false)
  const developerMode = parameters.developerMode ?? false
  const seedCorruptedSettings = parameters.seedCorruptedSettings ?? false
  const settings = parameters.settings

  useEffect(() => {
    clearPersistedStorybookState(window.localStorage)

    if (seedCorruptedSettings) {
      writeStorybookCorruptedSettings(window.localStorage)
    } else if (settings) {
      saveStorybookUserSettings(settings, window.localStorage)
    }

    if (developerMode) {
      enableStorybookDeveloperMode(window.localStorage)
    }

    setIsReady(true)

    return () => {
      setIsReady(false)
      clearPersistedStorybookState(window.localStorage)
    }
  }, [developerMode, seedCorruptedSettings, settings])

  return isReady ? children : null
}
