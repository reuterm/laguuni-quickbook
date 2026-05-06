import { useState } from 'react'

import {
  loadDeveloperModeEnabled,
  saveDeveloperModeEnabled,
} from './developer-mode-storage'

const DEV_MODE_TAP_THRESHOLD = 7

type UseDeveloperModeResult = {
  developerModeEnabled: boolean
  disableDeveloperMode: () => void
  registerVersionTap: () => void
  resetDeveloperModeUnlockProgress: () => void
}

export function useDeveloperMode(): UseDeveloperModeResult {
  const [developerModeEnabled, setDeveloperModeEnabled] = useState(() =>
    loadDeveloperModeEnabled(),
  )
  const [_unlockTapCount, setUnlockTapCount] = useState(0)

  function registerVersionTap() {
    if (developerModeEnabled) {
      return
    }

    setUnlockTapCount((currentCount) => {
      const nextCount = currentCount + 1

      if (nextCount < DEV_MODE_TAP_THRESHOLD) {
        return nextCount
      }

      saveDeveloperModeEnabled(true)
      setDeveloperModeEnabled(true)

      return 0
    })
  }

  function disableDeveloperMode() {
    saveDeveloperModeEnabled(false)
    setDeveloperModeEnabled(false)
    setUnlockTapCount(0)
  }

  function resetDeveloperModeUnlockProgress() {
    setUnlockTapCount(0)
  }

  return {
    developerModeEnabled,
    disableDeveloperMode,
    registerVersionTap,
    resetDeveloperModeUnlockProgress,
  }
}
