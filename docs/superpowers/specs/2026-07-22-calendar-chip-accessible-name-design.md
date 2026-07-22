# Calendar Chip Accessible Name

## Scope

Update `AvailabilityCapacityChip` without changing `AvailabilityCapacityChipProps`.

## Behavior

Interactive chips derive their accessible name only from the existing `slot` and
`pressed` props:

- Pressed chips are named `Remove <start>-<end>, <freeCapacity> spots free`.
- Unpressed chips are named `Book <start>-<end>, <freeCapacity> spots free`.

The button continues to expose `aria-pressed={pressed}` and the current selected
visual classes. Its visible content remains the numeric free capacity.

Non-interactive chips remain plain text spans with no button role or button
semantics.

## Tests

Add component assertions for the pressed and unpressed button names while
preserving the existing pressed-state and selected-style checks. Update calendar
tests and Storybook interaction assertions from the prior `Add` label to `Book`.

Run focused availability chip and calendar tests, then Storybook story tests when
the Storybook server is available.
