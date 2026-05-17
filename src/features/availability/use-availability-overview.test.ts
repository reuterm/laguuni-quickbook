import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CableId } from '@/domain/cable'
import type { DailyAvailabilityWindow } from '@/domain/slot'
import type { LaguuniApi } from '@/lib/api/laguuni-api'
import type { LocalDateString } from '@/lib/date'
import { localDate } from '../../../tests/local-date'
import { useAvailabilityOverview } from './use-availability-overview'

describe('useAvailabilityOverview', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads the current and next calendar week on first load', async () => {
    const { api, getDailyAvailabilityWindow } = createApi()

    const { result } = renderHook(() =>
      useAvailabilityOverview(api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(14)
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      1,
      'pro',
      '2026-05-11',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      14,
      'pro',
      '2026-05-24',
    )
  })

  it('loads exactly one additional week when more availability is requested', async () => {
    const { api, getDailyAvailabilityWindow } = createApi()

    const { result } = renderHook(() =>
      useAvailabilityOverview(api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    await act(async () => {
      await result.current.loadMoreAvailability()
    })

    await waitFor(() => {
      expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(21)
    })

    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      15,
      'pro',
      '2026-05-25',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      21,
      'pro',
      '2026-05-31',
    )

    if (result.current.availabilityState.status !== 'ready') {
      throw new Error('Expected ready availability state')
    }

    expect(result.current.availabilityState.isLoadingMore).toBe(false)
    expect(result.current.availabilityState.canLoadMore).toBe(true)
    expect(result.current.availabilityState.dayGroups).toHaveLength(21)
    expect(result.current.availabilityState.weekPages).toHaveLength(3)
  })

  it('stops loading more availability after four calendar weeks', async () => {
    const { api, getDailyAvailabilityWindow } = createApi()

    const { result } = renderHook(() =>
      useAvailabilityOverview(api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    await act(async () => {
      await result.current.loadMoreAvailability()
    })

    await waitFor(() => {
      expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(21)
    })

    await act(async () => {
      await result.current.loadMoreAvailability()
    })

    await waitFor(() => {
      expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(28)
    })

    await act(async () => {
      await result.current.loadMoreAvailability()
    })

    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(28)

    if (result.current.availabilityState.status !== 'ready') {
      throw new Error('Expected ready availability state')
    }

    expect(result.current.availabilityState.canLoadMore).toBe(false)
    expect(result.current.availabilityState.dayGroups).toHaveLength(28)
    expect(result.current.availabilityState.weekPages).toHaveLength(4)
    expect(result.current.availabilityState.isLoadingMore).toBe(false)
  })

  it('refreshes only the already loaded weeks instead of rebuilding a larger range', async () => {
    const { api, getDailyAvailabilityWindow } = createApi()

    const { result } = renderHook(() =>
      useAvailabilityOverview(api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    await act(async () => {
      await result.current.loadMoreAvailability()
    })

    await waitFor(() => {
      expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(21)
    })

    await act(async () => {
      await result.current.refreshAvailability()
    })

    await waitFor(() => {
      expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(42)
    })

    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      22,
      'pro',
      '2026-05-11',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      42,
      'pro',
      '2026-05-31',
    )
  })

  it('refreshes only the affected day when a single day is updated', async () => {
    const { api, getDailyAvailabilityWindow } = createApi()

    const { result } = renderHook(() =>
      useAvailabilityOverview(api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    await act(async () => {
      await result.current.loadMoreAvailability()
    })

    await waitFor(() => {
      expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(21)
    })

    await act(async () => {
      await result.current.refreshAvailabilityDay(localDate('2026-05-29'))
    })

    await waitFor(() => {
      expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(22)
    })

    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      22,
      'pro',
      '2026-05-29',
    )
  })

  it('keeps existing content visible when refreshing a single day fails', async () => {
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) => {
        if (date === localDate('2026-05-29')) {
          throw new Error('Day refresh failed')
        }

        return createDailyAvailabilityWindow(date)
      },
    )
    const api = createApi(getDailyAvailabilityWindow)

    const { result } = renderHook(() =>
      useAvailabilityOverview(api.api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    await act(async () => {
      await result.current.refreshAvailabilityDay(localDate('2026-05-29'))
    })

    await waitFor(() => {
      if (result.current.availabilityState.status !== 'ready') {
        throw new Error('Expected ready availability state')
      }

      expect(result.current.availabilityState.dayGroups).toHaveLength(14)
    })

    if (result.current.availabilityState.status !== 'ready') {
      throw new Error('Expected ready availability state')
    }

    expect(result.current.availabilityState.appendErrorMessage).toBeNull()
    expect(result.current.availabilityState.weekPages).toHaveLength(2)
  })

  it('ignores a stale same-day refresh after a newer refresh succeeds', async () => {
    let resolveFirstRefresh!: () => void
    let resolveSecondRefresh!: () => void
    let refreshCallCount = 0
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) => {
        if (date === localDate('2026-05-14')) {
          refreshCallCount += 1

          if (refreshCallCount === 2) {
            await new Promise<void>((resolve) => {
              resolveFirstRefresh = resolve
            })

            return createDailyAvailabilityWindow(date, {
              freeCapacity: 3,
            })
          }

          if (refreshCallCount === 3) {
            await new Promise<void>((resolve) => {
              resolveSecondRefresh = resolve
            })

            return createDailyAvailabilityWindow(date, {
              freeCapacity: 1,
            })
          }
        }

        return createDailyAvailabilityWindow(date)
      },
    )
    const api = createApi(getDailyAvailabilityWindow)

    const { result } = renderHook(() =>
      useAvailabilityOverview(api.api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    let firstRefreshPromise: Promise<void>
    let secondRefreshPromise: Promise<void>

    await act(async () => {
      firstRefreshPromise = result.current.refreshAvailabilityDay(
        localDate('2026-05-14'),
      )
      secondRefreshPromise = result.current.refreshAvailabilityDay(
        localDate('2026-05-14'),
      )
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('refreshing')
    })

    resolveSecondRefresh()

    await waitFor(() => {
      if (
        result.current.availabilityState.status !== 'ready' &&
        result.current.availabilityState.status !== 'refreshing'
      ) {
        throw new Error('Expected loaded availability state')
      }

      const refreshedDayGroup = result.current.availabilityState.dayGroups.find(
        (dayGroup) => dayGroup.date === localDate('2026-05-14'),
      )

      expect(refreshedDayGroup?.slots[0]?.freeCapacity).toBe(1)
    })

    resolveFirstRefresh()

    await act(async () => {
      await firstRefreshPromise
      await secondRefreshPromise
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    if (result.current.availabilityState.status !== 'ready') {
      throw new Error('Expected ready availability state')
    }

    const refreshedDayGroup = result.current.availabilityState.dayGroups.find(
      (dayGroup) => dayGroup.date === localDate('2026-05-14'),
    )

    expect(refreshedDayGroup?.slots[0]?.freeCapacity).toBe(1)
  })

  it('ignores a stale same-day refresh failure after a newer refresh succeeds', async () => {
    let rejectFirstRefresh!: (error: Error) => void
    let resolveSecondRefresh!: () => void
    let refreshCallCount = 0
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) => {
        if (date === localDate('2026-05-14')) {
          refreshCallCount += 1

          if (refreshCallCount === 2) {
            await new Promise<never>((_resolve, reject) => {
              rejectFirstRefresh = reject
            })
          }

          if (refreshCallCount === 3) {
            await new Promise<void>((resolve) => {
              resolveSecondRefresh = resolve
            })

            return createDailyAvailabilityWindow(date, {
              freeCapacity: 1,
            })
          }
        }

        return createDailyAvailabilityWindow(date)
      },
    )
    const api = createApi(getDailyAvailabilityWindow)

    const { result } = renderHook(() =>
      useAvailabilityOverview(api.api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    let firstRefreshPromise: Promise<void>
    let secondRefreshPromise: Promise<void>

    await act(async () => {
      firstRefreshPromise = result.current.refreshAvailabilityDay(
        localDate('2026-05-14'),
      )
      secondRefreshPromise = result.current.refreshAvailabilityDay(
        localDate('2026-05-14'),
      )
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('refreshing')
    })

    resolveSecondRefresh()

    await waitFor(() => {
      if (
        result.current.availabilityState.status !== 'ready' &&
        result.current.availabilityState.status !== 'refreshing'
      ) {
        throw new Error('Expected loaded availability state')
      }

      const refreshedDayGroup = result.current.availabilityState.dayGroups.find(
        (dayGroup) => dayGroup.date === localDate('2026-05-14'),
      )

      expect(refreshedDayGroup?.slots[0]?.freeCapacity).toBe(1)
    })

    rejectFirstRefresh(new Error('Day refresh failed'))

    await act(async () => {
      await firstRefreshPromise
      await secondRefreshPromise
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    if (result.current.availabilityState.status !== 'ready') {
      throw new Error('Expected ready availability state')
    }

    const refreshedDayGroup = result.current.availabilityState.dayGroups.find(
      (dayGroup) => dayGroup.date === localDate('2026-05-14'),
    )

    expect(refreshedDayGroup?.slots[0]?.freeCapacity).toBe(1)
    expect(result.current.availabilityState.appendErrorMessage).toBeNull()
  })

  it('resets the loaded range when the reference date changes', async () => {
    const { api, getDailyAvailabilityWindow } = createApi()

    const { result, rerender } = renderHook(
      ({ referenceDate }) => useAvailabilityOverview(api, 'pro', referenceDate),
      {
        initialProps: {
          referenceDate: new Date('2026-05-14T12:00:00'),
        },
      },
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    rerender({
      referenceDate: new Date('2026-06-02T12:00:00'),
    })

    await waitFor(() => {
      expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(28)
    })

    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      15,
      'pro',
      '2026-06-01',
    )
    expect(getDailyAvailabilityWindow).toHaveBeenNthCalledWith(
      28,
      'pro',
      '2026-06-14',
    )
  })

  it('returns to loading state while replacing availability for a new cable', async () => {
    let resolveReplacement!: () => void
    let hasBlockedReplacement = false
    const getDailyAvailabilityWindow = vi.fn(
      async (cableId: CableId, date: LocalDateString) => {
        if (cableId === 'easy' && !hasBlockedReplacement) {
          hasBlockedReplacement = true
          await new Promise<void>((resolve) => {
            resolveReplacement = resolve
          })
        }

        return createDailyAvailabilityWindow(date)
      },
    )
    const api = createApi(getDailyAvailabilityWindow)

    const { result, rerender } = renderHook(
      ({ cableId }) =>
        useAvailabilityOverview(
          api.api,
          cableId,
          new Date('2026-05-14T12:00:00'),
        ),
      {
        initialProps: {
          cableId: 'pro' as CableId,
        },
      },
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    rerender({
      cableId: 'easy' as CableId,
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('loading')
    })

    resolveReplacement()

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })
  })

  it('ignores duplicate append requests while one is in flight', async () => {
    let resolveAppendRange: (() => void) | null = null
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) => {
        if (date === localDate('2026-05-25')) {
          await new Promise<void>((resolve) => {
            resolveAppendRange = resolve
          })
        }

        return createDailyAvailabilityWindow(date)
      },
    )
    const api = createApi(getDailyAvailabilityWindow)

    const { result } = renderHook(() =>
      useAvailabilityOverview(api.api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    let firstLoadMore: Promise<void>
    let secondLoadMore: Promise<void>

    await act(async () => {
      firstLoadMore = result.current.loadMoreAvailability()
      secondLoadMore = result.current.loadMoreAvailability()
    })

    const resolvePendingAppendRange: () => void =
      resolveAppendRange ??
      (() => {
        throw new Error('Expected pending append range request')
      })

    resolvePendingAppendRange()

    await act(async () => {
      await firstLoadMore
      await secondLoadMore
    })

    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(21)
  })

  it('keeps existing content visible when appending another week fails', async () => {
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) => {
        if (date === localDate('2026-05-25')) {
          throw new Error('Append failed')
        }

        return createDailyAvailabilityWindow(date)
      },
    )
    const api = createApi(getDailyAvailabilityWindow)

    const { result } = renderHook(() =>
      useAvailabilityOverview(api.api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    await act(async () => {
      await result.current.loadMoreAvailability()
    })

    await waitFor(() => {
      if (result.current.availabilityState.status !== 'ready') {
        throw new Error('Expected ready availability state')
      }

      expect(result.current.availabilityState.appendErrorMessage).toBe(
        'Append failed',
      )
    })

    if (result.current.availabilityState.status !== 'ready') {
      throw new Error('Expected ready availability state')
    }

    expect(result.current.availabilityState.dayGroups).toHaveLength(14)
    expect(result.current.availabilityState.weekPages).toHaveLength(2)
    expect(result.current.availabilityState.isLoadingMore).toBe(false)
  })

  it('keeps an appended week when it resolves during a day refresh', async () => {
    let resolveAppendWeek!: () => void
    let resolveDayRefresh!: () => void
    let shouldBlockDayRefresh = false
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) => {
        if (date === localDate('2026-05-25')) {
          await new Promise<void>((resolve) => {
            resolveAppendWeek = resolve
          })
        }

        if (date === localDate('2026-05-14') && shouldBlockDayRefresh) {
          shouldBlockDayRefresh = false
          await new Promise<void>((resolve) => {
            resolveDayRefresh = resolve
          })
        }

        return createDailyAvailabilityWindow(date)
      },
    )
    const api = createApi(getDailyAvailabilityWindow)

    const { result } = renderHook(() =>
      useAvailabilityOverview(api.api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    let appendPromise: Promise<void>
    let refreshDayPromise: Promise<void>

    await act(async () => {
      appendPromise = result.current.loadMoreAvailability()
    })

    await waitFor(() => {
      if (result.current.availabilityState.status !== 'ready') {
        throw new Error('Expected ready availability state')
      }

      expect(result.current.availabilityState.isLoadingMore).toBe(true)
    })

    shouldBlockDayRefresh = true

    await act(async () => {
      refreshDayPromise = result.current.refreshAvailabilityDay(
        localDate('2026-05-14'),
      )
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('refreshing')
    })

    resolveAppendWeek()

    await waitFor(() => {
      if (
        result.current.availabilityState.status !== 'ready' &&
        result.current.availabilityState.status !== 'refreshing'
      ) {
        throw new Error('Expected loaded availability state')
      }

      expect(result.current.availabilityState.weekPages).toHaveLength(3)
    })

    resolveDayRefresh()

    await act(async () => {
      await appendPromise
      await refreshDayPromise
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    if (result.current.availabilityState.status !== 'ready') {
      throw new Error('Expected ready availability state')
    }

    expect(result.current.availabilityState.weekPages).toHaveLength(3)
    expect(result.current.availabilityState.dayGroups).toHaveLength(21)
    expect(result.current.availabilityState.isLoadingMore).toBe(false)
  })

  it('keeps a day refresh update when it resolves during an append', async () => {
    let resolveAppendWeek!: () => void
    let resolveDayRefresh!: () => void
    let shouldBlockDayRefresh = false
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) => {
        if (date === localDate('2026-05-25')) {
          await new Promise<void>((resolve) => {
            resolveAppendWeek = resolve
          })
        }

        if (date === localDate('2026-05-14') && shouldBlockDayRefresh) {
          shouldBlockDayRefresh = false
          await new Promise<void>((resolve) => {
            resolveDayRefresh = resolve
          })
        }

        if (date === localDate('2026-05-14')) {
          return createDailyAvailabilityWindow(date, {
            cableId: 'pro',
            freeCapacity: 1,
          })
        }

        return createDailyAvailabilityWindow(date)
      },
    )
    const api = createApi(getDailyAvailabilityWindow)

    const { result } = renderHook(() =>
      useAvailabilityOverview(api.api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    let appendPromise: Promise<void>
    let refreshDayPromise: Promise<void>

    await act(async () => {
      appendPromise = result.current.loadMoreAvailability()
    })

    await waitFor(() => {
      if (result.current.availabilityState.status !== 'ready') {
        throw new Error('Expected ready availability state')
      }

      expect(result.current.availabilityState.isLoadingMore).toBe(true)
    })

    shouldBlockDayRefresh = true

    await act(async () => {
      refreshDayPromise = result.current.refreshAvailabilityDay(
        localDate('2026-05-14'),
      )
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('refreshing')
    })

    resolveDayRefresh()

    await waitFor(() => {
      if (
        result.current.availabilityState.status !== 'ready' &&
        result.current.availabilityState.status !== 'refreshing'
      ) {
        throw new Error('Expected loaded availability state')
      }

      const refreshedDayGroup = result.current.availabilityState.dayGroups.find(
        (dayGroup) => dayGroup.date === localDate('2026-05-14'),
      )

      expect(refreshedDayGroup?.slots[0]?.freeCapacity).toBe(1)
    })

    resolveAppendWeek()

    await act(async () => {
      await appendPromise
      await refreshDayPromise
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    if (result.current.availabilityState.status !== 'ready') {
      throw new Error('Expected ready availability state')
    }

    const refreshedDayGroup = result.current.availabilityState.dayGroups.find(
      (dayGroup) => dayGroup.date === localDate('2026-05-14'),
    )

    expect(result.current.availabilityState.weekPages).toHaveLength(3)
    expect(result.current.availabilityState.dayGroups).toHaveLength(21)
    expect(refreshedDayGroup?.slots[0]?.freeCapacity).toBe(1)
  })

  it('ignores append requests while availability is refreshing', async () => {
    let resolveRefresh!: () => void
    let shouldBlockRefresh = false
    const getDailyAvailabilityWindow = vi.fn(
      async (_cableId: CableId, date: LocalDateString) => {
        if (date === localDate('2026-05-11') && shouldBlockRefresh) {
          shouldBlockRefresh = false
          await new Promise<void>((resolve) => {
            resolveRefresh = resolve
          })
        }

        return createDailyAvailabilityWindow(date)
      },
    )
    const api = createApi(getDailyAvailabilityWindow)

    const { result } = renderHook(() =>
      useAvailabilityOverview(api.api, 'pro', new Date('2026-05-14T12:00:00')),
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    let refreshPromise: Promise<void>
    shouldBlockRefresh = true

    await act(async () => {
      refreshPromise = result.current.refreshAvailability()
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('refreshing')
    })

    await act(async () => {
      await result.current.loadMoreAvailability()
    })

    expect(getDailyAvailabilityWindow).toHaveBeenCalledTimes(28)

    resolveRefresh()

    await act(async () => {
      await refreshPromise
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    if (result.current.availabilityState.status !== 'ready') {
      throw new Error('Expected ready availability state')
    }

    expect(result.current.availabilityState.weekPages).toHaveLength(2)
  })

  it('ignores a stale day refresh after availability is replaced', async () => {
    let resolveDayRefresh!: () => void
    let shouldBlockDayRefresh = false
    const getDailyAvailabilityWindow = vi.fn(
      async (cableId: CableId, date: LocalDateString) => {
        if (
          cableId === 'pro' &&
          date === localDate('2026-05-29') &&
          shouldBlockDayRefresh
        ) {
          shouldBlockDayRefresh = false
          await new Promise<void>((resolve) => {
            resolveDayRefresh = resolve
          })
        }

        return {
          ...createDailyAvailabilityWindow(date),
          cableId,
        }
      },
    )
    const api = createApi(getDailyAvailabilityWindow)

    const { result, rerender } = renderHook(
      ({ cableId }) =>
        useAvailabilityOverview(
          api.api,
          cableId,
          new Date('2026-05-14T12:00:00'),
        ),
      {
        initialProps: {
          cableId: 'pro' as CableId,
        },
      },
    )

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    shouldBlockDayRefresh = true

    await act(async () => {
      void result.current.refreshAvailabilityDay(localDate('2026-05-29'))
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('refreshing')
    })

    rerender({
      cableId: 'easy' as CableId,
    })

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('loading')
    })

    resolveDayRefresh()

    await waitFor(() => {
      expect(result.current.availabilityState.status).toBe('ready')
    })

    if (result.current.availabilityState.status !== 'ready') {
      throw new Error('Expected ready availability state')
    }

    expect(
      result.current.availabilityState.dayGroups.every((dayGroup) =>
        dayGroup.slots.every((slot) => slot.selection.cableId === 'easy'),
      ),
    ).toBe(true)
  })
})

function createApi(
  getDailyAvailabilityWindow: LaguuniApi['getDailyAvailabilityWindow'] = vi.fn(
    async (_cableId, date) => createDailyAvailabilityWindow(date),
  ),
) {
  return {
    api: {
      addReservationToBasket: unexpectedApiCall,
      applyCodeToBasket: unexpectedApiCall,
      createBasket: unexpectedApiCall,
      deleteBasket: unexpectedApiCall,
      getAvailableDates: unexpectedApiCall,
      getDailyAvailabilityWindow,
      loadBasketPricingSummary: unexpectedApiCall,
      lookupCode: unexpectedApiCall,
      submitCheckout: unexpectedApiCall,
    } satisfies LaguuniApi,
    getDailyAvailabilityWindow,
  }
}

function createDailyAvailabilityWindow(
  date: LocalDateString,
  overrides?: {
    cableId?: CableId
    freeCapacity?: number
  },
): DailyAvailabilityWindow {
  return {
    bookingSegments: [
      {
        endMinute: 900,
        isBookable: true,
        startMinute: 780,
      },
    ],
    cableId: overrides?.cableId ?? 'pro',
    capacitySegments: [
      {
        endMinute: 900,
        freeCapacity: overrides?.freeCapacity ?? 4,
        startMinute: 780,
      },
    ],
    date,
  }
}

async function unexpectedApiCall(): Promise<never> {
  throw new Error('This API method should not be used in this test')
}
