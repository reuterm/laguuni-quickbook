import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'

import type { CableId } from '@/domain/cable'
import type { LaguuniApi } from '@/lib/api/laguuni-api'
import type { LocalDateString } from '@/lib/date'
import type {
  AvailabilityState,
  LoadedRange,
  RangeLoadMode,
} from './availability-overview-store'
import {
  availabilityOverviewReducer,
  canAppendWeek,
  canRefreshDay,
  createInitialAvailabilityOverviewStore,
  createRangeLoadFailedAction,
  createRangeLoadStartedAction,
  createRangeLoadSucceededAction,
  DEFAULT_AVAILABILITY_ERROR_MESSAGE,
  deriveAvailabilityState,
  getInitialAvailabilityRange,
  getNextWeekStartDate,
  listRangeWeekStartDates,
} from './availability-overview-store'
import {
  loadAvailabilityDay,
  loadAvailabilityWeek,
} from './availability-service'

type UseAvailabilityOverviewResult = {
  availabilityState: AvailabilityState
  loadMoreAvailability: () => Promise<void>
  refreshAvailabilityDay: (date: LocalDateString) => Promise<void>
  refreshAvailabilitySelection: (
    cableId: CableId,
    date: LocalDateString,
  ) => Promise<void>
  refreshAvailability: () => Promise<void>
}

type UseAvailabilityOverviewOptions = {
  enabled?: boolean
}

export type { AvailabilityState } from './availability-overview-store'
export function useAvailabilityOverview(
  api: LaguuniApi,
  selectedCable: CableId,
  referenceDate?: Date,
  { enabled = true }: UseAvailabilityOverviewOptions = {},
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
  const [store, dispatch] = useReducer(
    availabilityOverviewReducer,
    initialRange,
    createInitialAvailabilityOverviewStore,
  )
  const isMountedRef = useRef(true)
  const dayRefreshTokenRef = useRef(0)
  const pendingAppendRef = useRef(false)
  const rangeVersionRef = useRef(store.rangeVersion)
  const storeRef = useRef(store)

  // These refs protect the reducer from stale or overlapping async results.
  // `rangeVersionRef` invalidates old range loads, `dayRefreshTokenRef` invalidates
  // older same-day refreshes, and `pendingAppendRef` prevents duplicate appends
  // before React state updates have been applied.

  rangeVersionRef.current = store.rangeVersion
  storeRef.current = store

  const beginNextRangeRequest = useCallback(() => {
    const nextRangeVersion = rangeVersionRef.current + 1

    rangeVersionRef.current = nextRangeVersion
    pendingAppendRef.current = false

    return nextRangeVersion
  }, [])

  const beginDayRefreshRequest = useCallback(() => {
    const dayRefreshToken = dayRefreshTokenRef.current + 1

    dayRefreshTokenRef.current = dayRefreshToken

    return dayRefreshToken
  }, [])

  const beginAppendRequest = useCallback(() => {
    pendingAppendRef.current = true
  }, [])

  const finishAppendRequest = useCallback(() => {
    pendingAppendRef.current = false
  }, [])

  const loadWeeks = useCallback(
    async (range: LoadedRange) => {
      return Promise.all(
        listRangeWeekStartDates(range).map((weekStartDate) =>
          loadAvailabilityWeek(api, selectedCable, weekStartDate),
        ),
      )
    },
    [api, selectedCable],
  )

  const loadRange = useCallback(
    async (nextRange: LoadedRange, mode: RangeLoadMode) => {
      const nextRangeVersion = beginNextRangeRequest()

      dispatch(createRangeLoadStartedAction(mode, nextRange, nextRangeVersion))

      if (!isMountedRef.current) {
        return
      }

      try {
        const pendingWeekPages = loadWeeks(nextRange)

        if (!isMountedRef.current) {
          return
        }

        const weekPages = await pendingWeekPages

        if (isMountedRef.current) {
          dispatch(
            createRangeLoadSucceededAction(
              mode,
              nextRange,
              nextRangeVersion,
              weekPages,
            ),
          )
        }
      } catch (error) {
        if (isMountedRef.current) {
          dispatch(
            createRangeLoadFailedAction(
              mode,
              nextRange,
              nextRangeVersion,
              getErrorMessage(error),
            ),
          )
        }
      }
    },
    [beginNextRangeRequest, loadWeeks],
  )

  const refreshAvailability = useCallback(async () => {
    if (!enabled) {
      return
    }

    await loadRange(storeRef.current.loadedRange, 'refresh')
  }, [enabled, loadRange])

  const refreshAvailabilityDay = useCallback(
    async (date: LocalDateString) => {
      if (!enabled) {
        return
      }

      const currentStore = storeRef.current

      if (!canRefreshDay(currentStore)) {
        return
      }

      const rangeVersion = currentStore.rangeVersion
      const dayRefreshToken = beginDayRefreshRequest()

      dispatch({
        date,
        dayRefreshToken,
        rangeVersion,
        type: 'refreshDayStarted',
      })

      if (!isMountedRef.current) {
        return
      }

      try {
        const pendingDayGroup = loadAvailabilityDay(api, selectedCable, date)

        if (!isMountedRef.current) {
          return
        }

        const refreshedDayGroup = await pendingDayGroup

        if (isMountedRef.current) {
          dispatch({
            date,
            dayGroup: refreshedDayGroup,
            dayRefreshToken,
            rangeVersion,
            type: 'refreshDaySucceeded',
          })
        }
      } catch {
        if (isMountedRef.current) {
          dispatch({
            date,
            dayRefreshToken,
            rangeVersion,
            type: 'refreshDayFailed',
          })
        }
      }
    },
    [api, beginDayRefreshRequest, enabled, selectedCable],
  )

  const refreshAvailabilitySelection = useCallback(
    async (cableId: CableId, date: LocalDateString) => {
      if (!enabled) {
        return
      }

      if (cableId === selectedCable) {
        await refreshAvailabilityDay(date)
        return
      }

      await loadAvailabilityDay(api, cableId, date)
    },
    [api, enabled, refreshAvailabilityDay, selectedCable],
  )

  const loadMoreAvailability = useCallback(async () => {
    if (!enabled) {
      return
    }

    const currentStore = storeRef.current

    if (!canAppendWeek(currentStore, pendingAppendRef.current)) {
      return
    }

    const nextWeekStartDate = getNextWeekStartDate(currentStore.weekPages)

    if (!nextWeekStartDate) {
      return
    }

    const rangeVersion = currentStore.rangeVersion

    beginAppendRequest()
    dispatch({
      rangeVersion,
      type: 'appendStarted',
    })

    if (!isMountedRef.current) {
      finishAppendRequest()
      return
    }

    try {
      const pendingWeekPage = loadAvailabilityWeek(
        api,
        selectedCable,
        nextWeekStartDate,
      )

      if (!isMountedRef.current) {
        finishAppendRequest()
        return
      }

      const nextWeekPage = await pendingWeekPage

      finishAppendRequest()

      if (isMountedRef.current) {
        dispatch({
          rangeVersion,
          type: 'appendSucceeded',
          weekPage: nextWeekPage,
        })
      }
    } catch (error) {
      finishAppendRequest()

      if (isMountedRef.current) {
        dispatch({
          errorMessage: getErrorMessage(error),
          rangeVersion,
          type: 'appendFailed',
        })
      }
    }
  }, [api, beginAppendRequest, enabled, finishAppendRequest, selectedCable])

  useEffect(() => {
    isMountedRef.current = true

    if (!enabled) {
      return undefined
    }

    void loadRange(initialRange, 'replace')

    return undefined
  }, [enabled, initialRange, loadRange])

  useEffect(() => {
    const mountedRef = isMountedRef

    return () => {
      mountedRef.current = false
    }
  }, [])

  const availabilityState = useMemo(
    () => deriveAvailabilityState(store),
    [store],
  )

  return {
    availabilityState,
    loadMoreAvailability,
    refreshAvailabilityDay,
    refreshAvailabilitySelection,
    refreshAvailability,
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return DEFAULT_AVAILABILITY_ERROR_MESSAGE
}
