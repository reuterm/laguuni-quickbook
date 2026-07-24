import { useCallback, useState } from 'react'

import type { BookingSlotSelection } from '../../domain/booking'
import { exportBookingCalendar } from './booking-calendar-export'

type UseBookingCalendarActionResult = {
  addToCalendar: () => Promise<void>
  errorMessage: string | null
}

const CALENDAR_EXPORT_ERROR_MESSAGE =
  'Could not add this booking to your calendar.'

export function useBookingCalendarAction(
  selections: readonly BookingSlotSelection[],
  bookingIdentifier: string,
): UseBookingCalendarActionResult {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const addToCalendar = useCallback(async () => {
    try {
      setErrorMessage(null)

      const result = await exportBookingCalendar(selections, bookingIdentifier)

      if (result === 'failed') {
        setErrorMessage(CALENDAR_EXPORT_ERROR_MESSAGE)
      }
    } catch {
      setErrorMessage(CALENDAR_EXPORT_ERROR_MESSAGE)
    }
  }, [bookingIdentifier, selections])

  return {
    addToCalendar,
    errorMessage,
  }
}
