import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { withMatchMedia } from './fixtures'

describe('withMatchMedia', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    cleanup()
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  it('does not mutate matchMedia during render before effects commit', () => {
    const fallbackMatchMedia = vi.fn((query: string) =>
      createMediaQueryList(query, false),
    )

    window.matchMedia = fallbackMatchMedia

    const DecoratedStory = withMatchMedia('(min-width: 64rem)', true)(
      createStory('Decorated story'),
      {} as never,
    )

    renderToStaticMarkup(DecoratedStory as never)

    expect(window.matchMedia).toBe(fallbackMatchMedia)
  })

  it('allows overlapping overrides for the same query when matches is the same', () => {
    const fallbackMatchMedia = vi.fn((query: string) =>
      createMediaQueryList(query, false),
    )

    window.matchMedia = fallbackMatchMedia

    const query = '(min-width: 64rem)'

    const { rerender, unmount } = render(
      createElement(MatchMediaHarness, {
        innerMatches: true,
        outerMatches: true,
        query,
      }),
    )

    expect(screen.getByText('decorated story')).toBeVisible()
    expect(window.matchMedia(query).matches).toBe(true)

    rerender(
      createElement(MatchMediaHarness, {
        outerMatches: true,
        query,
      }),
    )

    expect(window.matchMedia(query).matches).toBe(true)

    unmount()

    expect(window.matchMedia).toBe(fallbackMatchMedia)
    expect(window.matchMedia(query).matches).toBe(false)
  })

  it('fails fast when the same query is mounted with conflicting matches values', () => {
    const fallbackMatchMedia = vi.fn((query: string) =>
      createMediaQueryList(query, false),
    )

    window.matchMedia = fallbackMatchMedia

    const query = '(min-width: 64rem)'

    expect(() => {
      render(
        createElement(MatchMediaHarness, {
          innerMatches: false,
          outerMatches: true,
          query,
        }),
      )
    }).toThrow(
      `Conflicting matchMedia override for query "${query}": true is already active, cannot also apply false on the same page.`,
    )

    expect(window.matchMedia).toBe(fallbackMatchMedia)
    expect(window.matchMedia(query).matches).toBe(false)
  })
})

function MatchMediaHarness({
  innerMatches,
  outerMatches,
  query,
}: {
  innerMatches?: boolean
  outerMatches: boolean
  query: string
}) {
  const OuterDecorator = withMatchMedia(query, outerMatches)
  const InnerDecorator =
    innerMatches === undefined ? null : withMatchMedia(query, innerMatches)

  const story = createStory('decorated story')

  if (InnerDecorator) {
    return OuterDecorator(
      () => InnerDecorator(story, {} as never),
      {} as never,
    ) as never
  }

  return OuterDecorator(story, {} as never) as never
}

function createStory(text: string) {
  return function Story() {
    return createElement('div', null, text)
  }
}

function createMediaQueryList(query: string, matches: boolean): MediaQueryList {
  return {
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  }
}
