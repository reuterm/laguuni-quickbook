type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

export function isStandaloneMode() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  const iosStandalone =
    (navigator as NavigatorWithStandalone).standalone === true
  const mediaStandalone = window.matchMedia(
    '(display-mode: standalone)',
  ).matches

  return iosStandalone || mediaStandalone
}
