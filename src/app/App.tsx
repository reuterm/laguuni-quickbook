import { Settings2 } from 'lucide-react'
import { useState } from 'react'

import { ContentRail } from '@/components/ui/content-rail'
import { Button } from '@/components/ui/button'
import { eyebrowClassName } from '@/components/ui/styles'
import { AvailabilityScreen } from '../features/availability/components/AvailabilityScreen'
import { AvailabilityScopeProvider } from '../features/availability/use-availability-scope'
import {
  AppDiagnosticsBoundary,
  DiagnosticsRuntimeCapture,
} from '../features/diagnostics/runtime-capture'
import { SettingsScreen } from '../features/settings/components/SettingsScreen'
import { UserSettingsProvider } from '../features/settings/use-user-settings'

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <AppDiagnosticsBoundary>
      <DiagnosticsRuntimeCapture />
      <UserSettingsProvider>
        <AvailabilityScopeProvider>
          <ContentRail
            size="page"
            className="flex min-h-svh flex-col gap-8 px-4 py-5 sm:py-8"
          >
            <header>
              <ContentRail className="space-y-3 border-b border-border/70 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <span className={eyebrowClassName}>Laguuni Quickbook</span>
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
                </div>

                <h1 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  Book a one-hour cable slot
                </h1>
              </ContentRail>
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
          </ContentRail>
        </AvailabilityScopeProvider>
      </UserSettingsProvider>
    </AppDiagnosticsBoundary>
  )
}

export default App
