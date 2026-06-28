import type { Decorator } from '@storybook/react'
import { useState } from 'react'

import { AppProviders } from '../src/app/providers'
import { AvailabilityScopeProvider } from '../src/features/availability/use-availability-scope'
import { UserSettingsProvider } from '../src/features/settings/use-user-settings'
import {
  createStorybookScopedFetchImplementation,
  getStorybookLaguuniOrigin,
  type StorybookLaguuniScenario,
} from './laguuni-handlers'
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
    scenario?: StorybookLaguuniScenario
  }
  seedCorruptedSettings?: boolean
  settings?: StorybookPersistedStateSeed['settings']
}

const DEFAULT_APP_VERSION = 'storybook'
const DEFAULT_AVAILABILITY_REFERENCE_DATE = new Date('2026-05-14T12:00:00')

export const StorybookAppProviders: Decorator = (Story, context) => {
  const parameters = context.parameters as StorybookParameters
  const storybookScenario = parameters.laguuni?.scenario ?? 'booking-enabled'
  const persistedStateIdentity = createStorybookPersistedStateIdentity(
    context.id,
    {
      developerMode: parameters.developerMode,
      seedCorruptedSettings: parameters.seedCorruptedSettings,
      settings: parameters.settings,
    },
  )

  return (
    <SeededStateBoundary
      apiScopeId={context.id}
      key={persistedStateIdentity}
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
  storybookScenario: StorybookLaguuniScenario
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
      apiBaseUrl={getStorybookLaguuniOrigin()}
      appVersion={parameters.appVersion ?? DEFAULT_APP_VERSION}
      availabilityReferenceDate={
        parameters.availabilityReferenceDate ??
        DEFAULT_AVAILABILITY_REFERENCE_DATE
      }
      fetchImplementation={createStorybookScopedFetchImplementation(
        apiScopeId,
        storybookScenario,
      )}
      storage={storage}
    >
      <UserSettingsProvider>
        <AvailabilityScopeProvider>{children()}</AvailabilityScopeProvider>
      </UserSettingsProvider>
    </AppProviders>
  )
}
