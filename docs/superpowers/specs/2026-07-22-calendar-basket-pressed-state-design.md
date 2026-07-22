# Calendar Basket Pressed State Design

## Goal

Make selected calendar slots visibly and semantically selected while preserving PR 3's explicit `BookingBasketProps` contract.

## Scope

- Require `disabled`, `pressed`, and `actionLabel` for interactive `AvailabilityCapacityChip` instances.
- Render `aria-pressed` for interactive calendar slot chips.
- Apply a clear selected treatment to a pressed chip.
- In `AvailabilityCalendarWeek`, derive selection state from `basket.isSelected(slot.selection)` when `basket.kind === 'basket'`.
- Use Add/Remove accessible labels matching the selection state.
- Add focused chip and calendar-week tests and update an existing calendar basket story only if needed to show the selected state.

## Contract

`BookingBasketProps` remains unchanged. The calendar week continues to receive one explicit basket object, then derives click behavior, `pressed`, and accessible label from that object.

`AvailabilityCapacityChip` has a discriminated props contract. A static capacity display is a span without `onClick`. Every interactive caller must explicitly supply its full behavior, accessibility, and visual state:

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

Single-booking calendar chips pass `pressed={false}`, their current disabled state, and a `Book ...` action label. For a selected basket slot, the chip renders `aria-pressed="true"`, uses an action label beginning `Remove`, and applies a primary-color border/background/ring treatment. An unselected basket slot renders `aria-pressed="false"` with an action label beginning `Add`.

## Out Of Scope

- No changes to `BookingBasketProps`.
- No optional callback refactor in calendar, grid, overview, or card components.
- No cross-cable replacement dialog.
- No fixed review-action redesign.
- No changes to the existing card/list Add/Remove control, which already exposes pressed state.

## Verification

- `AvailabilityCapacityChip` tests cover interactive pressed and unpressed semantics.
- `AvailabilityCalendarWeek` or grid tests cover selected slot `aria-pressed="true"`, Remove label, selected visual class, and unselected Add label.
- Run the affected test files, `pnpm lint`, `pnpm test`, `pnpm typecheck`, and `pnpm build`.
