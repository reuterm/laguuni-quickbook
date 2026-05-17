import { useCallback } from 'react'

import { useBookingService, useDiagnostics } from '../../app/providers'
import type { BookingProfile, BookingSlotSelection } from '../../domain/booking'
import type { UserSettings } from '../../domain/settings'
import { useUserSettings } from '../settings/use-user-settings'
import type { BookingSubmission } from './booking-service'
import { validateBookingProfile } from './booking-validation'

export type BookingFlowSubmission = BookingSubmission & {
  selection: BookingSlotSelection
  traceId: string
}

export function useBookingFlow() {
  const bookingService = useBookingService()
  const diagnostics = useDiagnostics()
  const { settings } = useUserSettings()
  const bookingProfile = createBookingProfile(settings)
  const isBookingReady =
    validateBookingProfile(bookingProfile).status === 'valid'
  const submitBooking = useCallback(
    async (selection: BookingSlotSelection): Promise<BookingFlowSubmission> => {
      const trace = diagnostics.beginTrace({ name: 'booking' })
      const submission = await bookingService.book(
        {
          code: normalizeOptionalCode(settings.seasonPassCode),
          profile: bookingProfile,
          selection,
        },
        trace,
      )

      return {
        selection,
        ...submission,
        traceId: trace.traceId,
      }
    },
    [bookingProfile, bookingService, diagnostics, settings.seasonPassCode],
  )

  return {
    isBookingReady,
    submitBooking,
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
