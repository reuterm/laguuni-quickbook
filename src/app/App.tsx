import { AppShell } from './AppShell'
import { useAppServices } from './providers'
import { useAppShellState } from './use-app-shell-state'

function App() {
  const { settingsStore } = useAppServices()
  const appShellState = useAppShellState(settingsStore)

  return (
    <AppShell
      activeScreen={appShellState.activeScreen}
      onSaveSettings={appShellState.saveSettings}
      onSelectCable={appShellState.selectCable}
      onSelectScreen={appShellState.selectScreen}
      selectedCable={appShellState.selectedCable}
      settings={appShellState.settings}
      settingsRecoveryIssue={appShellState.settingsRecoveryIssue}
    />
  )
}

export default App
