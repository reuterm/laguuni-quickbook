import { useCallback, useState } from 'react'

import type { BookingSlotSelection } from '../../domain/booking'
import { createBookingCalendarEvent } from './calendar-event'
import { shareOrDownloadCalendarFile } from './calendar-share'
import { createBookingCalendarFile } from './ical'

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

      const events = selections.map((selection) =>
        createBookingCalendarEvent(selection, bookingIdentifier),
      )
      const file = createBookingCalendarFile(
        events,
        `laguuni-booking-${bookingIdentifier}.ics`,
      )

      const result = await shareOrDownloadCalendarFile(file, {
        text: 'Add bookings to your calendar.',
        title: 'Add to calendar',
      })

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
