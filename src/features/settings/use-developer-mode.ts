import { useState } from 'react'

import { useBrowserStorage } from '../../app/providers'
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
  const storage = useBrowserStorage()
  const [developerModeEnabled, setDeveloperModeEnabled] = useState(() =>
    loadDeveloperModeEnabled(storage),
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

      saveDeveloperModeEnabled(true, storage)
      setDeveloperModeEnabled(true)

      return 0
    })
  }

  function disableDeveloperMode() {
    saveDeveloperModeEnabled(false, storage)
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
