# Multi-Slot Review And Calendar Design

## Scope

PR 2 presents arbitrary booking selections in the booking sheet and preserves calendar export after a successful multi-slot booking. It consumes PR 1's service contract: selections can span cables, but there is at most one selection for any calendar date. It does not add calendar selection UI.

## Review Sheet

The booking sheet has a count-based summary: its header and compact details card show the number of selected slots, not a cable name. The scrollable selected-slots list renders every selection in chronological order. Each row includes the cable label, formatted date, and time range so mixed-cable selections are unambiguous.

The list remains capped and scrollable for long bookings. The same presentation structure is used for one and many selections; a single selection simply renders one row.

`BookingSheetFlow` derives this presentation from the selection array for confirm, submitting, and completed states. The sheet controller continues to carry the original selection array through its existing state transitions. A dismiss before submission remains non-destructive; completed failures retain their current cleanup behavior.

## Calendar Export

A successful booking retains the Add to calendar action for any number of selections. The action produces one `.ics` file with one `VCALENDAR`, one shared Helsinki `VTIMEZONE`, and one `VEVENT` for each selection. RFC 5545 permits a calendar object to contain one or more calendar components.

Each event retains the selected cable's label, date, and time. Its UID combines the booking/order identifier and the selection date. This is unique within the export because the service rejects all duplicate dates across all cables. The downloaded filename is based on the booking identifier rather than one individual slot.

The calendar share/download flow remains a single-file action. Failures remain non-fatal and show the existing calendar-export error message. The prior single-slot calendar export behavior is preserved.

## Testing

- Presentation helper tests cover chronological ordering, mixed-cable rows, and one-selection output.
- Sheet and flow tests cover the count summary, long-list scroll container, confirm/submitting/completed states, and multi-slot calendar action visibility.
- Calendar event tests cover date-derived UIDs.
- Calendar serialization tests cover one `VCALENDAR` containing multiple `VEVENT`s with a single timezone block.
- Calendar action tests cover exporting all supplied selections as one file and preserve the existing one-selection export path.

## Exclusions

- No calendar or availability selection controls.
- No changes to the one-slot-per-day service invariant.
- No new multiple-file calendar download behavior.
