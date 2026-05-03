import { useState } from 'react'

import { type CableId, DEFAULT_CABLE_ID } from '../domain/cable'
import type { SettingsRecoveryIssue, UserSettings } from '../domain/settings'
import type { UserSettingsStore } from '../lib/storage/local-storage'

export type ScreenId = 'availability' | 'settings'

export type AppShellState = {
  activeScreen: ScreenId
  saveSettings: (settings: UserSettings) => void
  selectCable: (cableId: CableId) => void
  selectScreen: (screenId: ScreenId) => void
  selectedCable: CableId
  settings: UserSettings
  settingsRecoveryIssue: SettingsRecoveryIssue | null
}

export function useAppShellState(
  settingsStore: UserSettingsStore,
): AppShellState {
  const [initialSettingsState] = useState(() => settingsStore.loadState())
  const [activeScreen, setActiveScreen] = useState<ScreenId>('availability')
  const [selectedCable, setSelectedCable] = useState<CableId>(
    initialSettingsState.settings.defaultCable ?? DEFAULT_CABLE_ID,
  )
  const [settings, setSettings] = useState(initialSettingsState.settings)
  const [settingsRecoveryIssue, setSettingsRecoveryIssue] = useState(
    initialSettingsState.recoveryIssue,
  )

  function saveSettings(nextSettings: UserSettings) {
    settingsStore.save(nextSettings)
    setSettings(nextSettings)
    setSettingsRecoveryIssue(null)
  }

  return {
    activeScreen,
    saveSettings,
    selectCable: setSelectedCable,
    selectScreen: setActiveScreen,
    selectedCable,
    settings,
    settingsRecoveryIssue,
  }
}
