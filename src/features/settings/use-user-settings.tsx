import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react'

import { useUserSettingsStore } from '../../app/providers'
import type { SettingsRecoveryIssue, UserSettings } from '../../domain/settings'

type UserSettingsController = {
  recoveryIssue: SettingsRecoveryIssue | null
  saveSettings: (settings: UserSettings) => void
  settings: UserSettings
}

const UserSettingsContext = createContext<UserSettingsController | null>(null)

export function UserSettingsProvider({ children }: PropsWithChildren) {
  const settingsStore = useUserSettingsStore()
  const [initialSettingsState] = useState(() => settingsStore.loadState())
  const [settings, setSettings] = useState(initialSettingsState.settings)
  const [recoveryIssue, setRecoveryIssue] = useState(
    initialSettingsState.recoveryIssue,
  )

  const saveSettings = useCallback(
    (nextSettings: UserSettings) => {
      settingsStore.save(nextSettings)
      setSettings(nextSettings)
      setRecoveryIssue(null)
    },
    [settingsStore],
  )

  const value = useMemo<UserSettingsController>(
    () => ({
      recoveryIssue,
      saveSettings,
      settings,
    }),
    [recoveryIssue, saveSettings, settings],
  )

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  )
}

export function useUserSettings(): UserSettingsController {
  const userSettings = use(UserSettingsContext)

  if (userSettings === null) {
    throw new Error('User settings must be used within UserSettingsProvider')
  }

  return userSettings
}
