import { useCallback, useState } from 'react'

import type { BookingSlotSelection } from '../../domain/booking'
import { useUserSettings } from '../settings/use-user-settings'
import { createBookingCalendarEvent } from './calendar-event'
import { shareOrDownloadCalendarFile } from './calendar-share'
import { createBookingCalendarFile } from './ical'

type UseBookingCalendarActionResult = {
  addToCalendar: (() => Promise<void>) | undefined
  errorMessage: string | null
  isEnabled: boolean
}

const CALENDAR_EXPORT_ERROR_MESSAGE =
  'Could not add this booking to your calendar.'

export function useBookingCalendarAction(
  selection: BookingSlotSelection,
  bookingIdentifier: string,
): UseBookingCalendarActionResult {
  const { settings } = useUserSettings()
  const isEnabled = settings.calendarExportEnabled
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
    addToCalendar: isEnabled ? addToCalendar : undefined,
    errorMessage,
    isEnabled,
  }
}
