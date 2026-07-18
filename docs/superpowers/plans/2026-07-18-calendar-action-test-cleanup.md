# Calendar Action Test Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make successful booking results select the Add to calendar UI action, require the calendar and diagnostics callbacks throughout the result flow, and remove tests that only cover the former optional-callback behavior.

**Architecture:** `getBookingResultPresentation()` remains the single source of truth for which result action renders. `BookingResultPanel` and `BookingSheetFlow` receive required calendar and diagnostics callbacks, and focused tests exercise selected actions rather than callback availability; `BookingSheetFlow` only verifies calendar export is wired for a successful completed booking.

**Tech Stack:** TypeScript, React, Vitest, Testing Library

## Global Constraints

- Do not change calendar export behavior, inline error copy, payment links, or diagnostics behavior.
- Do not add compatibility paths for omitted callbacks.
- Keep the change limited to booking-result presentation and its focused tests.

---

### Task 1: Select the calendar action for successful results

**Files:**
- Modify: `src/features/booking/booking-result-presentation.test.ts:8-23`
- Modify: `src/features/booking/booking-result-presentation.ts:39-48`

**Interfaces:**
- Consumes: `BookingFlowResult` success variant and `getBookingResultPresentation(result, selectionLabel)`.
- Produces: a success `BookingResultPresentation` whose `action` is `{ kind: 'add-to-calendar' }`.

- [ ] **Step 1: Update the success presentation expectation**

Replace the success action assertion with:

```ts
action: { kind: 'add-to-calendar' },
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/features/booking/booking-result-presentation.test.ts`

Expected: FAIL because the success presentation currently returns `{ kind: 'none' }`.

- [ ] **Step 3: Select the calendar action in the success presentation**

In the `case 'success'` return value, replace:

```ts
action: { kind: 'none' },
```

with:

```ts
action: { kind: 'add-to-calendar' },
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- src/features/booking/booking-result-presentation.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the presentation action change**

```bash
git add src/features/booking/booking-result-presentation.ts src/features/booking/booking-result-presentation.test.ts
git commit -m "refactor: select calendar action for successful bookings"
```

### Task 2: Remove obsolete panel callback-presence coverage

**Files:**
- Modify: `src/features/booking/components/BookingResultPanel.test.tsx:12-212`

**Interfaces:**
- Consumes: `BookingResultPanel` with required props `onAddToCalendar: () => Promise<void>` and `onExportTrace: (traceId: string) => Promise<void>`.
- Produces: panel tests that cover selected calendar, payment, and diagnostics actions without testing omitted callback behavior.

- [ ] **Step 1: Update retained fixtures to pass both required callbacks**

Add no-op callbacks to the calendar tests, diagnostics tests, and payment test where absent:

```tsx
onAddToCalendar={async () => {}}
onExportTrace={async () => {}}
```

Keep the existing spies in tests that assert the corresponding callback was invoked.

- [ ] **Step 2: Remove obsolete tests**

Delete these complete test cases:

```ts
it('does not show an add to calendar action for non-success results', () => {
  // Remove the entire test.
})

it('does not show copy diagnostics without an export callback', () => {
  // Remove the entire test.
})
```

They assert behavior based on callbacks being unavailable or on the old success-only callback wiring, neither of which remains an API behavior.

- [ ] **Step 3: Run the focused panel test suite**

Run: `npm test -- src/features/booking/components/BookingResultPanel.test.tsx`

Expected: PASS. The retained calendar click/rejection, diagnostics, and payment-link tests pass with the required props.

- [ ] **Step 4: Commit the test cleanup**

```bash
git add src/features/booking/components/BookingResultPanel.test.tsx
git commit -m "test: remove obsolete booking result callback cases"
```

### Task 3: Simplify flow-level calendar wiring coverage

**Files:**
- Modify: `src/features/booking/components/BookingSheetFlow.test.tsx:127-181`

**Interfaces:**
- Consumes: a completed successful `BookingSheetFlow` state and the mocked `shareOrDownloadCalendarFile`.
- Produces: one flow test that asserts clicking Add to calendar invokes calendar export for successful bookings.

- [ ] **Step 1: Remove the payment rerender and visibility assertion**

In `wires add to calendar only for completed successful bookings`, remove the `rerender` binding, the payment-required rerender, and the assertion that the Add to calendar button is absent. Rename the test to:

```ts
it('wires add to calendar for completed successful bookings', async () => {
```

Leave the successful render, button click, and export-call expectation intact.

- [ ] **Step 2: Run the focused flow test suite**

Run: `npm test -- src/features/booking/components/BookingSheetFlow.test.tsx`

Expected: PASS. Calendar export remains wired for a completed successful booking.

- [ ] **Step 3: Run all affected booking tests**

Run: `npm test -- src/features/booking/booking-result-presentation.test.ts src/features/booking/components/BookingResultPanel.test.tsx src/features/booking/components/BookingSheetFlow.test.tsx`

Expected: PASS.

- [ ] **Step 4: Commit the focused flow test simplification**

```bash
git add src/features/booking/components/BookingSheetFlow.test.tsx
git commit -m "test: simplify calendar flow coverage"
```

### Task 4: Require diagnostics export throughout the booking flow

**Files:**
- Modify: `src/features/booking/components/BookingSheetFlow.tsx:14-152`
- Modify: `src/features/booking/components/BookingResultPanel.tsx:51-98`
- Modify: `src/features/booking/components/BookingSheetFlow.test.tsx:26-334`

**Interfaces:**
- Consumes: `onExportTrace: (traceId: string) => Promise<void>` supplied by `AvailabilityScreen`.
- Produces: `BookingSheetFlow`, its completed-result helper props, and `BookingResultPanel` action rendering that require the diagnostics callback and always render diagnostics copying for failed results.

- [ ] **Step 1: Update flow tests to provide the required callback**

For every `BookingSheetFlow` fixture that does not assert trace export, add:

```tsx
onExportTrace={async () => {}}
```

Keep the existing `onExportTrace` spy in the diagnostics wiring test.

- [ ] **Step 2: Run type checking to verify the current contract fails**

Run: `npm run typecheck`

Expected: FAIL because `BookingSheetFlow` and its helper components pass their optional `onExportTrace` prop to `BookingResultPanel`, which now requires it.

- [ ] **Step 3: Require diagnostics export at every flow boundary**

In `BookingSheetFlow.tsx`, change each optional callback declaration:

```ts
onExportTrace?: ((traceId: string) => Promise<void>) | undefined
```

to:

```ts
onExportTrace: (traceId: string) => Promise<void>
```

Apply this to `BookingSheetFlowProps`, `CompletedBookingResultPanelProps`, and `CompletedSuccessfulBookingResultPanelProps`.

In `BookingResultPanel.tsx`, remove the unreachable optional-callback guard in the `copy-diagnostics` action:

```tsx
if (onExportTrace === undefined) {
  return null
}
```

- [ ] **Step 4: Verify the completed contract**

Run: `npm test -- src/features/booking/booking-result-presentation.test.ts src/features/booking/components/BookingResultPanel.test.tsx src/features/booking/components/BookingSheetFlow.test.tsx && npm run typecheck`

Expected: PASS. The affected suites pass and TypeScript reports no callback-contract errors.

- [ ] **Step 5: Commit the required diagnostics callback change**

```bash
git add src/features/booking/components/BookingResultPanel.tsx src/features/booking/components/BookingSheetFlow.tsx src/features/booking/components/BookingSheetFlow.test.tsx
git commit -m "refactor: require booking diagnostics export"
```
