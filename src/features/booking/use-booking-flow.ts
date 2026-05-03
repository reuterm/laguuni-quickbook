import { useCallback, useState } from 'react'

import { useBookingService, useDiagnosticsTraceId } from '../../app/providers'
import type {
  BookingFlowResult,
  BookingProfile,
  BookingSlotSelection,
} from '../../domain/booking'
import type { UserSettings } from '../../domain/settings'
import { useUserSettings } from '../settings/use-user-settings'

export type BookingFlowState =
  | {
      status: 'idle'
    }
  | {
      selection: BookingSlotSelection
      status: 'submitting'
    }
  | {
      result: BookingFlowResult
      selection: BookingSlotSelection
      status: 'completed'
    }

export function useBookingFlow() {
  const bookingService = useBookingService()
  const traceId = useDiagnosticsTraceId()
  const { settings } = useUserSettings()
  const [bookingState, setBookingState] = useState<BookingFlowState>({
    status: 'idle',
  })

  const bookSelection = useCallback(
    async (selection: BookingSlotSelection) => {
      setBookingState({
        selection,
        status: 'submitting',
      })

      try {
        const result = await bookingService.book({
          code: normalizeOptionalCode(settings.seasonPassCode),
          profile: createBookingProfile(settings),
          selection,
        })

        setBookingState({
          result,
          selection,
          status: 'completed',
        })
      } catch (error) {
        const errorMessage = getErrorMessage(error)

        setBookingState({
          result: {
            errorCode: 'unexpected-error',
            message: errorMessage,
            status: 'failed',
            step: 'unexpected',
          },
          selection,
          status: 'completed',
        })
      }
    },
    [bookingService, settings],
  )

  return {
    bookSelection,
    bookingState,
    isBookingInProgress: bookingState.status === 'submitting',
    traceId,
  }
}

function createBookingProfile(settings: UserSettings): BookingProfile {
  return {
    email: settings.email.trim(),
    name: settings.name.trim(),
    phone: settings.phone.trim(),
  }
}

function normalizeOptionalCode(code: string): string | null {
  const normalizedCode = code.trim()

  return normalizedCode.length > 0 ? normalizedCode : null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'The mocked booking flow failed unexpectedly.'
}
