import { useCallback, useState } from 'react'

import { useBookingService, useDiagnostics } from '../../app/providers'
import type {
  BookingFlowResult,
  BookingProfile,
  BookingSlotSelection,
} from '../../domain/booking'
import type { UserSettings } from '../../domain/settings'
import { useUserSettings } from '../settings/use-user-settings'
import { validateBookingProfile } from './booking-validation'

export type BookingFlowState =
  | {
      status: 'idle'
    }
  | {
      selection: BookingSlotSelection
      status: 'submitting'
      traceId: string
    }
  | {
      result: BookingFlowResult
      selection: BookingSlotSelection
      status: 'completed'
      traceId: string
    }

export function useBookingFlow() {
  const bookingService = useBookingService()
  const diagnostics = useDiagnostics()
  const { settings } = useUserSettings()
  const bookingProfile = createBookingProfile(settings)
  const isBookingReady =
    validateBookingProfile(bookingProfile).status === 'valid'
  const [bookingState, setBookingState] = useState<BookingFlowState>({
    status: 'idle',
  })

  const bookSelection = useCallback(
    async (selection: BookingSlotSelection) => {
      const trace = diagnostics.beginTrace({ name: 'booking' })

      setBookingState({
        selection,
        status: 'submitting',
        traceId: trace.traceId,
      })

      try {
        const result = await bookingService.book(
          {
            code: normalizeOptionalCode(settings.seasonPassCode),
            profile: bookingProfile,
            selection,
          },
          trace,
        )

        setBookingState({
          result,
          selection,
          status: 'completed',
          traceId: trace.traceId,
        })

        return result
      } catch (error) {
        const errorMessage = getErrorMessage(error)

        const result: BookingFlowResult = {
          errorCode: 'unexpected-error',
          message: errorMessage,
          status: 'failed',
          step: 'unexpected',
        }

        setBookingState({
          result,
          selection,
          status: 'completed',
          traceId: trace.traceId,
        })

        return result
      }
    },
    [bookingProfile, bookingService, diagnostics, settings.seasonPassCode],
  )

  const dismissBookingStatus = useCallback(() => {
    setBookingState({ status: 'idle' })
  }, [])

  return {
    bookSelection,
    bookingState,
    dismissBookingStatus,
    isBookingInProgress: bookingState.status === 'submitting',
    isBookingReady,
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

  return 'The booking flow failed unexpectedly.'
}
