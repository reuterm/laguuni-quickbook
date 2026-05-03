# UI refactor plan

## Status

Draft

## Plan version

0.1

## Relationship to the walking skeleton

This plan is a follow-up to [`001-walking-skeleton.md`](001-walking-skeleton.md).

The walking skeleton established the functional shape of the application:

- availability overview
- cable switching
- local settings persistence
- mocked booking flow
- booking result states

This plan assumes that functional baseline exists and focuses on the next phase: evolving the product into a more deliberate, mobile-first UI using **shadcn/ui**.

## Purpose

Replace the current bespoke UI with a shared shadcn/ui-based component foundation while improving the interaction model of the app.

The goal is **not** to swap HTML elements 1:1. The goal is to make the product feel more coherent and more obviously optimized for the primary job:

- open the app
- review availability
- pick a slot
- book quickly

## UX direction

### 1. Availability becomes the primary surface

The app should no longer treat Availability and Settings as equal peer destinations.

For this phase:

- **Availability** remains the main screen
- **Settings** moves behind a secondary entry point
- settings should open in a **sheet/dialog**

This keeps the main booking workflow in focus and makes the product feel more like a quick-booking tool than a two-screen utility shell.

### 2. Keep the booking loop compact on mobile

The primary interaction loop should stay visually tight:

1. choose cable
2. scan dates and slots
3. tap **Book**
4. understand the result immediately

### 3. Improve hierarchy and feedback

The refactor should make these elements clearer than they are today:

- which cable is active
- which slots are grouped under which day
- whether booking is in progress
- whether payment is still required
- where settings live

## Current implementation baseline

The current app already has the right feature boundaries, so the refactor should build on them rather than flatten them.

Relevant current areas:

- `src/app/App.tsx`
- `src/app/App.css`
- `src/features/availability/components/*`
- `src/features/availability/availability.css`
- `src/features/settings/components/*`
- `src/features/settings/settings.css`
- `src/features/booking/components/*`
- `src/features/booking/booking.css`

## UI foundation

Use **shadcn/ui** as the shared UI foundation for this phase.

Expected adoption shape:

- generated/shared primitives live in `src/components/ui/`
- feature composition stays in feature folders
- app-shell helpers can live in a shared layer such as `src/components/app-shell/`

The refactor should introduce Tailwind and shadcn in a way that keeps product behavior separate from presentation primitives.

## Recommended component usage

Start with a small, justified component set.

| Need | Likely shadcn component |
| --- | --- |
| primary and secondary actions | `button` |
| grouped screen sections | `card` |
| text inputs | `input` |
| field labels | `label` |
| default cable picker | `select` |
| cable switching | `tabs` or `toggle-group` |
| settings entry | `sheet` or `dialog` |
| status and error messaging | `alert` |
| lightweight metadata | `badge` |
| loading states | `skeleton` |

Do not add components just because they exist in shadcn/ui. Add them only where they improve the app.

## Screen-level redesign goals

### Availability screen

Refactor the availability screen to:

- use a clearer page header
- surface the settings entry point without competing with the booking flow
- replace the current cable pill buttons with a stronger selection control
- present day groups as clearer information blocks
- make slot actions more obvious on mobile
- improve loading, empty, and error states

Possible structure:

- header
- booking status / result feedback
- cable switcher
- grouped slot content

### Booking status

Booking feedback should remain close to the availability content and use stronger state presentation:

- in progress
- success
- payment required
- failure

The existing trace ID should remain visible where useful, but it should not dominate the screen.

### Settings flow

Refactor settings into a sheet/dialog-based flow that still feels comfortable on mobile.

The settings form should:

- use shared form primitives
- keep the local-only privacy model explicit
- retain the existing fields and persistence behavior
- avoid turning settings into a large account-management surface

## Migration approach

### Slice 1: foundation

- add Tailwind configuration
- install and initialize shadcn/ui
- add the first shared primitives
- decide whether the UI foundation should also be recorded as a new ADR

### Slice 2: app shell

- refactor `App.tsx`
- remove equal-peer Availability/Settings navigation
- add the availability-first shell and settings entry point

### Slice 3: availability redesign

- migrate cable switching
- migrate grouped slot layout
- migrate loading / error / empty states
- migrate booking feedback presentation

### Slice 4: settings redesign

- rebuild the settings form with shared primitives
- move settings into the chosen secondary interaction pattern
- preserve persistence behavior and recovery messaging

### Slice 5: cleanup

- remove superseded CSS
- align tests with the new interaction model
- update docs that describe screen structure

## Testing strategy

Keep the current testing approach from the walking skeleton:

- no real API calls in automated tests
- MSW-backed fixtures remain the source of mocked storefront behavior

UI refactor testing should focus on user-visible behavior:

- settings entry and dismissal
- cable switching
- slot booking action availability
- booking state presentation
- settings persistence still working after the shell changes

Tests should prefer roles, labels, and visible copy over brittle markup-based assertions.

## Non-goals for this phase

- changing booking domain rules
- changing the storefront API contract
- adding backend services
- adding new product features unrelated to the UI migration
- redesigning the app into a multi-screen navigation system beyond what this phase needs

## Exit criteria

This refactor phase is complete when:

1. shadcn/ui is established as the main UI foundation
2. Availability is the clear primary surface
3. Settings is accessible through the new secondary flow
4. The availability and settings experiences no longer depend on the current bespoke screen CSS structure
5. Existing booking behavior still works under the mocked integration flow
6. Tests remain green with assertions aligned to the new interaction model
