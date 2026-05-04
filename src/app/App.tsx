import { Settings2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { AvailabilityScreen } from '../features/availability/components/AvailabilityScreen'
import { AvailabilityScopeProvider } from '../features/availability/use-availability-scope'
import { SettingsScreen } from '../features/settings/components/SettingsScreen'
import { UserSettingsProvider } from '../features/settings/use-user-settings'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <UserSettingsProvider>
      <AvailabilityScopeProvider>
        <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
          <header className="flex items-start justify-between gap-4 border-b border-border/80 pb-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Laguuni Quickbook
              </p>
              <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Book your next wake slot
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Local booking details stay on this device.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings2 className="size-4" />
              Settings
            </Button>
          </header>

          <main className="flex-1">
            <AvailabilityScreen />
          </main>

          <SettingsScreen
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
          />
        </div>
      </AvailabilityScopeProvider>
    </UserSettingsProvider>
  )
}

export default App
