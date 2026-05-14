import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { CableId } from '../../domain/cable'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import {
  addCalendarDays,
  getAvailabilityWeekStartDate,
} from './availability-calendar'
import {
  AVAILABILITY_INITIAL_WEEK_COUNT,
  AVAILABILITY_WEEK_DAY_COUNT,
  type AvailabilityDayGroup,
  type AvailabilityWeekPage,
  loadAvailabilityDay,
  loadAvailabilityWeek,
} from './availability-service'

type LoadedAvailabilityData = {
  appendErrorMessage: string | null
  dayGroups: readonly AvailabilityDayGroup[]
  weekPages: readonly AvailabilityWeekPage[]
}

export type AvailabilityState =
  | {
      isLoadingMore: false
      status: 'loading'
    }
  | ({
      isLoadingMore: boolean
      status: 'refreshing'
    } & LoadedAvailabilityData)
  | ({
      isLoadingMore: boolean
      status: 'ready'
    } & LoadedAvailabilityData)
  | {
      isLoadingMore: false
      message: string
      status: 'error'
    }

type UseAvailabilityOverviewResult = {
  availabilityState: AvailabilityState
  clearAppendError: () => void
  loadMoreAvailability: () => Promise<void>
  refreshAvailabilityDay: (date: string) => Promise<void>
  refreshAvailability: () => Promise<void>
}

type LoadedRange = {
  startWeekDate: Date
  weekCount: number
}

export function useAvailabilityOverview(
  api: LaguuniApi,
  selectedCable: CableId,
  referenceDate?: Date,
): UseAvailabilityOverviewResult {
  const referenceDateValue = referenceDate?.getTime()
  const initialRange = useMemo(
    () =>
      getInitialAvailabilityRange(
        referenceDateValue === undefined
          ? undefined
          : new Date(referenceDateValue),
      ),
    [referenceDateValue],
  )
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>(
    {
      isLoadingMore: false,
      status: 'loading',
    },
  )
  const isMountedRef = useRef(true)
  const isLoadingMoreRef = useRef(false)
  const latestDayRefreshIdRef = useRef(0)
  const latestRequestIdRef = useRef(0)
  const loadedRangeRef = useRef<LoadedRange>(initialRange)
  const availabilityStateRef = useRef<AvailabilityState>(availabilityState)

  availabilityStateRef.current = availabilityState

  const loadWeeks = useCallback(
    async (range: LoadedRange) => {
      const weekStartDates = Array.from(
        { length: range.weekCount },
        (_, index) =>
          addCalendarDays(
            range.startWeekDate,
            index * AVAILABILITY_WEEK_DAY_COUNT,
          ),
      )

      return Promise.all(
        weekStartDates.map((weekStartDate) =>
          loadAvailabilityWeek(api, selectedCable, weekStartDate),
        ),
      )
    },
    [api, selectedCable],
  )

  const applyLoadedWeeks = useCallback(
    (weekPages: readonly AvailabilityWeekPage[]) => {
      setAvailabilityState({
        appendErrorMessage: null,
        dayGroups: flattenWeekPages(weekPages),
        isLoadingMore: false,
        status: 'ready',
        weekPages,
      })
    },
    [],
  )

  const loadRange = useCallback(
    async (nextRange: LoadedRange, mode: 'refresh' | 'replace') => {
      const requestId = latestRequestIdRef.current + 1
      latestRequestIdRef.current = requestId

      if (mode === 'replace') {
        setAvailabilityState({
          isLoadingMore: false,
          status: 'loading',
        })
      }

      if (mode === 'refresh') {
        setAvailabilityState((currentState) => {
          if (
            currentState.status === 'ready' ||
            currentState.status === 'refreshing'
          ) {
            return {
              ...currentState,
              appendErrorMessage: null,
              isLoadingMore: false,
              status: 'refreshing',
            }
          }

          return {
            isLoadingMore: false,
            status: 'loading',
          }
        })
      }

      try {
        const weekPages = await loadWeeks(nextRange)

        if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
          return
        }

        loadedRangeRef.current = nextRange
        isLoadingMoreRef.current = false
        applyLoadedWeeks(weekPages)
      } catch (error) {
        if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
          return
        }

        isLoadingMoreRef.current = false
        setAvailabilityState({
          isLoadingMore: false,
          message: getErrorMessage(error),
          status: 'error',
        })
      }
    },
    [applyLoadedWeeks, loadWeeks],
  )

  const refreshAvailability = useCallback(async () => {
    await loadRange(loadedRangeRef.current, 'refresh')
  }, [loadRange])

  const refreshAvailabilityDay = useCallback(
    async (date: string) => {
      const currentState = availabilityStateRef.current

      if (
        currentState.status !== 'ready' &&
        currentState.status !== 'refreshing'
      ) {
        return
      }

      const requestId = latestDayRefreshIdRef.current + 1
      latestDayRefreshIdRef.current = requestId
      const rangeRequestId = latestRequestIdRef.current

      setAvailabilityState({
        ...currentState,
        appendErrorMessage: null,
        isLoadingMore: false,
        status: 'refreshing',
      })

      try {
        const refreshedDayGroup = await loadAvailabilityDay(
          api,
          selectedCable,
          date,
        )

        if (
          !isMountedRef.current ||
          latestDayRefreshIdRef.current !== requestId ||
          latestRequestIdRef.current !== rangeRequestId
        ) {
          return
        }

        const latestState = availabilityStateRef.current

        if (
          latestState.status !== 'ready' &&
          latestState.status !== 'refreshing'
        ) {
          return
        }

        const mergedWeekPages = replaceDayGroupInWeekPages(
          latestState.weekPages,
          refreshedDayGroup,
        )

        loadedRangeRef.current = {
          startWeekDate: loadedRangeRef.current.startWeekDate,
          weekCount: mergedWeekPages.length,
        }
        isLoadingMoreRef.current = false
        applyLoadedWeeks(mergedWeekPages)
      } catch {
        if (
          !isMountedRef.current ||
          latestDayRefreshIdRef.current !== requestId ||
          latestRequestIdRef.current !== rangeRequestId
        ) {
          return
        }

        isLoadingMoreRef.current = false
        setAvailabilityState((latestState) => {
          if (
            latestState.status !== 'ready' &&
            latestState.status !== 'refreshing'
          ) {
            return latestState
          }

          return {
            ...latestState,
            isLoadingMore: false,
            status: 'ready',
          }
        })
      }
    },
    [api, applyLoadedWeeks, selectedCable],
  )

  const loadMoreAvailability = useCallback(async () => {
    const currentState = availabilityStateRef.current

    if (currentState.status !== 'ready' || isLoadingMoreRef.current) {
      return
    }

    const lastLoadedWeek = currentState.weekPages.at(-1)

    if (!lastLoadedWeek) {
      return
    }

    const nextWeekStartDate = addCalendarDays(
      lastLoadedWeek.weekStartDate,
      AVAILABILITY_WEEK_DAY_COUNT,
    )
    const requestId = latestRequestIdRef.current

    isLoadingMoreRef.current = true
    setAvailabilityState({
      ...currentState,
      appendErrorMessage: null,
      isLoadingMore: true,
      status: 'ready',
    })

    try {
      const nextWeekPage = await loadAvailabilityWeek(
        api,
        selectedCable,
        nextWeekStartDate,
      )

      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return
      }

      const latestState = availabilityStateRef.current

      if (latestState.status !== 'ready') {
        return
      }

      const mergedWeekPages = mergeWeekPages(
        latestState.weekPages,
        nextWeekPage,
      )

      loadedRangeRef.current = {
        startWeekDate: loadedRangeRef.current.startWeekDate,
        weekCount: mergedWeekPages.length,
      }
      isLoadingMoreRef.current = false
      applyLoadedWeeks(mergedWeekPages)
    } catch (error) {
      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return
      }

      isLoadingMoreRef.current = false
      setAvailabilityState((latestState) => {
        if (latestState.status !== 'ready') {
          return latestState
        }

        return {
          ...latestState,
          appendErrorMessage: getErrorMessage(error),
          isLoadingMore: false,
          status: 'ready',
        }
      })
    }
  }, [api, applyLoadedWeeks, selectedCable])

  const clearAppendError = useCallback(() => {
    setAvailabilityState((currentState) => {
      if (
        currentState.status !== 'ready' &&
        currentState.status !== 'refreshing'
      ) {
        return currentState
      }

      if (currentState.appendErrorMessage === null) {
        return currentState
      }

      return {
        ...currentState,
        appendErrorMessage: null,
      }
    })
  }, [])

  useEffect(() => {
    loadedRangeRef.current = initialRange
  }, [initialRange])

  useEffect(() => {
    isMountedRef.current = true
    void loadRange(initialRange, 'replace')

    return undefined
  }, [initialRange, loadRange])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    availabilityState,
    clearAppendError,
    loadMoreAvailability,
    refreshAvailabilityDay,
    refreshAvailability,
  }
}

function getInitialAvailabilityRange(referenceDate?: Date): LoadedRange {
  return {
    startWeekDate: getAvailabilityWeekStartDate(referenceDate ?? new Date()),
    weekCount: AVAILABILITY_INITIAL_WEEK_COUNT,
  }
}

function flattenWeekPages(weekPages: readonly AvailabilityWeekPage[]) {
  return weekPages.flatMap((weekPage) => weekPage.dayGroups)
}

function mergeWeekPages(
  currentPages: readonly AvailabilityWeekPage[],
  nextPage: AvailabilityWeekPage,
) {
  const pagesById = new Map(currentPages.map((page) => [page.weekId, page]))
  pagesById.set(nextPage.weekId, nextPage)

  return [...pagesById.values()].sort(
    (left, right) =>
      left.weekStartDate.getTime() - right.weekStartDate.getTime(),
  )
}

function replaceDayGroupInWeekPages(
  weekPages: readonly AvailabilityWeekPage[],
  nextDayGroup: AvailabilityDayGroup,
) {
  return weekPages.map((weekPage) => {
    let hasUpdatedDayGroup = false
    const nextDayGroups = weekPage.dayGroups.map((dayGroup) => {
      if (dayGroup.date !== nextDayGroup.date) {
        return dayGroup
      }

      hasUpdatedDayGroup = true
      return nextDayGroup
    })

    if (!hasUpdatedDayGroup) {
      return weekPage
    }

    return {
      ...weekPage,
      dayGroups: nextDayGroups,
      hasBookableSlots: nextDayGroups.some(
        (dayGroup) => dayGroup.slots.length > 0,
      ),
    }
  })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'The availability feed could not be loaded.'
}
