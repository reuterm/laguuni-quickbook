import type { CableId } from '../domain/cable'
import type { SettingsRecoveryIssue, UserSettings } from '../domain/settings'
import { AvailabilityScreen } from '../features/availability/components/AvailabilityScreen'
import { SettingsScreen } from '../features/settings/components/SettingsScreen'
import type { ScreenId } from './use-app-shell-state'

const SCREEN_NAV_ITEMS = [
  { id: 'availability', label: 'Availability' },
  { id: 'settings', label: 'Settings' },
] as const satisfies ReadonlyArray<{ id: ScreenId; label: string }>

type AppShellProps = {
  activeScreen: ScreenId
  onSaveSettings: (settings: UserSettings) => void
  onSelectCable: (cableId: CableId) => void
  onSelectScreen: (screenId: ScreenId) => void
  selectedCable: CableId
  settings: UserSettings
  settingsRecoveryIssue: SettingsRecoveryIssue | null
}

export function AppShell({
  activeScreen,
  onSaveSettings,
  onSelectCable,
  onSelectScreen,
  selectedCable,
  settings,
  settingsRecoveryIssue,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <nav className="screen-nav" aria-label="Primary">
        {SCREEN_NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`screen-nav__button${
              activeScreen === id ? ' screen-nav__button--active' : ''
            }`}
            onClick={() => onSelectScreen(id)}
            aria-pressed={activeScreen === id}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeScreen === 'availability' ? (
          <AvailabilityScreen
            selectedCable={selectedCable}
            onSelectCable={onSelectCable}
          />
        ) : (
          <SettingsScreen
            recoveryIssue={settingsRecoveryIssue}
            settings={settings}
            onSave={onSaveSettings}
          />
        )}
      </main>
    </div>
  )
}
