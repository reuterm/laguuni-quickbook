# Calendar Basket Pressed State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make selected calendar basket slots visibly and semantically pressed without changing PR 3's explicit basket contract.

**Architecture:** Keep `BookingBasketProps` unchanged and derive calendar selection state from it in `AvailabilityCalendarWeek`. Give `AvailabilityCapacityChip` a discriminated static-versus-interactive props contract; every interactive caller explicitly supplies disabled, pressed, and accessible action state.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Storybook 10, Tailwind CSS.

## Global Constraints

- Preserve the explicit `BookingBasketProps` interface through calendar, grid, overview, and screen components.
- A static `AvailabilityCapacityChip` renders without interactive props.
- Every interactive `AvailabilityCapacityChip` requires `onClick`, `disabled`, `pressed`, and `actionLabel`.
- Normal booking chips use `pressed={false}` and `Book ...` accessible labels.
- Basket chips use `pressed` from `basket.isSelected`, and matching `Add ...` or `Remove ...` accessible labels.
- A pressed chip must have a visible selected treatment as well as `aria-pressed="true"`.
- Do not change card/list selection controls, review copy, controller behavior, refresh behavior, replacement behavior, cable selection, or fixed review action.
- Before story changes, consult current Storybook documentation and project story instructions.

---

### Task 1: Make Interactive Chip State Explicit

**Files:**
- Modify: `src/features/availability/components/availability-badge.tsx`
- Modify: `src/features/availability/components/availability-badge.test.tsx`
- Modify: `src/features/availability/components/AvailabilityCalendarWeek.tsx`
- Modify: `src/features/availability/components/AvailabilityCalendarWeek.test.tsx`

**Interfaces:**

```ts
type AvailabilityCapacityChipProps =
  | {
      slot: AvailabilitySlot
      className?: string
    }
  | {
      slot: AvailabilitySlot
      className?: string
      onClick: () => void
      disabled: boolean
      pressed: boolean
      actionLabel: string
    }
```

`AvailabilityCalendarWeek` continues consuming `basket: BookingBasketProps`. For each rendered slot it passes the interactive chip variant with explicit props. In basket mode, `selected = basket.isSelected(slot.selection)` determines click behavior, `pressed`, and Add/Remove label. In normal booking mode, `pressed` is `false`, `disabled` derives from `bookingActionMode`, and the label begins `Book`.

- [ ] **Step 1: Add failing chip and calendar tests**

```tsx
render(
  <AvailabilityCapacityChip
    actionLabel="Remove 15:00-16:00, 4 spots free"
    disabled={false}
    onClick={vi.fn()}
    pressed
    slot={slot}
  />,
)

const chip = screen.getByRole('button', {
  name: 'Remove 15:00-16:00, 4 spots free',
})
expect(chip).toHaveAttribute('aria-pressed', 'true')
expect(chip).toHaveClass('border-primary')
```

Add a calendar-week test with a basket that selects one fixture slot. Assert its capacity chip has `aria-pressed="true"` and a Remove label; assert an unselected slot has `aria-pressed="false"` and an Add label.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `pnpm test src/features/availability/components/availability-badge.test.tsx src/features/availability/components/AvailabilityCalendarWeek.test.tsx`

Expected: FAIL because the chip does not accept explicit interaction props and the calendar does not pass selected state through.

- [ ] **Step 3: Implement the discriminated chip contract**

```tsx
const chipClassName = cn(
  getAvailabilityChipClassName(slot),
  onClick !== undefined && availabilityChipInteractiveClassName,
  pressed && 'border-primary bg-primary/25 text-primary ring-2 ring-primary/50',
  className,
)
```

Render a span for the static variant. Render a button for the interactive variant with `disabled`, `aria-label={actionLabel}`, and `aria-pressed={pressed}`. Do not retain fallback interactive labels or optional interactive state.

- [ ] **Step 4: Wire explicit state from the calendar week**

```ts
const selected = basket.isSelected(slot.selection)

const slotAction = basket.kind === 'basket'
  ? {
      actionLabel: `${selected ? 'Remove' : 'Add'} ${slot.startTime}-${slot.endTime}, ${slot.freeCapacity} spots free`,
      disabled: false,
      onClick: () =>
        (selected ? basket.onRemoveSelection : basket.onAddSelection)(slot.selection),
      pressed: selected,
    }
  : {
      actionLabel: `Book ${slot.startTime}-${slot.endTime}, ${slot.freeCapacity} spots free`,
      disabled: bookingActionMode === 'disabled',
      onClick: () => onBookSelection(slot.selection),
      pressed: false,
    }
```

Do not use optional callbacks or change `BookingBasketProps`.

- [ ] **Step 5: Run focused tests to verify success**

Run: `pnpm test src/features/availability/components/availability-badge.test.tsx src/features/availability/components/AvailabilityCalendarWeek.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the chip and calendar behavior**

```bash
git add src/features/availability/components/availability-badge.tsx src/features/availability/components/availability-badge.test.tsx src/features/availability/components/AvailabilityCalendarWeek.tsx src/features/availability/components/AvailabilityCalendarWeek.test.tsx
```

### Task 2: Demonstrate And Verify Selected Calendar Slots

**Files:**
- Modify: `src/features/availability/components/AvailabilityCalendarGrid.test.tsx`
- Modify only if needed: `src/features/availability/components/AvailabilityCalendarGrid.stories.tsx`

**Interfaces:**
- The existing explicit `basket: BookingBasketProps` grid API remains unchanged.
- `BasketSelection` story continues passing selected fixture data through the basket contract.

- [ ] **Step 1: Consult Storybook documentation and instructions**

Use the project Storybook tools for `availability-calendargrid` and fetch story-writing instructions before modifying its story file.

- [ ] **Step 2: Add a failing grid-level assertion**

```tsx
expect(
  screen.getByRole('button', { name: /^Remove 15:00-16:00/ }),
).toHaveAttribute('aria-pressed', 'true')

expect(
  screen.getByRole('button', { name: /^Add 16:00-17:00/ }),
).toHaveAttribute('aria-pressed', 'false')
```

- [ ] **Step 3: Run the grid test to verify the Task 1 behavior through the grid**

Run: `pnpm test src/features/availability/components/AvailabilityCalendarGrid.test.tsx`

Expected: PASS. Task 1 already established the selected-state props; this task proves they reach the public grid rendering.

- [ ] **Step 4: Update the existing basket story only if the selected fixture is absent**

Use the existing `BasketSelection` story and current fixture/provider conventions. Do not add another selection model or change the grid interface.

- [ ] **Step 5: Run focused verification**

```bash
pnpm test src/features/availability/components/AvailabilityCalendarGrid.test.tsx src/features/availability/components/availability-badge.test.tsx src/features/availability/components/AvailabilityCalendarWeek.test.tsx
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

Expected: every command exits 0.

- [ ] **Step 6: Commit grid coverage and story changes**

```bash
git add src/features/availability/components/AvailabilityCalendarGrid.test.tsx src/features/availability/components/AvailabilityCalendarGrid.stories.tsx
```
