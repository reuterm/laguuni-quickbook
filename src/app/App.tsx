import { useState } from 'react'

import { type CableId, SUPPORTED_CABLES } from '../domain/cable'
import { AvailabilityScreen } from '../features/availability/components/AvailabilityScreen'
import { SettingsScreen } from '../features/settings/components/SettingsScreen'

type ScreenId = 'availability' | 'settings'

const SCREEN_LABELS: Record<ScreenId, string> = {
  availability: 'Availability',
  settings: 'Settings',
}

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('availability')
  const [selectedCable, setSelectedCable] = useState<CableId>(
    SUPPORTED_CABLES[0].id,
  )

  return (
    <div className="app-shell">
      <nav className="screen-nav" aria-label="Primary">
        {(Object.entries(SCREEN_LABELS) as Array<[ScreenId, string]>).map(
          ([screenId, label]) => (
            <button
              key={screenId}
              type="button"
              className={`screen-nav__button${
                activeScreen === screenId ? ' screen-nav__button--active' : ''
              }`}
              onClick={() => setActiveScreen(screenId)}
              aria-pressed={activeScreen === screenId}
            >
              {label}
            </button>
          ),
        )}
      </nav>

      <main className="app-main">
        {activeScreen === 'availability' ? (
          <AvailabilityScreen
            selectedCable={selectedCable}
            onSelectCable={setSelectedCable}
          />
        ) : (
          <SettingsScreen />
        )}
      </main>
    </div>
  )
}

export default App
