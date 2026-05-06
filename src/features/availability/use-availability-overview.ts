import { useCallback, useEffect, useRef, useState } from 'react'

import type { CableId } from '../../domain/cable'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import {
  type AvailabilityDayGroup,
  loadAvailabilityOverview,
} from './availability-service'

export type AvailabilityState =
  | {
      status: 'loading'
    }
  | {
      dayGroups: readonly AvailabilityDayGroup[]
      status: 'refreshing'
    }
  | {
      dayGroups: readonly AvailabilityDayGroup[]
      status: 'ready'
    }
  | {
      message: string
      status: 'error'
    }

type UseAvailabilityOverviewResult = {
  availabilityState: AvailabilityState
  refreshAvailability: () => Promise<void>
}

export function useAvailabilityOverview(
  api: LaguuniApi,
  selectedCable: CableId,
  referenceDate?: Date,
): UseAvailabilityOverviewResult {
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>(
    {
      status: 'loading',
    },
  )
  const isMountedRef = useRef(true)
  const latestRequestIdRef = useRef(0)

  const refreshAvailability = useCallback(async () => {
    const requestId = latestRequestIdRef.current + 1
    latestRequestIdRef.current = requestId

    setAvailabilityState((currentState) => {
      if (
        currentState.status === 'ready' ||
        currentState.status === 'refreshing'
      ) {
        return {
          dayGroups: currentState.dayGroups,
          status: 'refreshing',
        }
      }

      return {
        status: 'loading',
      }
    })

    try {
      const dayGroups = await loadAvailabilityOverview(
        api,
        selectedCable,
        referenceDate,
      )

      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return
      }

      setAvailabilityState({
        dayGroups,
        status: 'ready',
      })
    } catch (error) {
      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return
      }

      setAvailabilityState({
        message: getErrorMessage(error),
        status: 'error',
      })
    }
  }, [api, referenceDate, selectedCable])

  useEffect(() => {
    isMountedRef.current = true
    void refreshAvailability()

    return undefined
  }, [refreshAvailability])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    availabilityState,
    refreshAvailability,
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'The availability feed could not be loaded.'
}
