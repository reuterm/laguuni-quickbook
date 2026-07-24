# Developer Calendar Export Test Design

## Goal

Provide an on-device test for sharing a valid, two-event iCalendar file without creating bookings against the live backend.

## Scope

The test is available only in the existing Settings developer-tools section, which is already hidden behind the persisted seven-tap developer-mode unlock.

The fixture contains two successful-booking-equivalent selections:

- Pro cable on one fixed day.
- Easy cable on the following fixed day.

The action creates one `.ics` file with two `VEVENT` components and opens the existing native share/download path.

## Architecture

Extract the non-React calendar export sequence currently inside `useBookingCalendarAction` into a shared function. It accepts selections and a booking identifier, creates calendar events, serializes them into one file, and passes that file to `shareOrDownloadCalendarFile`.

The successful-booking hook calls this shared function unchanged. The developer-tools action calls the same function with the fixed fixture. This ensures the test exercises the same event creation, iCalendar serialization, file MIME type, feature detection, native share call, and download fallback as production.

## User Experience

Settings developer tools gains a `Test two-event calendar export` button. The control reports a concise success or failure beneath the button. Share cancellation does not display an error, matching the booking flow.

The action never calls booking or availability APIs and does not alter booking state.

## Testing

Add unit coverage for the shared export function using two different-day, mixed-cable selections. Verify a single calendar file contains both events and is passed to the share helper.

Extend Settings developer-mode coverage to verify the action is hidden when developer mode is disabled, invokes the test exporter when enabled, and reports failure appropriately.

The existing completed multi-slot Storybook story remains the visual baseline for a successful multi-event booking.
