import { Settings2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { AvailabilityScreen } from '../features/availability/components/AvailabilityScreen'
import { AvailabilityScopeProvider } from '../features/availability/use-availability-scope'
import { SettingsScreen } from '../features/settings/components/SettingsScreen'
import { UserSettingsProvider } from '../features/settings/use-user-settings'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <UserSettingsProvider>
      <AvailabilityScopeProvider>
        <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-8 px-4 py-5 sm:px-6 sm:py-8">
          <header>
            <SectionHeader
              eyebrow="Laguuni Quickbook"
              title="Book your next wake slot"
              titleAs="h1"
              titleClassName="text-2xl sm:text-3xl"
              description="Fast mobile-first booking with local-only details that stay on this device."
              descriptionClassName="max-w-xl"
              contentClassName="max-w-2xl"
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full px-3"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings2 className="size-4" />
                  Settings
                </Button>
              }
            />
          </header>

          <main className="flex-1">
            <AvailabilityScreen
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
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
