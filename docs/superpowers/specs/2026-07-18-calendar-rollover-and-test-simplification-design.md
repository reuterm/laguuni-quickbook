# Calendar Rollover And Test Simplification

## Scope

Address two review findings in the calendar-export work:

- Remove an implementation-detail assertion from the failed-booking sheet-flow test.
- Produce a valid next-day calendar end timestamp for bookings that end at midnight.

## Failed Booking Test

Remove the standalone failed completed-booking test. Extend the existing failed-result
test with an assertion that the add-to-calendar action is absent, alongside its
existing diagnostics assertion. Do not retain a spy on `useBookingCalendarAction`,
because the hook call is not observable behavior and may change without affecting the
result panel.

## Calendar End Date

Calendar `DTSTART` and `DTEND` are Helsinki wall-clock timestamps. The existing
string formatting remains responsible for formatting the canonical local date and
`HH:mm` time values without introducing browser-timezone conversion.

`createBookingCalendarEvent` will derive the end date separately. When the end time
is less than or equal to the start time, it will advance the booking date by one
calendar day using the existing local-date utilities: `parseLocalDate`,
`addCalendarDays`, and `formatLocalDate`. Otherwise, the end date remains the
booking date.

## Tests

Add a calendar-event regression test for a `2026-06-02`, `23:00` to `00:00`
selection. It must produce `20260602T230000` as the start and
`20260603T000000` as the end. Existing normal same-day event and timestamp tests
remain unchanged.

## Non-Goals

- Do not change the controller finalization error boundaries.
- Do not replace all calendar formatting with date-fns formatting.
- Do not change calendar export UI behavior.
