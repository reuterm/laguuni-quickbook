import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { localDate } from '../../../../tests/local-date'
import { UserSettingsProvider } from '../../settings/use-user-settings'
import type { AvailabilityDayGroup } from '../availability-service'
import type { AvailabilityState } from '../use-availability-overview'
import { AvailabilityOverviewContent } from './AvailabilityOverviewContent'

type AvailabilityOverviewProps = Parameters<
  typeof AvailabilityOverviewContent
>[0]

describe('AvailabilityOverviewContent', () => {
  afterEach(() => {
    cleanup()
    intersectionObserverController.reset()
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    })
    vi.unstubAllGlobals()
    vi.stubGlobal(
      'IntersectionObserver',
      intersectionObserverController.factory,
    )
  })

  it('renders the loading state', () => {
    renderContent({
      isLoadingMore: false,
      status: 'loading',
    })

    expect(screen.getByText('Loading availability…')).toBeInTheDocument()
  })

  it('renders a calendar-shaped loading state when calendar view is enabled', () => {
    stubMatchMedia(false)

    renderContent(
      {
        isLoadingMore: false,
        status: 'loading',
      },
      undefined,
      { availabilityView: 'calendar' },
    )

    expect(screen.getByText('Loading availability…')).toBeInTheDocument()
    expect(
      screen.queryByText('Refreshing availability…'),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(screen.getByText('11 May - 17 May')).toBeInTheDocument()
    expect(screen.getByText('18 May - 24 May')).toBeInTheDocument()
  })

  it('keeps rendered slots visible while refreshing availability', () => {
    renderContent(createLoadedState('refreshing'))

    expect(screen.getByText('Refreshing availability…')).toBeInTheDocument()
    expect(screen.getByText('3/4')).toBeInTheDocument()
    expect(screen.queryByText('Loading availability…')).not.toBeInTheDocument()
  })

  it('renders weekly matrix tables when the saved view is calendar', () => {
    renderContent(
      createLoadedState('ready'),
      {
        bookingActionMode: 'enabled',
        onBookSelection: vi.fn(),
      },
      { availabilityView: 'calendar' },
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('11 May - 17 May')).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: /Thu 14 May 1 slot/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('columnheader', { name: /Mon/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: '15:00' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Book 15:00-16:00, 3/4 spots free',
      }),
    ).toBeInTheDocument()
  })

  it('renders API errors as alerts', () => {
    renderContent({
      isLoadingMore: false,
      message: 'Fixture outage',
      status: 'error',
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Fixture outage')
  })

  it('renders a cable-specific empty state in card view', () => {
    renderContent(createLoadedState('ready', createEmptyDayGroups()))

    expect(
      screen.getByText(/No bookable one-hour slots are available for Pro/),
    ).toBeInTheDocument()
  })

  it('renders a cable-specific empty state in calendar view when all weeks are empty', () => {
    renderContent(
      createLoadedState('ready', createEmptyDayGroups()),
      { bookingActionMode: 'hidden' },
      { availabilityView: 'calendar' },
    )

    expect(screen.getByText('No bookable slots in range')).toBeInTheDocument()
  })

  it('hides booking actions in read-only mode', () => {
    renderContent(createLoadedState('ready'), { bookingActionMode: 'hidden' })

    expect(
      screen.queryByRole('button', { name: 'Book' }),
    ).not.toBeInTheDocument()
  })

  it('renders bookable slot groups and wires the book action', () => {
    const onBookSelection = vi.fn()

    renderContent(createLoadedState('ready'), {
      bookingActionMode: 'enabled',
      onBookSelection,
    })

    expect(screen.getByRole('button', { name: 'Book' })).toBeEnabled()
  })

  it('disables booking actions while a booking is already in progress', () => {
    renderContent(createLoadedState('ready'), {
      bookingActionMode: 'disabled',
      onBookSelection: vi.fn(),
    })

    expect(screen.getByRole('button', { name: 'Book' })).toBeDisabled()
  })

  it('shows a bottom loading state while appending another week', () => {
    renderContent(
      createLoadedState('ready', undefined, { isLoadingMore: true }),
    )

    expect(screen.getByText('Loading another week…')).toHaveClass('sr-only')
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('triggers loading more when the sentinel enters the viewport', async () => {
    const onLoadMore = vi.fn(async () => {})

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 128,
    })

    renderContent(
      createLoadedState('ready'),
      {
        bookingActionMode: 'enabled',
        onBookSelection: vi.fn(),
      },
      undefined,
      onLoadMore,
    )

    fireEvent.scroll(window)
    intersectionObserverController.triggerLastObserved(true)

    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalledTimes(1)
    })
  })

  it('does not auto-load before the user has scrolled', () => {
    const onLoadMore = vi.fn(async () => {})

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    })

    renderContent(createLoadedState('ready'), undefined, undefined, onLoadMore)

    intersectionObserverController.triggerLastObserved(true)

    expect(onLoadMore).toHaveBeenCalledTimes(0)
  })

  it('does not auto-load repeatedly without additional scrolling', () => {
    const onLoadMore = vi.fn(async () => {})

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 128,
    })

    renderContent(createLoadedState('ready'), undefined, undefined, onLoadMore)

    fireEvent.scroll(window)
    intersectionObserverController.triggerLastObserved(true)
    intersectionObserverController.triggerLastObserved(true)

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('auto-loads again after the user scrolls farther', () => {
    const onLoadMore = vi.fn(async () => {})

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 128,
    })

    renderContent(createLoadedState('ready'), undefined, undefined, onLoadMore)

    fireEvent.scroll(window)
    intersectionObserverController.triggerLastObserved(true)

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 256,
    })

    fireEvent.scroll(window)
    intersectionObserverController.triggerLastObserved(true)

    expect(onLoadMore).toHaveBeenCalledTimes(2)
  })

  it('does not auto-load when the hard stop is reached', () => {
    const onLoadMore = vi.fn(async () => {})

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 128,
    })

    renderContent(
      createLoadedState('ready', undefined, { canLoadMore: false }),
      undefined,
      undefined,
      onLoadMore,
    )

    fireEvent.scroll(window)

    expect(intersectionObserverController.getObservedElementCount()).toBe(0)
    expect(onLoadMore).toHaveBeenCalledTimes(0)
  })

  it('renders an inline retry alert when loading the next week fails', async () => {
    const onLoadMore = vi.fn(async () => {})

    renderContent(
      createLoadedState('ready', undefined, {
        appendErrorMessage: 'Append failed',
      }),
      undefined,
      undefined,
      onLoadMore,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Append failed')

    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalledTimes(1)
    })
  })

  it('does not auto-load while an append error is present', () => {
    const onLoadMore = vi.fn(async () => {})

    renderContent(
      createLoadedState('ready', undefined, {
        appendErrorMessage: 'Append failed',
      }),
      undefined,
      undefined,
      onLoadMore,
    )

    expect(onLoadMore).toHaveBeenCalledTimes(0)
  })
})

function renderContent(
  availabilityState: AvailabilityState,
  bookingProps?: {
    bookingActionMode?: 'disabled' | 'enabled' | 'hidden'
    onBookSelection?: AvailabilityOverviewProps['onBookSelection']
  },
  settingsOverrides?: {
    availabilityView?: 'cards' | 'calendar'
  },
  onLoadMore: () => Promise<void> = async () => {},
) {
  window.localStorage.setItem(
    'laguuni.quickbook.settings',
    JSON.stringify({
      availabilityView: settingsOverrides?.availabilityView ?? 'cards',
      defaultCable: null,
      email: '',
      name: '',
      phone: '',
      seasonPassCode: '',
      version: 1,
    }),
  )

  if (bookingProps?.bookingActionMode === 'hidden') {
    return render(
      <TestProviders>
        <AvailabilityOverviewContent
          activeCableLabel="Pro"
          availabilityState={availabilityState}
          bookingActionMode="hidden"
          onLoadMore={onLoadMore}
        />
      </TestProviders>,
    )
  }

  const bookingActionMode =
    bookingProps?.bookingActionMode === 'disabled' ? 'disabled' : 'enabled'

  return render(
    <TestProviders>
      <AvailabilityOverviewContent
        activeCableLabel="Pro"
        availabilityState={availabilityState}
        bookingActionMode={bookingActionMode}
        onLoadMore={onLoadMore}
        onBookSelection={bookingProps?.onBookSelection ?? vi.fn()}
      />
    </TestProviders>,
  )
}

function createLoadedState(
  status: 'ready' | 'refreshing',
  dayGroups: readonly AvailabilityDayGroup[] = [createBookableDayGroup()],
  overrides: Partial<
    Extract<AvailabilityState, { status: 'ready' | 'refreshing' }>
  > = {},
): AvailabilityState {
  return {
    appendErrorMessage: null,
    canLoadMore: true,
    dayGroups,
    isLoadingMore: false,
    status,
    weekPages: [createWeekPage(dayGroups)],
    ...overrides,
  }
}

function createBookableDayGroup() {
  return {
    date: localDate('2026-05-14'),
    displayDate: 'Thu 14 May',
    slots: [
      {
        endTime: '16:00',
        freeCapacity: 3,
        id: '2026-05-14-900',
        selection: {
          cableId: 'pro' as const,
          date: localDate('2026-05-14'),
          endTime: '16:00',
          startTime: '15:00',
        },
        startTime: '15:00',
        totalCapacity: 4,
      },
    ],
  }
}

function createEmptyDayGroups(): readonly AvailabilityDayGroup[] {
  return [
    {
      date: localDate('2026-05-11'),
      displayDate: 'Mon 11 May',
      slots: [],
    },
    {
      date: localDate('2026-05-12'),
      displayDate: 'Tue 12 May',
      slots: [],
    },
    {
      date: localDate('2026-05-13'),
      displayDate: 'Wed 13 May',
      slots: [],
    },
    {
      date: localDate('2026-05-14'),
      displayDate: 'Thu 14 May',
      slots: [],
    },
    {
      date: localDate('2026-05-15'),
      displayDate: 'Fri 15 May',
      slots: [],
    },
    {
      date: localDate('2026-05-16'),
      displayDate: 'Sat 16 May',
      slots: [],
    },
    {
      date: localDate('2026-05-17'),
      displayDate: 'Sun 17 May',
      slots: [],
    },
  ]
}

function createWeekPage(dayGroups: readonly AvailabilityDayGroup[]) {
  return {
    dayGroups,
    hasBookableSlots: dayGroups.some((dayGroup) => dayGroup.slots.length > 0),
    weekId: '2026-05-11',
    weekStartDate: new Date('2026-05-11T00:00:00'),
  }
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  window.matchMedia = globalThis.matchMedia
}

function TestProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders
      apiBaseUrl="https://shop.laguuniin.fi"
      appVersion="test-version"
      availabilityReferenceDate={new Date('2026-05-14T12:00:00')}
    >
      <UserSettingsProvider>{children}</UserSettingsProvider>
    </AppProviders>
  )
}

const intersectionObserverController = createIntersectionObserverController()

vi.stubGlobal('IntersectionObserver', intersectionObserverController.factory)

function createIntersectionObserverController() {
  const observedElements: Element[] = []
  let callback: IntersectionObserverCallback | null = null

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = '0px'
    readonly scrollMargin = '0px'
    readonly thresholds = [0]

    constructor(nextCallback: IntersectionObserverCallback) {
      callback = nextCallback
    }

    disconnect() {
      observedElements.splice(0)
    }

    observe(element: Element) {
      observedElements.push(element)
    }

    takeRecords(): IntersectionObserverEntry[] {
      return []
    }

    unobserve() {}
  }

  return {
    factory: MockIntersectionObserver,
    getObservedElementCount() {
      return observedElements.length
    },
    reset() {
      observedElements.splice(0)
      callback = null
    },
    triggerLastObserved(isIntersecting: boolean) {
      const target = observedElements.at(-1)

      if (!(target instanceof Element) || callback === null) {
        throw new Error('Expected an observed element')
      }

      callback(
        [
          {
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRatio: isIntersecting ? 1 : 0,
            intersectionRect: target.getBoundingClientRect(),
            isIntersecting,
            rootBounds: null,
            target,
            time: 0,
          } satisfies IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      )
    },
  }
}
