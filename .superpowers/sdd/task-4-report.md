## Task 4 Report

- Status: completed
- Branch: `feature/calendar-export`
- Baseline commit: `d0dab1b`

### Scope Delivered

- Added `src/features/calendar/ical.ts`
- Added `src/features/calendar/ical.test.ts`
- Implemented `serializeCalendarEvent(event)`
- Implemented `createBookingCalendarFile(event)`

### TDD Evidence

1. Wrote failing tests first in `src/features/calendar/ical.test.ts`
2. Ran:
   - `mise exec -- pnpm exec vitest run src/features/calendar/ical.test.ts`
3. Observed red state:
   - failure because `./ical` did not exist yet
4. Implemented minimal production code in `src/features/calendar/ical.ts`
5. Re-ran:
   - `mise exec -- pnpm exec vitest run src/features/calendar/ical.test.ts`
6. Observed green state:
   - `1 passed`, `2 passed`

### Behavior Covered

- Serializes a `BookingCalendarEvent` into `.ics` text
- Includes `VCALENDAR` metadata
- Includes `VTIMEZONE` for `Europe/Helsinki`
- Uses `DTSTART;TZID=Europe/Helsinki:...`
- Uses `DTEND;TZID=Europe/Helsinki:...`
- Escapes RFC 5545 text characters for summary, description, and location
- Uses CRLF line endings with trailing newline
- Wraps the payload in a browser `File`
- Uses filename from the event model
- Uses MIME type `text/calendar;charset=utf-8`

### Notes

- Kept implementation limited to Task 4 files only
- Left unrelated untracked `docs/superpowers/` artifacts untouched

### Review Fix Pass

- Fixed serializer self-consistency by always emitting `DTSTART` and `DTEND` with `TZID=Europe/Helsinki`
- Added RFC 5545 line folding for serialized content lines at 75 octets with space-prefixed continuation lines
- Added focused regression tests for timezone pinning and folded content output

### Review Fix Test Summary

- Command: `mise exec -- pnpm exec vitest run src/features/calendar/ical.test.ts`
- Red run: failed with `3 failed, 1 passed` while the new timezone and folding expectations were unmet
- Command: `mise exec -- pnpm exec vitest run src/features/calendar/ical.test.ts`
- Green run: passed with `1 passed` test file and `4 passed` tests
