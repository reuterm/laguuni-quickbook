# ADR 003: Local diagnostics event log and export model

## Status

Accepted

## Summary

| Question | Decision |
| --- | --- |
| Where should diagnostics live? | In a local-only browser event log persisted on the device |
| What does diagnostics infrastructure own? | Event persistence, retention, recovery, correlation metadata, trace creation, filtering, and export |
| What does diagnostics infrastructure not own? | Sanitization or domain-specific interpretation of event payloads |
| How are incidents correlated? | With a runtime-owned `sessionId` and trace-scoped `traceId` values |
| Who creates IDs? | The diagnostics runtime creates both `sessionId` and `traceId` values |
| Who decides when a trace starts? | The workflow boundary that begins an operation, such as booking |
| How are logs retained? | With both max-age and max-entry-count limits |
| How are logs shared? | Through explicit user-triggered export, initially by copying JSON to the clipboard |
| When should diagnostics surface in the UI? | Only when useful, especially around failures and troubleshooting |

## Context

Laguuni Quickbook is a browser-only application with no backend and no centralized logging service.

The application already has a local diagnostics buffer and a visible trace ID in booking-related status UI. That foundation is useful, but it is currently limited:

- diagnostics are mostly booking-specific
- retention is bounded by count only
- export exists only as a code-level capability
- the current trace ID behaves more like an app/session identifier than an incident identifier

The product goal for diagnostics is:

- collect useful background diagnostics without surfacing them during normal use
- avoid unbounded growth on user devices
- allow users to export diagnostics when an error occurs
- make exported diagnostics easy to correlate to the failure that prompted the export
- preserve the app's local-only privacy model

## Decision

Adopt a local diagnostics event log with a generic event envelope, bounded retention, explicit user-driven export, and runtime-owned correlation identifiers.

### 1. Diagnostics remain local-only

Diagnostics events are stored only in the browser on the user's device.

The application does not send diagnostics to a server or third-party logging service in V1.

Logs leave the device only when the user explicitly chooses to export them.

### 2. Diagnostics infrastructure stays domain-agnostic

The diagnostics layer is intentionally a generic event sink.

Its responsibilities are:

- accept events
- stamp metadata
- persist events locally
- prune retained history
- recover safely from corrupted stored state
- filter by correlation identifiers
- export logs for user sharing

Its responsibilities do not include:

- sanitizing event payloads
- understanding which fields are sensitive
- rewriting payloads based on event type
- embedding booking-specific or application-specific privacy logic

Event producers are responsible for deciding what data is safe and useful to emit.

That includes:

- booking instrumentation
- API observation adapters
- error mapping layers
- future app-level error capture

### 3. Use a shared event envelope with flexible payload data

Each stored diagnostics entry should contain infrastructure-owned metadata plus producer-provided event data.

Recommended envelope fields:

- `timestamp`
- `event`
- `data`
- `appVersion`
- `platform`
- `sessionId`
- `traceId`

The diagnostics layer owns the envelope and metadata fields.

The producer owns `event` naming and `data` shape.

The payload model should be flexible enough to support a broad range of future diagnostics events without forcing the store to know application semantics.

### 4. Correlate by session and trace

Diagnostics should distinguish between:

- `sessionId`: a stable identifier for the current loaded app instance
- `traceId`: an identifier for a single operation or incident

The initial implementation should generate a new `traceId` for each booking attempt.

That trace ID should be shown in relevant booking failure UI and used to filter exported diagnostics.

### 5. Ownership of session and trace identifiers

The diagnostics runtime owns identifier generation.

`sessionId` is created when the root diagnostics service is constructed during app startup. It remains stable for the lifetime of the current loaded app instance and is attached automatically to every recorded event.

`sessionId` is not persisted across reloads in the initial design.

`traceId` is also created by the diagnostics runtime, but its lifecycle is controlled by the caller that starts a new operation or incident scope.

This means:

- diagnostics infrastructure generates both `sessionId` and `traceId`
- the app shell owns creation of the diagnostics runtime and therefore starts the session scope
- feature code owns the decision of when a new trace begins
- feature code does not generate IDs itself

In the initial implementation:

- `AppProviders` creates the root diagnostics runtime and therefore creates the `sessionId`
- the booking workflow starts a new trace for each booking attempt
- all diagnostics emitted during that attempt use the same `traceId`
- the booking result UI shows that operation's `traceId`

### 6. Trace creation happens at workflow boundaries

A trace should be started deliberately at the point where an operation begins.

The diagnostics API should support a trace-scoped appender shape such as:

```ts
const trace = diagnostics.beginTrace({ name: 'booking' })
trace.append({
  event: 'booking.started',
  data: {
    cableId: selection.cableId,
  },
})
```

Recommended API shape:

```ts
type Diagnostics = {
  readonly sessionId: string
  beginTrace(options?: { name?: string }): DiagnosticsTrace
  loadState(): DiagnosticsLoadResult
  exportLogs(options?: { traceId?: string }): string
  clear(): void
}

type DiagnosticsTrace = {
  readonly traceId: string
  append(event: DiagnosticEvent): void
}
```

The root diagnostics service owns storage, export, and trace creation.

The trace object owns append operations within a single incident or workflow.

The diagnostics system should not rely on implicit ambient trace state.

Explicit trace scopes are preferred because they are easier to reason about, easier to test, and keep ownership clear across async service boundaries.

### 7. Services operate within traces rather than creating them

Workflow entry points should create traces and pass the scoped trace object explicitly into lower layers that need to emit diagnostics.

For the initial booking flow, this means the booking workflow boundary should create the trace, and the booking service should receive that trace as a separate argument rather than embedding it inside the booking request object.

This keeps trace lifecycle visible at the workflow entry point and allows the UI to know the `traceId` immediately.

### 8. Retain diagnostics with both age and count limits

Diagnostics storage must not grow indefinitely.

Retention should be bounded by:

- maximum age
- maximum entry count

Oldest entries should be pruned first.

Recommended initial defaults:

- `maxAgeDays = 7`
- `maxEntries = 200`

Pruning should happen both when loading stored diagnostics and when appending new events.

### 9. Export is explicit and trace-focused

Diagnostics should be exportable in a form that is easy for a user to send as a support/debugging artifact.

Initial export behavior:

- export JSON text
- include recovery metadata if relevant
- support export of all retained events
- support export filtered by `traceId`

The initial user-facing export mechanism should be copying diagnostics text to the clipboard.

### 10. Diagnostics stay in the background unless needed

Diagnostics should not introduce a persistent user-visible logging surface in normal use.

They should surface only when helpful, especially:

- after a booking failure
- after an unexpected application error
- during explicit support or troubleshooting flows

The first user-facing export action should live close to the booking failure UI where the trace ID is already relevant.

## Why this approach

### It fits the product architecture

The app is browser-only and already follows a local-first persistence model for user data and diagnostics.

A local diagnostics log is consistent with that architecture and does not require backend infrastructure.

### It improves supportability without adding operational complexity

A trace-filtered export gives enough context to debug failures without introducing centralized observability infrastructure.

### It keeps privacy and diagnostics responsibilities separated correctly

The diagnostics store should not become a hidden application-policy engine.

Keeping privacy-safe shaping at the producer boundary preserves clean architecture:

- producers know the domain
- diagnostics infrastructure knows storage and export behavior

### It provides a stable foundation for future instrumentation

A generic envelope plus flexible payloads allows future diagnostics coverage for:

- booking
- app-level runtime errors
- availability loading
- settings recovery issues
- other operational flows

without redesigning the storage layer around each feature.

## Consequences

### Positive

- diagnostics stay aligned with the app's local-only privacy model
- incident-specific `traceId` values make exports more useful
- bounded retention avoids unbounded storage growth
- the diagnostics layer remains simple and reusable
- export can be added incrementally without a large diagnostics UI
- trace ownership remains explicit across async workflow boundaries

### Trade-offs

- the system relies on producer discipline to avoid emitting sensitive data
- exported diagnostics quality depends on instrumentation quality
- local storage remains a modest-capacity persistence layer
- there is no centralized visibility into failures unless the user exports diagnostics manually
- callers must pass trace objects explicitly into lower layers that emit diagnostics

## Implementation notes

The initial implementation should proceed in this order:

1. Refactor the diagnostics store around the generic event envelope, filtering, and dual retention policy.
2. Introduce runtime-owned `sessionId` creation and `beginTrace({ name })`.
3. Update booking flow to create a trace per booking attempt at the workflow boundary.
4. Update the booking service to consume a scoped trace passed separately from the booking request.
5. Add contextual export in booking failure UI.
6. Add app-level unexpected error capture on top of the same diagnostics foundation.

## Non-goals

This ADR does not introduce:

- remote log shipping
- analytics
- user accounts or cross-device syncing
- a permanent in-app diagnostics console
- diagnostics-layer sanitization logic
- implicit ambient trace propagation
- a guarantee that arbitrary raw application data is always safe to emit

## Future evolution

Later work may add:

- app-level error boundary and unhandled rejection diagnostics
- a secondary manual export entry point in Settings
- file download export in addition to clipboard copy
- storage migration if `localStorage` proves too limited
- persisted session identifiers if a future support workflow needs them
- stronger producer-side instrumentation helpers and review conventions
