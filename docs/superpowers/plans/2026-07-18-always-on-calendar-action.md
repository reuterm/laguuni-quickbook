# Always-on Calendar Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Always offer calendar export after a successful booking while removing the unshipped calendar-export preference from settings and storage.

**Architecture:** Calendar export remains owned by `BookingSheetFlow`, which creates the action only for completed successful bookings. `BookingResultPanel` renders the action whenever that success-only callback is supplied. The user-settings model and its persistence return to containing only actual booking and display preferences.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Storybook 9, browser localStorage.

## Global Constraints

- Do not add a feature flag, migration, or compatibility handling for `calendarExportEnabled`; the feature has not shipped.
- Calendar-export errors must remain inline feedback and must not alter booking success, dismissal, or booking follow-up work.
- The action appears only for completed successful bookings; payment-required and failed results preserve their existing actions.
- Keep changes focused on the calendar action and settings model.

---

## File Structure

- Modify: `src/domain/settings.ts` removes the calendar-export field and default.
- Modify: `src/lib/storage/local-storage.ts` stops reading, validating, and serializing the removed field.
- Modify: `src/lib/storage/local-storage.test.ts` verifies the reduced persisted schema and normal validation behavior.
- Modify: `src/features/settings/components/SettingsScreen.tsx` removes the checkbox and its draft-state handler.
- Modify: `src/features/settings/components/SettingsScreen.test.tsx` verifies retained settings without the removed control.
- Modify: `.storybook/fixture-data.ts` deletes the obsolete settings fixture.
- Modify: `src/features/settings/components/SettingsScreen.stories.tsx` deletes the toggle-specific story.
- Modify: `src/features/booking/components/BookingResultPanel.tsx` removes the redundant visibility prop and renders its provided success callback directly.
- Modify: `src/features/booking/components/BookingResultPanel.test.tsx` removes the redundant prop from action tests.
- Modify: `src/features/booking/components/BookingResultPanel.stories.tsx` makes the default success story demonstrate its action.
- Modify: `src/features/booking/components/BookingSheetFlow.tsx` always supplies the success-only calendar action.
- Modify: `src/features/booking/components/BookingSheetFlow.test.tsx` removes settings setup and verifies the action for default successful bookings.
- Modify: `src/features/booking/components/BookingSheetFlow.stories.tsx` removes calendar-setting parameters and obsolete toggle-state stories.

### Task 1: Remove Calendar Export From Persisted Settings

**Files:**
- Modify: `src/domain/settings.ts:3-30`
- Modify: `src/lib/storage/local-storage.ts:12-24,89-99,128-174`
- Modify: `src/lib/storage/local-storage.test.ts:7-188`

**Interfaces:**
- Consumes: `UserSettings` and `DEFAULT_USER_SETTINGS` from `src/domain/settings.ts`.
- Produces: `UserSettings` without `calendarExportEnabled`; `LocalSettingsStore.save()` serializes only the remaining version-1 settings fields.

- [ ] **Step 1: Write failing storage expectations without the removed field**

In `src/lib/storage/local-storage.test.ts`, remove `calendarExportEnabled` from `FIXTURE_SETTINGS`, every expected default/load result, and persisted JSON. Delete the legacy-default test. Change the invalid-fields fixture to omit the field, including its invalid value. Add this regression test after the legacy payload test:

```ts
  it('ignores unrecognized stored properties', () => {
    const storage = createMemoryStorage({
      [SETTINGS_STORAGE_KEY]: JSON.stringify({
        ...FIXTURE_SETTINGS,
        calendarExportEnabled: 'not a setting',
        version: 1,
      }),
    })
    const store = new LocalSettingsStore({ storage })

    expect(store.load()).toEqual(FIXTURE_SETTINGS)
    expect(store.loadState().recoveryIssue).toBeNull()
  })
```

- [ ] **Step 2: Run the focused storage test to verify it fails**

Run: `mise exec -- pnpm exec vitest run src/lib/storage/local-storage.test.ts`

Expected: FAIL because `UserSettings` and persisted results still require or include `calendarExportEnabled`.

- [ ] **Step 3: Remove the field from the settings model and storage codec**

In `src/domain/settings.ts`, change the type and default to:

```ts
export type UserSettings = {
  availabilityView: 'cards' | 'calendar'
  name: string
  phone: string
  email: string
  seasonPassCode: string
  defaultCable: CableId | null
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  availabilityView: 'cards',
  name: '',
  phone: '',
  email: '',
  seasonPassCode: '',
  defaultCable: null,
}
```

In `src/lib/storage/local-storage.ts`, remove `calendarExportEnabled` from `StoredUserSettingsFields`, `createStoredSettings`, the decoded `settings` object, and `hasInvalidFields`. Do not replace it with a migration or an unknown-property validation check.

- [ ] **Step 4: Run the focused storage test to verify it passes**

Run: `mise exec -- pnpm exec vitest run src/lib/storage/local-storage.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the settings-schema change**

```bash
git add src/domain/settings.ts src/lib/storage/local-storage.ts src/lib/storage/local-storage.test.ts
git commit -m "refactor: remove calendar export setting"
```

### Task 2: Remove Calendar Export From Settings UI And Fixtures

**Files:**
- Modify: `src/features/settings/components/SettingsScreen.tsx:34-37,135-142,237-253`
- Modify: `src/features/settings/components/SettingsScreen.test.tsx:23-72`
- Modify: `.storybook/fixture-data.ts:31-34`
- Modify: `src/features/settings/components/SettingsScreen.stories.tsx:3-8,41-49`

**Interfaces:**
- Consumes: the reduced `UserSettings` model produced by Task 1.
- Produces: a settings screen with no calendar-export checkbox and Storybook fixtures/stories that do not model calendar export as a preference.

- [ ] **Step 1: Write failing settings-screen expectations for the removed control**

In the first test in `src/features/settings/components/SettingsScreen.test.tsx`, delete the checkbox click and the restored-checkbox assertion. After reopening settings, assert the removed control is absent:

```ts
    expect(
      screen.queryByRole('checkbox', {
        name: 'Show add-to-calendar action after successful booking',
      }),
    ).not.toBeInTheDocument()
```

- [ ] **Step 2: Run the focused settings test to verify it fails**

Run: `mise exec -- pnpm exec vitest run src/features/settings/components/SettingsScreen.test.tsx`

Expected: FAIL because the checkbox is still rendered.

- [ ] **Step 3: Remove the settings control and obsolete Storybook fixture**

In `SettingsScreen.tsx`:

- Change `EditableField` to exclude only `'availabilityView' | 'defaultCable'`.
- Delete `handleCalendarExportEnabledChange`.
- Delete the `FormField` whose label is `Show add-to-calendar action after successful booking`.

In `.storybook/fixture-data.ts`, delete:

```ts
export const CALENDAR_EXPORT_SETTINGS: UserSettings = {
  ...BOOKING_ENABLED_SETTINGS,
  calendarExportEnabled: true,
}
```

In `SettingsScreen.stories.tsx`, remove the `CALENDAR_EXPORT_SETTINGS` import and the `CalendarExportEnabled` export.

- [ ] **Step 4: Run the focused settings test to verify it passes**

Run: `mise exec -- pnpm exec vitest run src/features/settings/components/SettingsScreen.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the settings UI cleanup**

```bash
git add src/features/settings/components/SettingsScreen.tsx src/features/settings/components/SettingsScreen.test.tsx .storybook/fixture-data.ts src/features/settings/components/SettingsScreen.stories.tsx
git commit -m "refactor: remove calendar export preference UI"
```

### Task 3: Always Supply The Successful Booking Calendar Action

**Files:**
- Modify: `src/features/booking/components/BookingResultPanel.tsx:10-46`
- Modify: `src/features/booking/components/BookingResultPanel.test.tsx:13-102`
- Modify: `src/features/booking/components/BookingResultPanel.stories.tsx:23-39`
- Modify: `src/features/booking/components/BookingSheetFlow.tsx:143-150`
- Modify: `src/features/booking/components/BookingSheetFlow.test.tsx:6-10,133-363`
- Modify: `src/features/booking/components/BookingSheetFlow.stories.tsx:1-10,51-90`

**Interfaces:**
- Consumes: `useBookingCalendarAction(selection, orderIdentifier)` for completed successful bookings.
- Produces: `BookingResultPanel` with `onAddToCalendar?: () => Promise<void>` as the sole calendar-action visibility signal; `BookingSheetFlow` supplies it for every successful booking.

- [ ] **Step 1: Write failing always-on action tests**

In `BookingResultPanel.test.tsx`, remove `showAddToCalendar` from all renders. The existing successful-booking test must still expect and click `Add to calendar`; the non-success test must still assert it is absent.

In `BookingSheetFlow.test.tsx`:

- Remove `DEFAULT_USER_SETTINGS`, `SETTINGS_STORAGE_KEY`, `BrowserStorage`, `createMemoryStorage`, `UserSettingsProvider`, and `TestProviders` when no longer used.
- Render the completed-success test directly, without storage setup, and retain the expectation that clicking `Add to calendar` calls `shareOrDownloadCalendarFileMock`.
- Delete `keeps add to calendar hidden when the calendar export setting is disabled`.
- Remove all `calendarExportEnabled: true` storage fixtures from the UID, cancellation, and failure tests; render each `BookingSheetFlow` directly.

- [ ] **Step 2: Run the focused booking component tests to verify they fail**

Run: `mise exec -- pnpm exec vitest run src/features/booking/components/BookingResultPanel.test.tsx src/features/booking/components/BookingSheetFlow.test.tsx`

Expected: FAIL because `BookingResultPanel` still requires `showAddToCalendar`, and `BookingSheetFlow` still reads a disabled default setting.

- [ ] **Step 3: Make the callback the only visibility condition and clean stories**

In `BookingResultPanel.tsx`, delete `showAddToCalendar` from `BookingResultPanelProps` and component props. Set the action prop as follows:

```tsx
onAddToCalendar={result.status === 'success' ? onAddToCalendar : undefined}
```

In `BookingSheetFlow.tsx`, replace:

```tsx
showAddToCalendar={bookingCalendarAction.isEnabled}
```

with no prop. The hook’s `addToCalendar` callback is always supplied for successful results.

In `BookingResultPanel.stories.tsx`, add `onAddToCalendar: noopAsync` to `Success`, delete `SuccessWithCalendarAction`, and keep payment/failed stories without the callback.

In `BookingSheetFlow.stories.tsx`, remove `CALENDAR_EXPORT_SETTINGS` and all `parameters.settings` entries. Delete `CompletedFailedWithCalendarEnabled`; keep `CompletedSuccessfulBooking` as the default successful-calendar-action story and retain the payment-required story without a calendar action.

- [ ] **Step 4: Run the focused booking component tests to verify they pass**

Run: `mise exec -- pnpm exec vitest run src/features/booking/components/BookingResultPanel.test.tsx src/features/booking/components/BookingSheetFlow.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the always-on booking action**

```bash
git add src/features/booking/components/BookingResultPanel.tsx src/features/booking/components/BookingResultPanel.test.tsx src/features/booking/components/BookingResultPanel.stories.tsx src/features/booking/components/BookingSheetFlow.tsx src/features/booking/components/BookingSheetFlow.test.tsx src/features/booking/components/BookingSheetFlow.stories.tsx
```

### Task 4: Verify The Reduced Surface

**Files:**
- Verify: `src/domain/settings.ts`
- Verify: `src/lib/storage/local-storage.ts`
- Verify: `src/features/settings/components/SettingsScreen.tsx`
- Verify: `src/features/booking/components/BookingResultPanel.tsx`
- Verify: `src/features/booking/components/BookingSheetFlow.tsx`

**Interfaces:**
- Consumes: all implementation changes from Tasks 1-3.
- Produces: verified TypeScript, test, lint, and production build results.

- [ ] **Step 1: Confirm no obsolete setting references remain**

Run: `rg -n "calendarExportEnabled|CALENDAR_EXPORT_SETTINGS|showAddToCalendar" src .storybook`

Expected: no matches.

- [ ] **Step 2: Run the full test suite**

Run: `mise exec -- pnpm exec vitest run`

Expected: PASS.

- [ ] **Step 3: Run static checks and production build**

Run: `mise exec -- pnpm exec tsc -b && mise exec -- pnpm exec tsc -p tsconfig.storybook.json && mise exec -- pnpm lint && mise exec -- pnpm vite build`

Expected: every command exits 0.

- [ ] **Step 4: Inspect the final worktree**

Run: `git status --short`

Expected: only the implementation commits and intentionally uncommitted plan documentation are present; do not create an empty verification commit.
