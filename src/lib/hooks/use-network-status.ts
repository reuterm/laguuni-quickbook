import { useSyncExternalStore } from 'react'

export function useNetworkStatus() {
  return useSyncExternalStore(subscribeToNetworkStatus, getSnapshot, () => true)
}

function subscribeToNetworkStatus(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener('online', onStoreChange)
  window.addEventListener('offline', onStoreChange)

  return () => {
    window.removeEventListener('online', onStoreChange)
    window.removeEventListener('offline', onStoreChange)
  }
}

function getSnapshot() {
  if (typeof navigator === 'undefined') {
    return true
  }

  return navigator.onLine
}
