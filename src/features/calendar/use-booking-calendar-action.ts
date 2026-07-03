import { useCallback } from 'react'

import type { BookingSlotSelection } from '../../domain/booking'
import { useUserSettings } from '../settings/use-user-settings'
import { createBookingCalendarEvent } from './calendar-event'
import { shareOrDownloadCalendarFile } from './calendar-share'
import { createBookingCalendarFile } from './ical'

type UseBookingCalendarActionResult = {
  addToCalendar: (() => Promise<void>) | undefined
  isEnabled: boolean
}

export function useBookingCalendarAction(
  selection: BookingSlotSelection,
): UseBookingCalendarActionResult {
  const { settings } = useUserSettings()
  const isEnabled = settings.calendarExportEnabled

  const addToCalendar = useCallback(async () => {
    try {
      const event = createBookingCalendarEvent(selection)
      const file = createBookingCalendarFile(event)

      await shareOrDownloadCalendarFile(file, {
        text: `Add ${event.title} to your calendar.`,
        title: 'Add to calendar',
      })
    } catch {
      // Calendar export is non-critical and must not change booking success.
    }
  }, [selection])

  return {
    addToCalendar: isEnabled ? addToCalendar : undefined,
    isEnabled,
  }
}
