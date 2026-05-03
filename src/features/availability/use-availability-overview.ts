import { useEffect, useState } from 'react'

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
      status: 'ready'
    }
  | {
      message: string
      status: 'error'
    }

export function useAvailabilityOverview(
  api: LaguuniApi,
  selectedCable: CableId,
): AvailabilityState {
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>(
    {
      status: 'loading',
    },
  )

  useEffect(() => {
    let isCancelled = false

    async function fetchAvailability() {
      setAvailabilityState({
        status: 'loading',
      })

      try {
        const dayGroups = await loadAvailabilityOverview(api, selectedCable)

        if (!isCancelled) {
          setAvailabilityState({
            dayGroups,
            status: 'ready',
          })
        }
      } catch (error) {
        if (!isCancelled) {
          setAvailabilityState({
            message: getErrorMessage(error),
            status: 'error',
          })
        }
      }
    }

    void fetchAvailability()

    return () => {
      isCancelled = true
    }
  }, [api, selectedCable])

  return availabilityState
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'The mocked availability feed could not be loaded.'
}
