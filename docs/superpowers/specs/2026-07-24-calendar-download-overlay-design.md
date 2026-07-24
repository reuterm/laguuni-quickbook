# Calendar Download Overlay Design

## Problem

Calendar export currently prefers the Web Share API when file sharing is available. On HTTPS deployments and installed iOS PWAs, that opens the generic share sheet. On local HTTP, Web Share is unavailable, so the existing download fallback runs and iOS opens the desired calendar import overlay.

## Decision

Always download the generated ICS file on every browser and platform. Calendar export will no longer inspect or invoke the Web Share API.

Replace the share-oriented helper with a download-only API named `downloadCalendarFile`. The helper accepts a `File` and returns a promise resolving to `downloaded` or `failed` so existing asynchronous callers can continue handling the export result without a separate control path.

This decision optimizes the experience on iOS, where the download path has been verified to open the calendar import overlay. Android has no equivalent reliable web flow: Chrome may save the file, and subsequent import depends on installed calendar applications and file associations. Android support is therefore best-effort rather than a guaranteed calendar handoff.

## Data Flow

1. `exportBookingCalendar` converts each booking selection into a calendar event.
2. It creates one ICS `File` containing all selected events.
3. It passes that file to `downloadCalendarFile`.
4. The helper creates a blob URL, assigns it to an anchor, sets the anchor's `download` attribute to the ICS filename, and clicks the anchor.
5. The blob URL is revoked asynchronously after the click so WebKit can process it.

No user-agent, standalone-mode, secure-context, or share-capability branching is introduced.

## Errors

If creating the object URL or clicking the anchor throws, the helper resolves to `failed`. Once an object URL exists, cleanup remains scheduled even when the click throws. A successful click resolves to `downloaded`; browser handling after that point cannot be observed reliably by the application.

## Code Changes

- Rename `calendar-share.ts` to a download-oriented module and expose only `downloadCalendarFile`.
- Remove Web Share options, capability detection, native sharing, and cancellation handling.
- Update `booking-calendar-export.ts` to call the download helper without share metadata.
- Update names and result types in affected tests and callers.

## Tests

- Verify download occurs even when `navigator.share` and `navigator.canShare` are available.
- Verify the blob URL, filename, and anchor click are correct.
- Verify URL revocation is deferred until after the click.
- Verify cleanup is still scheduled when the click throws.
- Verify object-URL and click failures resolve to `failed`.
- Verify booking export creates one ICS file and passes it to the download helper.

Manual verification on iOS will cover deployed Safari and the installed PWA because automated DOM tests cannot assert which native overlay WebKit presents. Manual Android coverage will confirm that Chrome and an installed PWA download a valid ICS file; opening a calendar import UI is not an Android acceptance criterion.
