import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'

import type { CableId } from '../../domain/cable'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import {
  addCalendarDays,
  getAvailabilityWeekStartDate,
} from './availability-calendar'
import {
  AVAILABILITY_INITIAL_WEEK_COUNT,
  AVAILABILITY_MAX_WEEK_COUNT,
  AVAILABILITY_WEEK_DAY_COUNT,
  type AvailabilityDayGroup,
  type AvailabilityWeekPage,
  loadAvailabilityDay,
  loadAvailabilityWeek,
} from './availability-service'

type LoadedAvailabilityData = {
  appendErrorMessage: string | null
  canLoadMore: boolean
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

type RangeLoadMode = 'refresh' | 'replace'

const DEFAULT_AVAILABILITY_ERROR_MESSAGE =
  'The availability feed could not be loaded.'

type AvailabilityOverviewStore = {
  activeDayRefreshCount: number
  appendErrorMessage: string | null
  errorMessage: string | null
  isAppending: boolean
  isRefreshingRange: boolean
  latestDayRefreshTokens: Readonly<Record<string, number>>
  loadedRange: LoadedRange
  phase: 'error' | 'loading' | 'ready'
  rangeVersion: number
  weekPages: readonly AvailabilityWeekPage[]
}

type AvailabilityOverviewAction =
  | {
      range: LoadedRange
      rangeVersion: number
      type: 'replaceStarted'
    }
  | {
      errorMessage: string
      range: LoadedRange
      rangeVersion: number
      type: 'replaceFailed'
    }
  | {
      range: LoadedRange
      rangeVersion: number
      type: 'replaceSucceeded'
      weekPages: readonly AvailabilityWeekPage[]
    }
  | {
      range: LoadedRange
      rangeVersion: number
      type: 'refreshRangeStarted'
    }
  | {
      errorMessage: string
      range: LoadedRange
      rangeVersion: number
      type: 'refreshRangeFailed'
    }
  | {
      range: LoadedRange
      rangeVersion: number
      type: 'refreshRangeSucceeded'
      weekPages: readonly AvailabilityWeekPage[]
    }
  | {
      rangeVersion: number
      type: 'appendStarted'
    }
  | {
      errorMessage: string
      rangeVersion: number
      type: 'appendFailed'
    }
  | {
      rangeVersion: number
      type: 'appendSucceeded'
      weekPage: AvailabilityWeekPage
    }
  | {
      date: string
      dayRefreshToken: number
      rangeVersion: number
      type: 'refreshDayStarted'
    }
  | {
      date: string
      dayRefreshToken: number
      rangeVersion: number
      type: 'refreshDayFailed'
    }
  | {
      date: string
      dayGroup: AvailabilityDayGroup
      dayRefreshToken: number
      rangeVersion: number
      type: 'refreshDaySucceeded'
    }
  | {
      type: 'clearAppendError'
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

  rangeVersionRef.current = store.rangeVersion
  storeRef.current = store

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
      const nextRangeVersion = rangeVersionRef.current + 1
      rangeVersionRef.current = nextRangeVersion
      pendingAppendRef.current = false

      dispatch(createRangeLoadStartedAction(mode, nextRange, nextRangeVersion))

      try {
        const weekPages = await loadWeeks(nextRange)

        if (!isMountedRef.current) {
          return
        }

        dispatch(
          createRangeLoadSucceededAction(
            mode,
            nextRange,
            nextRangeVersion,
            weekPages,
          ),
        )
      } catch (error) {
        if (!isMountedRef.current) {
          return
        }

        dispatch(
          createRangeLoadFailedAction(
            mode,
            nextRange,
            nextRangeVersion,
            getErrorMessage(error),
          ),
        )
      }
    },
    [loadWeeks],
  )

  const refreshAvailability = useCallback(async () => {
    await loadRange(storeRef.current.loadedRange, 'refresh')
  }, [loadRange])

  const refreshAvailabilityDay = useCallback(
    async (date: string) => {
      const currentStore = storeRef.current

      if (!canRefreshDay(currentStore)) {
        return
      }

      const rangeVersion = currentStore.rangeVersion
      const dayRefreshToken = dayRefreshTokenRef.current + 1
      dayRefreshTokenRef.current = dayRefreshToken

      dispatch({
        date,
        dayRefreshToken,
        rangeVersion,
        type: 'refreshDayStarted',
      })

      try {
        const refreshedDayGroup = await loadAvailabilityDay(
          api,
          selectedCable,
          date,
        )

        if (!isMountedRef.current) {
          return
        }

        dispatch({
          date,
          dayGroup: refreshedDayGroup,
          dayRefreshToken,
          rangeVersion,
          type: 'refreshDaySucceeded',
        })
      } catch {
        if (!isMountedRef.current) {
          return
        }

        dispatch({
          date,
          dayRefreshToken,
          rangeVersion,
          type: 'refreshDayFailed',
        })
      }
    },
    [api, selectedCable],
  )

  const loadMoreAvailability = useCallback(async () => {
    const currentStore = storeRef.current

    if (!canAppendWeek(currentStore, pendingAppendRef.current)) {
      return
    }

    const nextWeekStartDate = getNextWeekStartDate(currentStore.weekPages)

    if (!nextWeekStartDate) {
      return
    }

    const rangeVersion = currentStore.rangeVersion

    pendingAppendRef.current = true
    dispatch({
      rangeVersion,
      type: 'appendStarted',
    })

    try {
      const nextWeekPage = await loadAvailabilityWeek(
        api,
        selectedCable,
        nextWeekStartDate,
      )

      if (!isMountedRef.current) {
        pendingAppendRef.current = false
        return
      }

      pendingAppendRef.current = false
      dispatch({
        rangeVersion,
        type: 'appendSucceeded',
        weekPage: nextWeekPage,
      })
    } catch (error) {
      if (!isMountedRef.current) {
        pendingAppendRef.current = false
        return
      }

      pendingAppendRef.current = false
      dispatch({
        errorMessage: getErrorMessage(error),
        rangeVersion,
        type: 'appendFailed',
      })
    }
  }, [api, selectedCable])

  const clearAppendError = useCallback(() => {
    dispatch({ type: 'clearAppendError' })
  }, [])

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

  const availabilityState = useMemo(
    () => deriveAvailabilityState(store),
    [store],
  )

  return {
    availabilityState,
    clearAppendError,
    loadMoreAvailability,
    refreshAvailabilityDay,
    refreshAvailability,
  }
}

function createInitialAvailabilityOverviewStore(
  initialRange: LoadedRange,
): AvailabilityOverviewStore {
  return createRangeStore(initialRange, 0, 'loading')
}

function availabilityOverviewReducer(
  state: AvailabilityOverviewStore,
  action: AvailabilityOverviewAction,
): AvailabilityOverviewStore {
  switch (action.type) {
    case 'replaceStarted': {
      return createRangeStore(action.range, action.rangeVersion, 'loading')
    }

    case 'replaceSucceeded': {
      if (!hasMatchingRangeVersion(state, action.rangeVersion)) {
        return state
      }

      return createReadyRangeStore(
        action.range,
        action.rangeVersion,
        action.weekPages,
      )
    }

    case 'replaceFailed': {
      if (!hasMatchingRangeVersion(state, action.rangeVersion)) {
        return state
      }

      return createRangeStore(
        action.range,
        action.rangeVersion,
        'error',
        action.errorMessage,
      )
    }

    case 'refreshRangeStarted': {
      if (state.phase !== 'ready') {
        return createRangeStore(action.range, action.rangeVersion, 'loading')
      }

      return {
        ...state,
        activeDayRefreshCount: 0,
        appendErrorMessage: null,
        errorMessage: null,
        isAppending: false,
        isRefreshingRange: true,
        loadedRange: action.range,
        rangeVersion: action.rangeVersion,
      }
    }

    case 'refreshRangeSucceeded': {
      if (!hasMatchingRangeVersion(state, action.rangeVersion)) {
        return state
      }

      return createReadyRangeStore(
        action.range,
        action.rangeVersion,
        action.weekPages,
      )
    }

    case 'refreshRangeFailed': {
      if (!hasMatchingRangeVersion(state, action.rangeVersion)) {
        return state
      }

      return createRangeStore(
        action.range,
        action.rangeVersion,
        'error',
        action.errorMessage,
      )
    }

    case 'appendStarted': {
      if (!isActiveReadyRange(state, action.rangeVersion)) {
        return state
      }

      return {
        ...state,
        appendErrorMessage: null,
        isAppending: true,
      }
    }

    case 'appendSucceeded': {
      if (!isActiveReadyRange(state, action.rangeVersion)) {
        return state
      }

      const weekPages = mergeWeekPages(state.weekPages, action.weekPage)

      return updateLoadedWeekPages(state, weekPages, {
        appendErrorMessage: null,
        isAppending: false,
      })
    }

    case 'appendFailed': {
      if (!isActiveReadyRange(state, action.rangeVersion)) {
        return state
      }

      return {
        ...state,
        appendErrorMessage: action.errorMessage,
        isAppending: false,
      }
    }

    case 'refreshDayStarted': {
      if (!isActiveReadyRange(state, action.rangeVersion)) {
        return state
      }

      return {
        ...state,
        activeDayRefreshCount: state.activeDayRefreshCount + 1,
        appendErrorMessage: null,
        latestDayRefreshTokens: {
          ...state.latestDayRefreshTokens,
          [action.date]: action.dayRefreshToken,
        },
      }
    }

    case 'refreshDaySucceeded': {
      if (!isActiveReadyRange(state, action.rangeVersion)) {
        return state
      }

      if (
        !hasMatchingDayRefreshToken(state, action.date, action.dayRefreshToken)
      ) {
        return {
          ...state,
          activeDayRefreshCount: decrementActiveDayRefreshCount(
            state.activeDayRefreshCount,
          ),
        }
      }

      const weekPages = replaceDayGroupInWeekPages(
        state.weekPages,
        action.dayGroup,
      )

      return updateLoadedWeekPages(state, weekPages, {
        activeDayRefreshCount: decrementActiveDayRefreshCount(
          state.activeDayRefreshCount,
        ),
      })
    }

    case 'refreshDayFailed': {
      if (!isActiveReadyRange(state, action.rangeVersion)) {
        return state
      }

      return {
        ...state,
        activeDayRefreshCount: decrementActiveDayRefreshCount(
          state.activeDayRefreshCount,
        ),
      }
    }

    case 'clearAppendError': {
      if (state.phase !== 'ready' || state.appendErrorMessage === null) {
        return state
      }

      return {
        ...state,
        appendErrorMessage: null,
      }
    }
  }
}

function getInitialAvailabilityRange(referenceDate?: Date): LoadedRange {
  return {
    startWeekDate: getAvailabilityWeekStartDate(referenceDate ?? new Date()),
    weekCount: AVAILABILITY_INITIAL_WEEK_COUNT,
  }
}

function listRangeWeekStartDates(range: LoadedRange) {
  return Array.from({ length: range.weekCount }, (_, index) =>
    addCalendarDays(range.startWeekDate, index * AVAILABILITY_WEEK_DAY_COUNT),
  )
}

function deriveAvailabilityState(
  store: AvailabilityOverviewStore,
): AvailabilityState {
  if (store.phase === 'loading') {
    return {
      isLoadingMore: false,
      status: 'loading',
    }
  }

  if (store.phase === 'error') {
    return {
      isLoadingMore: false,
      message: store.errorMessage ?? DEFAULT_AVAILABILITY_ERROR_MESSAGE,
      status: 'error',
    }
  }

  return {
    appendErrorMessage: store.appendErrorMessage,
    canLoadMore: store.weekPages.length < AVAILABILITY_MAX_WEEK_COUNT,
    dayGroups: flattenWeekPages(store.weekPages),
    isLoadingMore: store.isAppending,
    status:
      store.isRefreshingRange || store.activeDayRefreshCount > 0
        ? 'refreshing'
        : 'ready',
    weekPages: store.weekPages,
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

  return DEFAULT_AVAILABILITY_ERROR_MESSAGE
}

function createRangeLoadStartedAction(
  mode: RangeLoadMode,
  range: LoadedRange,
  rangeVersion: number,
): AvailabilityOverviewAction {
  return mode === 'replace'
    ? {
        range,
        rangeVersion,
        type: 'replaceStarted',
      }
    : {
        range,
        rangeVersion,
        type: 'refreshRangeStarted',
      }
}

function createRangeLoadSucceededAction(
  mode: RangeLoadMode,
  range: LoadedRange,
  rangeVersion: number,
  weekPages: readonly AvailabilityWeekPage[],
): AvailabilityOverviewAction {
  return mode === 'replace'
    ? {
        range,
        rangeVersion,
        type: 'replaceSucceeded',
        weekPages,
      }
    : {
        range,
        rangeVersion,
        type: 'refreshRangeSucceeded',
        weekPages,
      }
}

function createRangeLoadFailedAction(
  mode: RangeLoadMode,
  range: LoadedRange,
  rangeVersion: number,
  errorMessage: string,
): AvailabilityOverviewAction {
  return mode === 'replace'
    ? {
        errorMessage,
        range,
        rangeVersion,
        type: 'replaceFailed',
      }
    : {
        errorMessage,
        range,
        rangeVersion,
        type: 'refreshRangeFailed',
      }
}

function createRangeStore(
  loadedRange: LoadedRange,
  rangeVersion: number,
  phase: AvailabilityOverviewStore['phase'],
  errorMessage: string | null = null,
): AvailabilityOverviewStore {
  return {
    activeDayRefreshCount: 0,
    appendErrorMessage: null,
    errorMessage,
    isAppending: false,
    isRefreshingRange: false,
    latestDayRefreshTokens: {},
    loadedRange,
    phase,
    rangeVersion,
    weekPages: [],
  }
}

function createReadyRangeStore(
  loadedRange: LoadedRange,
  rangeVersion: number,
  weekPages: readonly AvailabilityWeekPage[],
): AvailabilityOverviewStore {
  return {
    ...createRangeStore(loadedRange, rangeVersion, 'ready'),
    weekPages,
  }
}

function hasMatchingRangeVersion(
  state: AvailabilityOverviewStore,
  rangeVersion: number,
) {
  return state.rangeVersion === rangeVersion
}

function isActiveReadyRange(
  state: AvailabilityOverviewStore,
  rangeVersion: number,
) {
  return state.phase === 'ready' && hasMatchingRangeVersion(state, rangeVersion)
}

function hasMatchingDayRefreshToken(
  state: AvailabilityOverviewStore,
  date: string,
  dayRefreshToken: number,
) {
  return state.latestDayRefreshTokens[date] === dayRefreshToken
}

function updateLoadedWeekPages(
  state: AvailabilityOverviewStore,
  weekPages: readonly AvailabilityWeekPage[],
  overrides: Partial<AvailabilityOverviewStore> = {},
): AvailabilityOverviewStore {
  return {
    ...state,
    ...overrides,
    loadedRange: {
      ...state.loadedRange,
      weekCount: weekPages.length,
    },
    weekPages,
  }
}

function decrementActiveDayRefreshCount(activeDayRefreshCount: number) {
  return Math.max(0, activeDayRefreshCount - 1)
}

function canRefreshDay(store: AvailabilityOverviewStore) {
  return store.phase === 'ready' && !store.isRefreshingRange
}

function canAppendWeek(
  store: AvailabilityOverviewStore,
  hasPendingAppend: boolean,
) {
  return (
    store.phase === 'ready' &&
    !store.isRefreshingRange &&
    !hasPendingAppend &&
    store.weekPages.length < AVAILABILITY_MAX_WEEK_COUNT
  )
}

function getNextWeekStartDate(weekPages: readonly AvailabilityWeekPage[]) {
  const lastLoadedWeek = weekPages.at(-1)

  if (!lastLoadedWeek) {
    return null
  }

  return addCalendarDays(
    lastLoadedWeek.weekStartDate,
    AVAILABILITY_WEEK_DAY_COUNT,
  )
}
