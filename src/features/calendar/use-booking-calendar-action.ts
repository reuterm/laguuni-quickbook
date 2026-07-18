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
  selection: BookingSlotSelection,
  bookingIdentifier: string,
): UseBookingCalendarActionResult {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const addToCalendar = useCallback(async () => {
    try {
      setErrorMessage(null)

      const event = createBookingCalendarEvent(selection, bookingIdentifier)
      const file = createBookingCalendarFile(event)

      const result = await shareOrDownloadCalendarFile(file, {
        text: `Add ${event.title} to your calendar.`,
        title: 'Add to calendar',
      })

      if (result === 'failed') {
        setErrorMessage(CALENDAR_EXPORT_ERROR_MESSAGE)
      }
    } catch {
      setErrorMessage(CALENDAR_EXPORT_ERROR_MESSAGE)
    }
  }, [bookingIdentifier, selection])

  return {
    addToCalendar,
    errorMessage,
  }
}
