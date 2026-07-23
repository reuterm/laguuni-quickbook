import { describe, expect, it } from 'vitest'

import { localDate } from '../../../../tests/local-date'
import type { AvailabilityDayGroup } from '../availability-service'
import type { AvailabilityState } from '../use-availability-overview'
import { getAvailabilityOverviewContentModel } from './availability-overview-content-model'

describe('getAvailabilityOverviewContentModel', () => {
  it('returns an empty render model while availability is loading', () => {
    const model = getAvailabilityOverviewContentModel(
      {
        isLoadingMore: false,
        skeletonWeekCount: 2,
        status: 'loading',
      },
      'cards',
      false,
    )

    expect(model).toMatchObject({
      hasAppendError: false,
      hasLoadedDayGroups: false,
      hasRenderedAvailability: false,
      isCalendarView: false,
      renderedCardDayGroups: [],
      renderedDayGroups: [],
    })
  })

  it('keeps loaded calendar day groups', () => {
    const dayGroups = [createBookableDayGroup()]

    const model = getAvailabilityOverviewContentModel(
      createLoadedState('ready', dayGroups),
      'calendar',
      false,
    )

    expect(model.isCalendarView).toBe(true)
    expect(model.hasLoadedDayGroups).toBe(true)
    expect(model.hasRenderedAvailability).toBe(true)
    expect(model.renderedDayGroups).toEqual(dayGroups)
    expect(model.renderedCardDayGroups).toEqual(dayGroups)
  })

  it('keeps loaded empty day groups while reporting no rendered availability', () => {
    const emptyDayGroups = [
      createEmptyDayGroup(localDate('2026-05-15')),
      createEmptyDayGroup(localDate('2026-05-16')),
    ]

    const model = getAvailabilityOverviewContentModel(
      createLoadedState('ready', emptyDayGroups),
      'cards',
      false,
    )

    expect(model.hasAppendError).toBe(false)
    expect(model.hasLoadedDayGroups).toBe(true)
    expect(model.hasRenderedAvailability).toBe(false)
    expect(model.isCalendarView).toBe(false)
    expect(model.renderedDayGroups).toEqual(emptyDayGroups)
    expect(model.renderedCardDayGroups).toEqual([])
  })

  it('filters empty day groups for cards while preserving loaded content state', () => {
    const emptyDayGroup = createEmptyDayGroup(localDate('2026-05-15'))
    const bookableDayGroup = createBookableDayGroup()

    const model = getAvailabilityOverviewContentModel(
      createLoadedState('ready', [emptyDayGroup, bookableDayGroup], {
        appendErrorMessage: 'Append failed',
      }),
      'cards',
      false,
    )

    expect(model.hasAppendError).toBe(true)
    expect(model.hasLoadedDayGroups).toBe(true)
    expect(model.hasRenderedAvailability).toBe(true)
    expect(model.renderedDayGroups).toEqual([emptyDayGroup, bookableDayGroup])
    expect(model.renderedCardDayGroups).toEqual([bookableDayGroup])
  })

  it('switches cards to calendar at the calendar breakpoint', () => {
    const model = getAvailabilityOverviewContentModel(
      createLoadedState('ready'),
      'cards',
      true,
    )

    expect(model.isCalendarView).toBe(true)
  })

  it('keeps cards below the calendar breakpoint when cards are preferred', () => {
    const model = getAvailabilityOverviewContentModel(
      createLoadedState('ready'),
      'cards',
      false,
    )

    expect(model.isCalendarView).toBe(false)
  })
})

function createLoadedState(
  status: 'ready',
  dayGroups: readonly AvailabilityDayGroup[] = [createBookableDayGroup()],
  overrides: Partial<Extract<AvailabilityState, { status: 'ready' }>> = {},
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

function createBookableDayGroup(): AvailabilityDayGroup {
  return {
    date: localDate('2026-05-14'),
    displayDate: 'Thu 14 May',
    slots: [
      {
        endTime: '16:00',
        freeCapacity: 3,
        id: '2026-05-14-900',
        selection: {
          cableId: 'pro',
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

function createEmptyDayGroup(
  date: ReturnType<typeof localDate>,
): AvailabilityDayGroup {
  return {
    date,
    displayDate: 'Fri 15 May',
    slots: [],
  }
}

function createWeekPage(dayGroups: readonly AvailabilityDayGroup[]) {
  return {
    dayGroups,
    hasBookableSlots: dayGroups.some((dayGroup) => dayGroup.slots.length > 0),
    weekId: '2026-05-11',
    weekStartDate: new Date('2026-05-11T00:00:00'),
  }
}
