import type { Decorator } from '@storybook/react'
import { useEffect, useState } from 'react'

import { AppProviders } from '../src/app/providers'
import { AvailabilityScopeProvider } from '../src/features/availability/use-availability-scope'
import { UserSettingsProvider } from '../src/features/settings/use-user-settings'
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

const DEFAULT_API_BASE_URL = 'https://shop.laguuniin.fi'
const DEFAULT_APP_VERSION = 'storybook'
const DEFAULT_AVAILABILITY_REFERENCE_DATE = new Date('2026-05-14T12:00:00')
const storybookStorage = createStorybookStorage()

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
        apiBaseUrl={DEFAULT_API_BASE_URL}
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
  const [originalStorybookStorage] = useState(() => window.localStorage)

  useState(() => {
    installStorybookStorage(storybookStorage)
    clearPersistedStorybookState(storybookStorage)

    if (parameters.seedCorruptedSettings) {
      writeStorybookCorruptedSettings(undefined, storybookStorage)
    } else if (parameters.settings) {
      saveStorybookUserSettings(parameters.settings, storybookStorage)
    }

    if (parameters.developerMode) {
      enableStorybookDeveloperMode(storybookStorage)
    }

    return true
  })

  useEffect(() => {
    return () => {
      clearPersistedStorybookState(storybookStorage)
      installStorybookStorage(originalStorybookStorage)
    }
  }, [originalStorybookStorage])

  return children
}

type StorybookStorage = Storage & {
  reset(): void
}

function createStorybookStorage(): StorybookStorage {
  const values = new Map<string, string>()

  return {
    clear() {
      values.clear()
    },
    get length() {
      return values.size
    },
    getItem(key: string) {
      return values.get(key) ?? null
    },
    key(index: number) {
      return [...values.keys()][index] ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    reset() {
      values.clear()
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

function installStorybookStorage(storage: Storage) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  })
}
