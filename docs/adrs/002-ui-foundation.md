# ADR 002: UI foundation and app shell

## Status

Accepted

## Summary

| Question | Decision |
| --- | --- |
| What UI foundation should the app use? | **Tailwind CSS** with **shadcn/ui-style shared primitives** |
| What should the primary surface be? | **Availability** remains the only primary surface |
| How should settings be accessed? | Through a secondary **sheet/dialog** flow instead of equal top-level navigation |

## Context

The walking skeleton established the core product behavior:

- load and switch cable availability
- save booking details locally
- run the mocked booking flow
- show success, failure, and payment-required outcomes

That functional baseline was useful, but the UI was still built from bespoke screen-level CSS and treated Availability and Settings as equal peer destinations.

That shape worked for the skeleton, but it was not the best fit for the product's main job:

1. open the app
2. review availability
3. choose a slot
4. book quickly

## Decision

Adopt a **Tailwind-based shared UI foundation** using **shadcn/ui-style component primitives** and refactor the application shell around an **availability-first** interaction model.

This means:

- shared UI primitives live in `src/components/ui/`
- Availability remains the main and only primary surface
- Settings moves into a secondary sheet/dialog flow
- feature logic stays inside `src/features/*`
- old bespoke screen CSS is removed as areas are migrated

## Why this approach

### 1. It improves speed without locking the product in

shadcn/ui-style components provide a fast starting point while keeping the code in the repository instead of hiding it behind a black-box component package.

That matches the product's current stage well:

- fast iteration matters
- the UI still needs to evolve
- future customization should stay straightforward

### 2. It fits the actual product hierarchy

Quickbook is primarily a booking tool, not a multi-screen utility shell.

Availability should be front and center, while settings is supporting configuration. Moving settings behind a secondary entry point keeps the main flow obvious on mobile.

### 3. It keeps presentation separate from feature logic

The app already has useful feature boundaries:

- `features/availability`
- `features/booking`
- `features/settings`

Using shared UI primitives preserves that structure instead of flattening everything into one styling layer.

## Implementation notes

The initial shared foundation includes components such as:

- `button`
- `card`
- `input`
- `label`
- `tabs`
- `sheet`
- `alert`
- `badge`
- `skeleton`

Not every form control must use a Radix-backed component immediately. The foundation is meant to improve the product incrementally, not force complexity where a simpler control is more robust.

## Visual direction

The app should use a **dark-first visual language** inspired by the shadcn/ui website rather than maintaining a bright custom light theme.

That means:

- dark slate / zinc-like backgrounds
- low-contrast borders
- bright foreground text
- restrained accent color usage
- subtle gradients, blur, and layered surfaces

This is a direction for the product's theme and polish, not a requirement to clone the shadcn site layout 1:1.

## Consequences

### Positive

- stronger mobile-first interaction model
- clearer booking-first hierarchy
- reusable shared component base
- easier future UI iteration
- less bespoke CSS to maintain

### Trade-offs

- Tailwind becomes part of the frontend toolchain
- the app gains a small set of UI dependencies
- tests need to target updated semantics and interaction patterns

## Follow-up expectations

- continue building new UI surfaces on top of the shared primitives
- keep settings secondary unless the product later gains multiple true top-level areas
- prefer behavior-focused tests over markup-specific assertions as the UI evolves
