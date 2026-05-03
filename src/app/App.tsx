import { useState } from 'react'

import { type CableId, DEFAULT_CABLE_ID } from '../domain/cable'
import { AvailabilityScreen } from '../features/availability/components/AvailabilityScreen'
import { SettingsScreen } from '../features/settings/components/SettingsScreen'

type ScreenId = 'availability' | 'settings'

const SCREEN_NAV_ITEMS = [
  { id: 'availability', label: 'Availability' },
  { id: 'settings', label: 'Settings' },
] as const satisfies ReadonlyArray<{ id: ScreenId; label: string }>

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('availability')
  const [selectedCable, setSelectedCable] = useState<CableId>(DEFAULT_CABLE_ID)

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
            onClick={() => setActiveScreen(id)}
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
