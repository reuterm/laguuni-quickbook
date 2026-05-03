import { useState } from 'react'

import { AvailabilityScreen } from '../features/availability/components/AvailabilityScreen'
import { AvailabilityScopeProvider } from '../features/availability/use-availability-scope'
import { SettingsScreen } from '../features/settings/components/SettingsScreen'
import { UserSettingsProvider } from '../features/settings/use-user-settings'

type ScreenId = 'availability' | 'settings'

const SCREEN_NAV_ITEMS = [
  { id: 'availability', label: 'Availability' },
  { id: 'settings', label: 'Settings' },
] as const satisfies ReadonlyArray<{ id: ScreenId; label: string }>

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('availability')

  return (
    <UserSettingsProvider>
      <AvailabilityScopeProvider>
        <div className="app-shell">
          <nav className="screen-nav" aria-label="Primary">
            {SCREEN_NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`screen-nav__button${
                  activeScreen === id ? ' screen-nav__button--active' : ''
                }`}
                onClick={() => setActiveScreen(id)}
                aria-pressed={activeScreen === id}
              >
                {label}
              </button>
            ))}
          </nav>

          <main className="app-main">
            <AvailabilityScreen isActive={activeScreen === 'availability'} />
            <SettingsScreen isActive={activeScreen === 'settings'} />
          </main>
        </div>
      </AvailabilityScopeProvider>
    </UserSettingsProvider>
  )
}

export default App
