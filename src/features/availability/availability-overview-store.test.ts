import { describe, expect, it } from 'vitest'

import { localDate } from '../../../tests/local-date'
import {
  availabilityOverviewReducer,
  canAppendWeek,
  canRefreshDay,
  createInitialAvailabilityOverviewStore,
  createRangeLoadFailedAction,
  createRangeLoadSucceededAction,
  deriveAvailabilityState,
  getInitialAvailabilityRange,
} from './availability-overview-store'
import type {
  AvailabilityDayGroup,
  AvailabilityWeekPage,
} from './availability-service'

describe('availabilityOverviewStore', () => {
  it('derives a ready state by flattening week pages and exposing load-more state', () => {
    const initialRange = getInitialAvailabilityRange(
      new Date('2026-05-14T12:00:00'),
    )
    const firstWeek = createWeekPage('2026-05-11', [
      createDayGroup('2026-05-14'),
    ])
    const secondWeek = createWeekPage('2026-05-18', [
      createDayGroup('2026-05-19'),
    ])
    const store = availabilityOverviewReducer(
      createInitialAvailabilityOverviewStore(initialRange),
      createRangeLoadSucceededAction('replace', initialRange, 0, [
        firstWeek,
        secondWeek,
      ]),
    )

    expect(deriveAvailabilityState(store)).toMatchObject({
      appendErrorMessage: null,
      canLoadMore: true,
      dayGroups: [...firstWeek.dayGroups, ...secondWeek.dayGroups],
      isLoadingMore: false,
      status: 'ready',
      weekPages: [firstWeek, secondWeek],
    })
  })

  it('keeps week pages sorted and updates the loaded range after append success', () => {
    const initialRange = getInitialAvailabilityRange(
      new Date('2026-05-14T12:00:00'),
    )
    const initialStore = availabilityOverviewReducer(
      createInitialAvailabilityOverviewStore(initialRange),
      createRangeLoadSucceededAction('replace', initialRange, 0, [
        createWeekPage('2026-05-18', [createDayGroup('2026-05-19')]),
        createWeekPage('2026-05-11', [createDayGroup('2026-05-14')]),
      ]),
    )
    const appendingStore = availabilityOverviewReducer(initialStore, {
      rangeVersion: 0,
      type: 'appendStarted',
    })

    const nextStore = availabilityOverviewReducer(appendingStore, {
      rangeVersion: 0,
      type: 'appendSucceeded',
      weekPage: createWeekPage('2026-05-25', [createDayGroup('2026-05-29')]),
    })

    expect(nextStore.loadedRange.weekCount).toBe(3)
    expect(nextStore.isAppending).toBe(false)
    expect(nextStore.weekPages.map((weekPage) => weekPage.weekId)).toEqual([
      '2026-05-11',
      '2026-05-18',
      '2026-05-25',
    ])
  })

  it('ignores stale day refresh results while decrementing active refresh count', () => {
    const initialRange = getInitialAvailabilityRange(
      new Date('2026-05-14T12:00:00'),
    )
    const loadedStore = availabilityOverviewReducer(
      createInitialAvailabilityOverviewStore(initialRange),
      createRangeLoadSucceededAction('replace', initialRange, 0, [
        createWeekPage('2026-05-11', [createDayGroup('2026-05-14')]),
      ]),
    )
    const refreshingStore = availabilityOverviewReducer(loadedStore, {
      date: localDate('2026-05-14'),
      dayRefreshToken: 2,
      rangeVersion: 0,
      type: 'refreshDayStarted',
    })

    const nextStore = availabilityOverviewReducer(refreshingStore, {
      date: localDate('2026-05-14'),
      dayGroup: createDayGroup('2026-05-14', { freeCapacity: 1 }),
      dayRefreshToken: 1,
      rangeVersion: 0,
      type: 'refreshDaySucceeded',
    })

    expect(nextStore.activeDayRefreshCount).toBe(0)
    expect(nextStore.weekPages[0]?.dayGroups[0]?.slots[0]?.freeCapacity).toBe(4)
  })

  it('replaces the matching day group and recomputes empty weeks after a day refresh', () => {
    const initialRange = getInitialAvailabilityRange(
      new Date('2026-05-14T12:00:00'),
    )
    const loadedStore = availabilityOverviewReducer(
      createInitialAvailabilityOverviewStore(initialRange),
      createRangeLoadSucceededAction('replace', initialRange, 0, [
        createWeekPage('2026-05-11', [createDayGroup('2026-05-14')]),
      ]),
    )
    const refreshingStore = availabilityOverviewReducer(loadedStore, {
      date: localDate('2026-05-14'),
      dayRefreshToken: 1,
      rangeVersion: 0,
      type: 'refreshDayStarted',
    })

    const nextStore = availabilityOverviewReducer(refreshingStore, {
      date: localDate('2026-05-14'),
      dayGroup: createDayGroup('2026-05-14', { slots: [] }),
      dayRefreshToken: 1,
      rangeVersion: 0,
      type: 'refreshDaySucceeded',
    })

    expect(nextStore.activeDayRefreshCount).toBe(0)
    expect(nextStore.weekPages[0]?.hasBookableSlots).toBe(false)
    expect(nextStore.weekPages[0]?.dayGroups[0]?.slots).toEqual([])
  })

  it('derives an error state with a fallback message when range loading fails', () => {
    const initialRange = getInitialAvailabilityRange(
      new Date('2026-05-14T12:00:00'),
    )
    const store = availabilityOverviewReducer(
      createInitialAvailabilityOverviewStore(initialRange),
      createRangeLoadFailedAction('replace', initialRange, 0, ''),
    )

    expect(deriveAvailabilityState(store)).toEqual({
      isLoadingMore: false,
      message: '',
      status: 'error',
    })
  })

  it('blocks append and day refresh while a range refresh is active', () => {
    const initialRange = getInitialAvailabilityRange(
      new Date('2026-05-14T12:00:00'),
    )
    const loadedStore = availabilityOverviewReducer(
      createInitialAvailabilityOverviewStore(initialRange),
      createRangeLoadSucceededAction('replace', initialRange, 0, [
        createWeekPage('2026-05-11', [createDayGroup('2026-05-14')]),
      ]),
    )
    const refreshingStore = availabilityOverviewReducer(loadedStore, {
      range: loadedStore.loadedRange,
      rangeVersion: 1,
      type: 'refreshRangeStarted',
    })

    expect(canAppendWeek(refreshingStore, false)).toBe(false)
    expect(canRefreshDay(refreshingStore)).toBe(false)
  })
})

function createWeekPage(
  weekId: string,
  dayGroups: readonly AvailabilityDayGroup[],
): AvailabilityWeekPage {
  return {
    dayGroups,
    hasBookableSlots: dayGroups.some((dayGroup) => dayGroup.slots.length > 0),
    weekId,
    weekStartDate: new Date(`${weekId}T00:00:00`),
  }
}

function createDayGroup(
  date: string,
  overrides?: {
    freeCapacity?: number
    slots?: AvailabilityDayGroup['slots']
  },
): AvailabilityDayGroup {
  return {
    date: localDate(date),
    displayDate: `Display ${date}`,
    slots: overrides?.slots ?? [
      {
        endTime: '16:00',
        freeCapacity: overrides?.freeCapacity ?? 4,
        id: `${date}-slot-1`,
        selection: {
          cableId: 'pro',
          date: localDate(date),
          endTime: '16:00',
          startTime: '15:00',
        },
        startTime: '15:00',
        totalCapacity: 4,
      },
    ],
  }
}
