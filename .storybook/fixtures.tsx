import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

export function MatchMediaState({
  children,
  matches,
}: {
  children: ReactNode
  matches: boolean
}) {
  const [appliedMatches, setAppliedMatches] = useState<boolean | null>(null)

  useEffect(() => {
    const originalMatchMedia = window.matchMedia

    window.matchMedia = (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener() {},
      addListener() {},
      dispatchEvent() {
        return true
      },
      removeEventListener() {},
      removeListener() {},
    })

    setAppliedMatches(matches)

    return () => {
      window.matchMedia = originalMatchMedia
    }
  }, [matches])

  return appliedMatches === matches ? children : null
}

export function StorySurface({
  children,
  className = 'space-y-6',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`w-full ${className}`}>{children}</div>
}
