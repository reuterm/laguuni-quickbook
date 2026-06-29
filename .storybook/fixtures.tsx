import type { Decorator } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { useLayoutEffect, useMemo, useState } from 'react'

type MatchMediaOverride = {
  key: symbol
  matches: boolean
  query: string
}

const activeMatchMediaOverrides: MatchMediaOverride[] = []
let originalWindowMatchMedia: Window['matchMedia'] | null = null

export function withMatchMedia(query: string, matches: boolean): Decorator {
  return (Story) => (
    <ScopedMatchMedia query={query} matches={matches}>
      <Story />
    </ScopedMatchMedia>
  )
}

function installScopedMatchMedia(override: MatchMediaOverride) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  assertNoConflictingMatchMediaOverride(override)

  if (!originalWindowMatchMedia) {
    originalWindowMatchMedia = window.matchMedia
  }

  activeMatchMediaOverrides.push(override)
  window.matchMedia = createOverriddenMatchMedia()

  return () => {
    const overrideIndex = activeMatchMediaOverrides.findIndex(
      (activeOverride) => activeOverride.key === override.key,
    )

    if (overrideIndex !== -1) {
      activeMatchMediaOverrides.splice(overrideIndex, 1)
    }

    if (activeMatchMediaOverrides.length === 0) {
      window.matchMedia = originalWindowMatchMedia
      originalWindowMatchMedia = null

      return
    }

    window.matchMedia = createOverriddenMatchMedia()
  }
}

function assertNoConflictingMatchMediaOverride(
  nextOverride: MatchMediaOverride,
) {
  const conflictingOverride = activeMatchMediaOverrides.find(
    (activeOverride) =>
      activeOverride.query === nextOverride.query &&
      activeOverride.matches !== nextOverride.matches,
  )

  if (!conflictingOverride) {
    return
  }

  throw new Error(
    `Conflicting matchMedia override for query "${nextOverride.query}": ${conflictingOverride.matches} is already active, cannot also apply ${nextOverride.matches} on the same page.`,
  )
}

function ScopedMatchMedia({
  children,
  matches,
  query,
}: {
  children: ReactNode
  matches: boolean
  query: string
}) {
  const overrideIdentity = useMemo(
    () => JSON.stringify({ matches, query }),
    [matches, query],
  )
  const [appliedOverrideIdentity, setAppliedOverrideIdentity] = useState<
    string | null
  >(null)

  useLayoutEffect(() => {
    const cleanup = installScopedMatchMedia({
      key: Symbol(query),
      matches,
      query,
    })

    setAppliedOverrideIdentity(overrideIdentity)

    return () => {
      cleanup()
    }
  }, [matches, overrideIdentity, query])

  return appliedOverrideIdentity === overrideIdentity ? children : null
}

function createOverriddenMatchMedia(): Window['matchMedia'] {
  const fallbackMatchMedia = originalWindowMatchMedia ?? window.matchMedia

  return (query: string) => {
    for (
      let index = activeMatchMediaOverrides.length - 1;
      index >= 0;
      index -= 1
    ) {
      const override = activeMatchMediaOverrides[index]

      if (override.query === query) {
        return createStaticMediaQueryList(query, override.matches)
      }
    }

    return fallbackMatchMedia(query)
  }
}

function createStaticMediaQueryList(
  media: string,
  matches: boolean,
): MediaQueryList {
  return {
    matches,
    media,
    onchange: null,
    addEventListener() {},
    addListener() {},
    dispatchEvent() {
      return true
    },
    removeEventListener() {},
    removeListener() {},
  }
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
